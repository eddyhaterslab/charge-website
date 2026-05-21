/**
 * Database types — Charge Platform
 * ================================
 * Hand-written to match supabase/migrations/001_charge_platform.sql.
 * In production, regenerate via `supabase gen types typescript` after schema changes.
 */

export type UserRole = 'super_admin' | 'pop' | 'installer' | 'org_owner' | 'org_admin' | 'org_driver';
export type OrgTier = 'starter' | 'pro' | 'enterprise';
export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'paused';
export type ChargerState = 'online' | 'offline' | 'charging' | 'fault' | 'maintenance';
export type SessionStatus = 'started' | 'completed' | 'failed' | 'reconciled';
export type ReimbursementStatus = 'pending' | 'approved' | 'exported' | 'paid' | 'disputed';
export type InstallationStatus = 'quote' | 'scheduled' | 'in_progress' | 'commissioned' | 'verified';
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'void';
export type TicketStatus = 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';
export type BelgianProvince =
  | 'antwerp' | 'east_flanders' | 'flemish_brabant' | 'limburg' | 'west_flanders'
  | 'brussels' | 'walloon_brabant' | 'hainaut' | 'liege' | 'luxembourg' | 'namur';

export interface Organization {
  id: string;
  name: string;
  vat_number: string | null;
  billing_email: string;
  billing_address: Record<string, unknown> | null;
  province: BelgianProvince | null;
  tier: OrgTier;
  payroll_provider: 'sd_worx' | 'securex' | 'acerta' | 'liantis' | 'other' | null;
  payroll_external_id: string | null;
  fleet_size_band: string | null;
  pop_id: string | null;
  acquisition_channel: string | null;
  metadata: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: UserRole;
  organization_id: string | null;
  language: 'nl' | 'fr' | 'en' | 'de';
  metadata: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Site {
  id: string;
  organization_id: string;
  name: string;
  type: 'office' | 'depot' | 'home' | 'public' | 'apartment' | null;
  address: Record<string, unknown>;
  province: BelgianProvince | null;
  dso: 'fluvius' | 'ores' | 'sibelga' | null;
  grid_capacity_kw: number | null;
  created_at: string;
  updated_at: string;
}

export interface Charger {
  id: string;
  organization_id: string;
  site_id: string;
  serial_number: string;
  brand: string;
  model: string;
  power_kw: number;
  connector_type: string;
  ampeco_id: string | null;
  installed_at: string | null;
  status: ChargerState;
  last_seen_at: string | null;
  firmware_version: string | null;
  metadata: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChargingSession {
  id: string;
  organization_id: string;
  charger_id: string;
  user_id: string | null;
  rfid_token: string | null;
  ampeco_session_id: string | null;
  started_at: string;
  ended_at: string | null;
  energy_kwh: number | null;
  peak_power_kw: number | null;
  status: SessionStatus;
  location_type: 'work' | 'home' | 'public';
  cost_eur: number | null;
  reimbursement_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface Reimbursement {
  id: string;
  organization_id: string;
  user_id: string;
  period_year: number;
  period_month: number;
  total_kwh: number;
  applied_rate_eur_per_kwh: number;
  total_amount_eur: number;
  session_count: number;
  status: ReimbursementStatus;
  exported_at: string | null;
  exported_to_payroll_at: string | null;
  payroll_export_reference: string | null;
  audit_trail: Array<Record<string, unknown>>;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  organization_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  status: SubscriptionStatus;
  tier: OrgTier;
  per_charger_fee_eur: number;
  per_user_fee_eur: number;
  active_chargers: number;
  active_users: number;
  current_period_starts_at: string | null;
  current_period_ends_at: string | null;
  trial_ends_at: string | null;
  canceled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: Organization;
        Insert: Partial<Organization> & Pick<Organization, 'name' | 'billing_email'>;
        Update: Partial<Organization>;
        Relationships: [];
      };
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & Pick<Profile, 'id' | 'email' | 'role'>;
        Update: Partial<Profile>;
        Relationships: [];
      };
      sites: {
        Row: Site;
        Insert: Partial<Site> & Pick<Site, 'organization_id' | 'name' | 'address'>;
        Update: Partial<Site>;
        Relationships: [];
      };
      chargers: {
        Row: Charger;
        Insert: Partial<Charger> & Pick<Charger, 'organization_id' | 'site_id' | 'serial_number' | 'brand' | 'model' | 'power_kw'>;
        Update: Partial<Charger>;
        Relationships: [];
      };
      charging_sessions: {
        Row: ChargingSession;
        Insert: Partial<ChargingSession> & Pick<ChargingSession, 'organization_id' | 'charger_id' | 'started_at' | 'location_type'>;
        Update: Partial<ChargingSession>;
        Relationships: [];
      };
      reimbursements: {
        Row: Reimbursement;
        Insert: Partial<Reimbursement> & Pick<Reimbursement, 'organization_id' | 'user_id' | 'period_year' | 'period_month' | 'total_kwh' | 'applied_rate_eur_per_kwh' | 'total_amount_eur' | 'session_count'>;
        Update: Partial<Reimbursement>;
        Relationships: [];
      };
      subscriptions: {
        Row: Subscription;
        Insert: Partial<Subscription> & Pick<Subscription, 'organization_id' | 'tier'>;
        Update: Partial<Subscription>;
        Relationships: [];
      };
    };
    Views: { [key: string]: never };
    Functions: {
      auth_org_id: { Args: Record<string, never>; Returns: string | null };
      auth_is_super_admin: { Args: Record<string, never>; Returns: boolean };
    };
    Enums: { [key: string]: never };
    CompositeTypes: { [key: string]: never };
  };
}
