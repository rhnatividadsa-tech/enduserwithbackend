import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SupabaseAuthGuard } from './guards/supabase-auth.guard';

/**
 * Auth module is fully decoupled:
 *  - It only depends on the global SupabaseModule (injected automatically).
 *  - It can be extracted into its own NestJS microservice by swapping
 *    the SupabaseModule import for a transport-layer client (TCP, RMQ, etc.).
 */
@Module({
  controllers: [AuthController],
  providers: [AuthService, SupabaseAuthGuard],
  exports: [AuthService, SupabaseAuthGuard],
})
export class AuthModule {}
