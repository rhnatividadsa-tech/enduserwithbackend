import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { createClient } from '@supabase/supabase-js';

/**
 * ─────────────────────────────────────────────────────────────
 *  AUTH SERVICE — Multi-Step Registration with Rollback
 * ─────────────────────────────────────────────────────────────
 *
 *  Registration is a 3-step saga:
 *    Step A → supabase.auth.signUp   (create credentials)
 *    Step B → storage.upload          (upload ID document)
 *    Step C → user_profiles.insert    (create profile row)
 *
 *  If ANY later step fails, previous steps are rolled back:
 *    - Step C fails → delete uploaded file, delete auth user
 *    - Step B fails → delete auth user
 *
 *  This "compensating transaction" pattern ensures we never
 *  leave orphaned data across Supabase Auth / Storage / DB.
 * ─────────────────────────────────────────────────────────────
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly BUCKET = 'identity-documents';

  constructor(private readonly supabase: SupabaseService) {}

  // ───────────────────── REGISTRATION ─────────────────────

  async register(
    dto: CreateUserDto,
    file: Express.Multer.File,
  ) {
    const client = this.supabase.getClient();

    // ── STEP A: Create auth credentials ──
    const { data: authData, error: authError } =
      await client.auth.admin.createUser({
        email: dto.email,
        password: dto.password,
        email_confirm: true, // auto-confirm; identity is verified by admin via is_verified flag
      });

    if (authError) {
      this.logger.warn(`Auth signUp failed: ${authError.message}`);
      throw new BadRequestException(authError.message);
    }

    const userId = authData.user.id;
    this.logger.log(`Step A complete — auth user created: ${userId}`);

    // ── STEP B: Upload ID document to Supabase Storage ──
    let idUrl: string;
    const filePath = `${userId}/${Date.now()}-${file.originalname}`;

    try {
      const { error: uploadError } = await client.storage
        .from(this.BUCKET)
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      // Generate a public URL (or signed URL if the bucket is private)
      const { data: urlData } = client.storage
        .from(this.BUCKET)
        .getPublicUrl(filePath);

      idUrl = urlData.publicUrl;
      this.logger.log(`Step B complete — document uploaded: ${filePath}`);
    } catch (uploadErr: any) {
      // ROLLBACK Step A: delete the auth user we just created
      this.logger.error(`Step B failed — rolling back auth user ${userId}`);
      await this.rollbackAuthUser(userId);
      throw new InternalServerErrorException(
        `Document upload failed: ${uploadErr.message}`,
      );
    }

    // ── STEP C: Insert profile row (application-level link) ──
    try {
      const { error: profileError } = await client
        .from('user_profiles')
        .insert({
          auth_user_id: userId,               // logic link — NOT a FK
          first_name: dto.first_name,
          last_name: dto.last_name,
          phone: this.normalizePhone(dto.phone),
          dob: dto.dob,
          address: dto.address ?? null,
          barangay: dto.barangay ?? null,
          municipality: dto.municipality ?? null,
          province: dto.province ?? null,
          id_url: idUrl,
          is_verified: false,                  // admin verifies later
          role: 'end_user',                    // default role
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (profileError) {
        throw new Error(profileError.message);
      }

      this.logger.log(`Step C complete — profile created for ${userId}`);
    } catch (profileErr: any) {
      // ROLLBACK Steps A + B
      this.logger.error(
        `Step C failed — rolling back storage + auth for ${userId}`,
      );
      await this.rollbackStorageFile(filePath);
      await this.rollbackAuthUser(userId);
      throw new InternalServerErrorException(
        `Profile creation failed: ${profileErr.message}`,
      );
    }

    // ── SUCCESS: return safe response (no password, no service keys) ──
    return {
      message: 'Registration successful. Please verify your email.',
      userId,
      email: dto.email,
    };
  }

  // ───────────────────── LOGIN ─────────────────────

  async login(dto: LoginUserDto) {
    // Use an anon-level client for login so we get back the user's JWT
    const anonClient = createClient(
      this.supabase.getUrl(),
      this.supabase.getAnonKey(),
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    const { data, error } = await anonClient.auth.signInWithPassword({
      email: dto.email,
      password: dto.password,
    });

    if (error) {
      this.logger.warn(`Login failed for ${dto.email}: ${error.message}`);
      if (error.message.toLowerCase().includes('email not confirmed')) {
        throw new UnauthorizedException('Email not confirmed. Please check your inbox and confirm your account.');
      }
      throw new UnauthorizedException('Invalid email or password.');
    }

    // Fetch the user's profile via application-level link
    const { data: profile } = await this.supabase
      .getClient()
      .from('user_profiles')
      .select('*')
      .eq('auth_user_id', data.user.id)
      .single();

    return {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
      user: {
        id: data.user.id,
        email: data.user.email,
        profile: profile ?? null,
      },
    };
  }

  // ───────────────────── GET PROFILE (protected) ─────────────────────

  async getProfile(authUserId: string) {
    const { data, error } = await this.supabase
      .getClient()
      .from('user_profiles')
      .select('*')
      .eq('auth_user_id', authUserId)
      .single();

    if (error || !data) {
      throw new BadRequestException('Profile not found.');
    }

    return data;
  }

  // ───────────────────── CHECK EMAIL EXISTS ─────────────────────

  async checkEmailExists(email: string) {
    const { data, error } = await this.supabase
      .getClient()
      .from('user_profiles')
      .select('auth_user_id')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    // Fallback: query Supabase Auth directly if user_profiles has no email column
    if (!data) {
      const { data: listData, error: listError } = await this.supabase
        .getClient()
        .auth.admin.listUsers();

      if (listError) {
        throw new InternalServerErrorException('Unable to verify email.');
      }

      const found = listData.users.some(
        (u) => u.email?.toLowerCase() === email.toLowerCase().trim(),
      );

      if (!found) {
        throw new BadRequestException('No account found with that email address.');
      }
    }

    return { exists: true };
  }

  // ───────────────────── RESET PASSWORD ─────────────────────

  async resetPassword(email: string, newPassword: string) {
    // Find the user by email in Supabase Auth
    const { data: listData, error: listError } = await this.supabase
      .getClient()
      .auth.admin.listUsers();

    if (listError) {
      throw new InternalServerErrorException('Unable to process request.');
    }

    const user = listData.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase().trim(),
    );

    if (!user) {
      throw new BadRequestException('No account found with that email address.');
    }

    const { error: updateError } = await this.supabase
      .getClient()
      .auth.admin.updateUserById(user.id, { password: newPassword });

    if (updateError) {
      this.logger.warn(`Password reset failed for ${email}: ${updateError.message}`);
      throw new InternalServerErrorException('Failed to update password.');
    }

    this.logger.log(`Password reset successful for ${email}`);
    return { message: 'Password updated successfully.' };
  }

  // ───────────────────── ROLLBACK HELPERS ─────────────────────

  /**
   * Normalizes a Philippine phone number to E.164 format.
   *  "9155232123"     → "+639155232123"
   *  "09155232123"    → "+639155232123"
   *  "+639155232123"  → "+639155232123" (no change)
   */
  private normalizePhone(raw: string): string {
    const digits = raw.replace(/[\s\-()]/g, '');

    // Already in E.164 with PH country code
    if (digits.startsWith('+63')) return digits;

    // Local format starting with 0  (09xx...)
    if (digits.startsWith('0') && digits.length === 11) {
      return `+63${digits.slice(1)}`;
    }

    // Raw 10-digit mobile number (9xx...)
    if (digits.length === 10 && digits.startsWith('9')) {
      return `+63${digits}`;
    }

    // Fallback — return as-is (DTO regex already validated it)
    return digits;
  }

  private async rollbackAuthUser(userId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .getClient()
        .auth.admin.deleteUser(userId);

      if (error) {
        this.logger.error(`Rollback auth user failed: ${error.message}`);
      } else {
        this.logger.warn(`Rolled back auth user: ${userId}`);
      }
    } catch (err: any) {
      this.logger.error(`Rollback auth user exception: ${err.message}`);
    }
  }

  private async rollbackStorageFile(filePath: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .getClient()
        .storage.from(this.BUCKET)
        .remove([filePath]);

      if (error) {
        this.logger.error(`Rollback storage file failed: ${error.message}`);
      } else {
        this.logger.warn(`Rolled back storage file: ${filePath}`);
      }
    } catch (err: any) {
      this.logger.error(`Rollback storage file exception: ${err.message}`);
    }
  }
}
