import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService implements OnModuleInit {
  private client!: SupabaseClient;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const url = this.config.getOrThrow<string>('SUPABASE_URL');
    const serviceRoleKey = this.config.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY');

    this.client = createClient(url, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  getClient(): SupabaseClient {
    return this.client;
  }

  getAnonKey(): string {
    return this.config.getOrThrow<string>('SUPABASE_ANON_KEY');
  }

  getUrl(): string {
    return this.config.getOrThrow<string>('SUPABASE_URL');
  }

  // --- BAYANIHUB WORKFLOW INSERTS ---

  async insertVolunteerApplication(data: any, volunteerAuthId: string, file?: Express.Multer.File) {
    if (!data.campaign_id || !data.role) {
      throw new Error("Missing campaign_id or role in application payload.");
    }

    // 1. Resolve role_id safely
    let { data: roles } = await this.client
      .from('volunteer_roles')
      .select('id')
      .eq('campaign_id', data.campaign_id)
      .ilike('title', data.role)
      .limit(1);

    let roleId;
    if (!roles || roles.length === 0) {
      // Auto-provision an 'open' role if it doesn't already exist for this campaign
      const { data: newRole, error: roleErr } = await this.client
        .from('volunteer_roles')
        .insert([{
          campaign_id: data.campaign_id,
          title: data.role,
          status: 'open',
          slots_total: 10
        }]).select('id').single();
      if (roleErr) throw new Error(`Role Creation Error: ${roleErr.message}`);
      roleId = newRole.id;
    } else {
      roleId = roles[0].id;
    }

    // 2. Upload Document (if provided)
    let resumeKey = null;
    if (file) {
      const BUCKET = 'volunteer-documents.';
      const filePath = `${volunteerAuthId}/${Date.now()}-${file.originalname}`;
      
      const { error: uploadError } = await this.client.storage
        .from(BUCKET)
        .upload(filePath, file.buffer, { contentType: file.mimetype });
        
      if (uploadError) throw new Error(`Document upload error: ${uploadError.message}`);
      
      const { data: urlData } = this.client.storage.from(BUCKET).getPublicUrl(filePath);
      resumeKey = urlData.publicUrl;
    }

    // 3. Condense Questionnaire Data into Motivation field
    const motivationStr = `Questionnaire Assessment:
- Disaster Experience: ${data.disaster_experience === 'true' ? 'Yes' : 'No'}
- Rugged Environment Comfort: ${data.rugged_environment === 'true' ? 'Yes' : 'No'}
- Medical Conditions/Restrictions: ${data.medical_conditions === 'true' ? 'Yes' : 'No'}
- Vaccinations Current: ${data.vaccinations_current === 'true' ? 'Yes' : 'No'}
- Can Lift 25lbs: ${data.can_lift_25lbs === 'true' ? 'Yes' : 'No'}
- Transportation: ${data.has_transportation === 'true' ? 'Yes' : 'No'} (${data.transportation_mode || 'N/A'})
- Background Check Agreed: ${data.background_check_agreed === 'true' ? 'Yes' : 'No'}
- Required Documents Provided: ${data.documents_agreed === 'true' ? 'Yes' : 'No'}
- Over 18: ${data.age_verified === 'true' ? 'Yes' : 'No'}
- Code of Conduct / Safety Agreed: Yes`;

    // 4. Insert Application
    const { data: result, error } = await this.client
      .from('volunteer_applications')
      .insert([{
        role_id: roleId,
        volunteer_auth_id: volunteerAuthId,
        motivation: motivationStr,
        skills: [data.role],
        availability: data.time_slot,
        resume_key: resumeKey,
        status: 'submitted'
      }])
      .select();
      
    if (error) throw new Error(`Supabase Error: ${error.message}`);
    return result;
  }

  async getVolunteerCampaigns() {
    const { data: result, error } = await this.client
      .from('bh_campaigns')
      .select('id, title, type')
      .in('type', ['volunteer', 'combined'])
      .eq('status', 'active');
      
    if (error) throw new Error(`Supabase Error: ${error.message}`);
    return result;
  }

  async getActiveCampaigns() {
    const { data: result, error } = await this.client
      .from('bh_campaigns')
      .select('id, title, type')
      .in('type', ['donation', 'combined'])
      .eq('status', 'active');
      
    if (error) throw new Error(`Supabase Error: ${error.message}`);
    return result;
  }

  async insertDonation(donationData: any, donorAuthId: string) {
    const { campaign_id, items } = donationData;
    
    if (!campaign_id || !items || !Array.isArray(items)) {
      throw new Error("Invalid donation payload. Mission campaign_id or items array.");
    }

    const rows = items.map((item: any) => ({
      campaign_id,
      donor_auth_id: donorAuthId,
      status: 'pending',
      item_name: item.name,
      quantity: parseInt(item.qty, 10) || 1,
      unit: (item.unit || 'pieces').toLowerCase(),
      condition: (item.condition || 'good').toLowerCase().replace(/\s+|-/g, '_'),
    }));

    const { data: result, error } = await this.client
      .from('donations')
      .insert(rows)
      .select();
      
    if (error) throw new Error(`Supabase Error: ${error.message}`);
    return result;
  }
}