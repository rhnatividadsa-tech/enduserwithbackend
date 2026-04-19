import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { SupabaseService } from '../../supabase/supabase.service';

/**
 * Custom AuthGuard that validates Supabase JWTs.
 *
 * How it works:
 * 1. Extracts the Bearer token from the Authorization header.
 * 2. Calls supabase.auth.getUser(token) — this verifies the JWT
 *    signature against Supabase's secret and checks expiration.
 * 3. Attaches the authenticated user to `request.user`.
 *
 * Usage:  @UseGuards(SupabaseAuthGuard) on any controller or route.
 */
@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(private readonly supabase: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Missing authorization token.');
    }

    const { data, error } = await this.supabase
      .getClient()
      .auth.getUser(token);

    if (error || !data.user) {
      throw new UnauthorizedException('Invalid or expired token.');
    }

    // Attach the verified Supabase user to the request object
    (request as any).user = data.user;
    return true;
  }

  private extractToken(request: Request): string | null {
    const header = request.headers.authorization;
    if (!header) return null;

    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) return null;

    return token;
  }
}
