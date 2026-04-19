import { Module } from '@nestjs/common';
import { SupabaseModule } from '../supabase/supabase.module';
import { FormsController } from './forms.controller';

@Module({
  imports: [SupabaseModule], 
  controllers: [FormsController],
})
export class FormsModule {}