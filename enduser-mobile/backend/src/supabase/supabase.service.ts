import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService implements OnModuleInit {
  private client!: SupabaseClient;
  private damayanClient!: SupabaseClient;
  private readonly logger = new Logger(SupabaseService.name);

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    // BayaniHub DB (primary)
    const url = this.config.getOrThrow<string>('SUPABASE_URL');
    const serviceRoleKey = this.config.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY');

    this.client = createClient(url, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Damayan DB (external disaster management)
    const damayanUrl = this.config.getOrThrow<string>('DAMAYAN_SUPABASE_URL');
    const damayanKey = this.config.getOrThrow<string>('DAMAYAN_SERVICE_ROLE_KEY');

    this.damayanClient = createClient(damayanUrl, damayanKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    this.logger.log('Connected to BayaniHub DB and Damayan DB');
  }

  getClient(): SupabaseClient {
    return this.client;
  }

  getDamayanClient(): SupabaseClient {
    return this.damayanClient;
  }

  getAnonKey(): string {
    return this.config.getOrThrow<string>('SUPABASE_ANON_KEY');
  }

  getUrl(): string {
    return this.config.getOrThrow<string>('SUPABASE_URL');
  }

  // --- BAYANIHUB WORKFLOW INSERTS ---

  async insertVolunteerApplication(data: any, volunteerAuthId: string, file?: Express.Multer.File) {
    if (!data.center_id || !data.role) {
      throw new Error("Missing center_id or role in application payload.");
    }

    // 1. Resolve role_id — find or create a role for this evacuation center
    let { data: roles } = await this.client
      .from('volunteer_roles')
      .select('id')
      .ilike('title', data.role)
      .limit(1);

    let roleId;
    if (!roles || roles.length === 0) {
      // Auto-provision a role (not campaign-bound since we now use evacuation centers)
      const { data: newRole, error: roleErr } = await this.client
        .from('volunteer_roles')
        .insert([{
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
- Evacuation Center: ${data.center_name || 'N/A'}
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
    // Fetch open evacuation centers from Damayan DB
    const { data: result, error } = await this.damayanClient
      .from('evacuation_centers')
      .select('id, name, municipality, barangay, status, capacity, current_occupancy')
      .eq('status', 'open');
      
    if (error) throw new Error(`Damayan DB Error: ${error.message}`);
    return result;
  }

  async getActiveCampaigns() {
    // Fetch ongoing relief operations from Damayan DB
    const { data: result, error } = await this.damayanClient
      .from('relief_operations')
      .select('id, name, description, status')
      .eq('status', 'ongoing');
      
    if (error) throw new Error(`Damayan DB Error: ${error.message}`);
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