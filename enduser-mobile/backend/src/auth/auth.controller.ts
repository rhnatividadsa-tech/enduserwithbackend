import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { SupabaseAuthGuard } from './guards/supabase-auth.guard';
import { FileValidationPipe } from '../common/pipes/file-validation.pipe';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /api/v1/auth/register
   *
   * Accepts multipart/form-data with:
   *   - All CreateUserDto fields as text fields
   *   - `id_document` as a file field (JPG / PNG / PDF, max 10 MB)
   *
   * The FileValidationPipe validates MIME type, size, and magic bytes
   * BEFORE the service layer is reached.
   */
  @Post('register')
  @UseInterceptors(
    FileInterceptor('id_document', {
      limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB hard limit at Multer level
    }),
  )
  async register(
    @Body() dto: CreateUserDto,
    @UploadedFile(new FileValidationPipe()) file: Express.Multer.File,
  ) {
    return this.authService.register(dto, file);
  }

  /**
   * POST /api/v1/auth/login
   *
   * Returns { access_token, refresh_token, user } on success.
   */
  @Post('login')
  async login(@Body() dto: LoginUserDto) {
    return this.authService.login(dto);
  }

  /**
   * POST /api/v1/auth/check-email
   *
   * Checks whether an email belongs to a registered end-user account.
   * Returns 200 { exists: true } if found, 400 if not.
   */
  @Post('check-email')
  async checkEmail(@Body() body: { email: string }) {
    return this.authService.checkEmailExists(body.email);
  }

  /**
   * POST /api/v1/auth/reset-password
   *
   * Resets the password for the given email (no OTP required — OTP
   * will be added later via mail integration).
   */
  @Post('reset-password')
  async resetPassword(@Body() body: { email: string; newPassword: string }) {
    return this.authService.resetPassword(body.email, body.newPassword);
  }

  /**
   * GET /api/v1/auth/profile
   *
   * Protected route — requires a valid Supabase JWT in the
   * Authorization: Bearer <token> header.
   */
  @Get('profile')
  @UseGuards(SupabaseAuthGuard)
  async getProfile(@Req() req: Request) {
    const user = (req as any).user;
    return this.authService.getProfile(user.id);
  }
}
