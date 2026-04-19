import { Body, Controller, HttpException, HttpStatus, Post, Get, UseGuards, Req, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SupabaseService } from '../supabase/supabase.service';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { Request } from 'express';

@Controller('forms')
export class FormsController {
  constructor(private readonly supabaseService: SupabaseService) {}

  @Get('campaigns')
  async getCampaigns() {
    try {
      const result = await this.supabaseService.getActiveCampaigns();
      return { success: true, data: result };
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('campaigns/volunteer')
  async getVolunteerCampaigns() {
    try {
      const result = await this.supabaseService.getVolunteerCampaigns();
      return { success: true, data: result };
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('volunteer')
  @UseGuards(SupabaseAuthGuard)
  @UseInterceptors(FileInterceptor('resume', { limits: { fileSize: 10 * 1024 * 1024 } })) // 10MB Limit
  async submitVolunteer(
    @Body() volunteerData: any, 
    @Req() req: Request,
    @UploadedFile() file?: Express.Multer.File
  ) {
    try {
      const user = (req as any).user;
      const result = await this.supabaseService.insertVolunteerApplication(volunteerData, user.id, file);
      return { success: true, data: result };
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('donation')
  @UseGuards(SupabaseAuthGuard)
  async submitDonation(@Body() donationData: any, @Req() req: Request) {
    try {
      const user = (req as any).user;
      const result = await this.supabaseService.insertDonation(donationData, user.id);
      return { success: true, data: result };
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}