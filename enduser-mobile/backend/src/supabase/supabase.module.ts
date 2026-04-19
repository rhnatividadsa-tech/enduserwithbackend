import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseService } from './supabase.service';

@Global() // available everywhere without re-importing
@Module({
  imports: [ConfigModule],
  providers: [SupabaseService],
  exports: [SupabaseService],
})
export class SupabaseModule {}
