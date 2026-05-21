-- ============================================================
-- CHARGE PLATFORM — Initial Schema (v1)
-- ============================================================
-- Multi-tenant Postgres with Row Level Security.
-- Every business table carries tenant_id (organization_id).
-- Users belong to ONE organization (their company).
-- Internal Charge staff are global admins (no organization).
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- ============================================================
-- ENUMS
-- ============================================================

create type user_role as enum (
  'super_admin',       -- Charge internal staff (global)
  'pop',               -- Provincial Operating Partner
  'installer',         -- Freelance installer
  'org_owner',         -- Customer org primary contact (CFO, CEO)
  'org_admin',         -- Customer org HR/Fleet manager
  'org_driver'         -- Customer org employee with company EV
);

create type organization_tier as enum ('starter', 'pro', 'enterprise');
create type subscription_status as enum ('trialing', 'active', 'past_due', 'canceled', 'paused');
create type charger_status as enum ('online', 'offline', 'charging', 'fault', 'maintenance');
create type session_status as enum ('started', 'completed', 'failed', 'reconciled');
create type reimbursement_status as enum ('pending', 'approved', 'exported', 'paid', 'disputed');
create type installation_status as enum ('quote', 'scheduled', 'in_progress', 'commissioned', 'verified');
create type invoice_status as enum ('draft', 'sent', 'paid', 'overdue', 'void');
create type ticket_status as enum ('open', 'in_progress', 'waiting', 'resolved', 'closed');
create type ticket_priority as enum ('low', 'medium', 'high', 'critical');
create type belgian_province as enum (
  'antwerp', 'east_flanders', 'flemish_brabant', 'limburg', 'west_flanders',
  'brussels', 'walloon_brabant', 'hainaut', 'liege', 'luxembourg', 'namur'
);

-- ============================================================
-- ORGANIZATIONS (the customer companies)
-- ============================================================
create table organizations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  vat_number text unique,
  billing_email text not null,
  billing_address jsonb,
  province belgian_province,
  tier organization_tier not null default 'starter',
  payroll_provider text check (payroll_provider in ('sd_worx', 'securex', 'acerta', 'liantis', 'other', null)),
  payroll_external_id text,
  fleet_size_band text,
  pop_id uuid,                          -- which POP owns this account
  acquisition_channel text,
  metadata jsonb default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_organizations_pop on organizations(pop_id);
create index idx_organizations_province on organizations(province);

-- ============================================================
-- USERS — extend auth.users
-- ============================================================
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  phone text,
  role user_role not null,
  organization_id uuid references organizations(id) on delete cascade,
  language text not null default 'nl' check (language in ('nl', 'fr', 'en', 'de')),
  metadata jsonb default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_profiles_org on profiles(organization_id);
create index idx_profiles_role on profiles(role);

-- Auto-create profile on auth.users insert (stub — finalize via API on first login)
create or replace function handle_new_user() returns trigger as $$
begin
  insert into profiles (id, email, role, language)
  values (new.id, new.email, 'org_driver', 'nl')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================
-- POPs — Provincial Operating Partners
-- ============================================================
create table pops (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  province belgian_province not null,
  exclusive boolean not null default true,
  equity_percent_target numeric(5,2) not null default 4.00,
  equity_percent_vested numeric(5,2) not null default 0.00,
  contract_signed_at timestamptz,
  vesting_starts_at timestamptz,
  vesting_cliff_completed_at timestamptz,
  commission_structure jsonb not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index idx_pops_province_active on pops(province) where is_active = true;

alter table organizations
  add constraint fk_org_pop foreign key (pop_id) references pops(id) on delete set null;

-- ============================================================
-- INSTALLERS — Freelance installation partners
-- ============================================================
create table installers (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete set null,
  company_name text not null,
  vat_number text,
  provinces_active belgian_province[] not null,
  certifications jsonb default '[]',  -- BA5, VCA, Alfen, Wallbox, etc.
  insurance_expiry date,
  hourly_rate numeric(7,2),
  per_charger_rate numeric(7,2),
  is_active boolean not null default true,
  rating numeric(2,1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- SITES — physical locations where chargers live
-- ============================================================
create table sites (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  type text check (type in ('office', 'depot', 'home', 'public', 'apartment')),
  address jsonb not null,
  province belgian_province,
  dso text check (dso in ('fluvius', 'ores', 'sibelga', null)),
  grid_capacity_kw numeric(8,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_sites_org on sites(organization_id);

-- ============================================================
-- CHARGERS — the laadpunten themselves
-- ============================================================
create table chargers (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  site_id uuid not null references sites(id) on delete cascade,
  serial_number text not null unique,
  brand text not null,
  model text not null,
  power_kw numeric(6,2) not null,
  connector_type text not null default 'type2',
  ampeco_id text unique,                -- ID in AMPECO CPMS
  installed_at date,
  status charger_status not null default 'offline',
  last_seen_at timestamptz,
  firmware_version text,
  metadata jsonb default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_chargers_org on chargers(organization_id);
create index idx_chargers_site on chargers(site_id);
create index idx_chargers_status on chargers(status);

-- ============================================================
-- CHARGING SESSIONS — every plug-in
-- ============================================================
create table charging_sessions (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  charger_id uuid not null references chargers(id) on delete cascade,
  user_id uuid references profiles(id) on delete set null,  -- driver
  rfid_token text,
  ampeco_session_id text unique,
  started_at timestamptz not null,
  ended_at timestamptz,
  energy_kwh numeric(10,3),
  peak_power_kw numeric(6,2),
  status session_status not null default 'started',
  location_type text not null check (location_type in ('work', 'home', 'public')),
  cost_eur numeric(8,2),
  reimbursement_id uuid,
  metadata jsonb default '{}',
  created_at timestamptz not null default now()
);

create index idx_sessions_org on charging_sessions(organization_id);
create index idx_sessions_charger on charging_sessions(charger_id);
create index idx_sessions_user on charging_sessions(user_id);
create index idx_sessions_started_at on charging_sessions(started_at);

-- ============================================================
-- ELECTRICITY TARIFFS — CREG rates per month
-- ============================================================
create table electricity_tariffs (
  id uuid primary key default uuid_generate_v4(),
  effective_year int not null,
  effective_quarter int not null check (effective_quarter between 1 and 4),
  residential_rate_eur_per_kwh numeric(6,4) not null,
  industrial_rate_eur_per_kwh numeric(6,4) not null,
  source text not null default 'creg',
  notes text,
  created_at timestamptz not null default now(),
  unique (effective_year, effective_quarter)
);

-- ============================================================
-- REIMBURSEMENTS — the MOAT — home charging payback to employees
-- ============================================================
create table reimbursements (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,  -- the employee
  period_year int not null,
  period_month int not null check (period_month between 1 and 12),
  total_kwh numeric(10,3) not null,
  applied_rate_eur_per_kwh numeric(6,4) not null,
  total_amount_eur numeric(10,2) not null,
  session_count int not null,
  status reimbursement_status not null default 'pending',
  exported_at timestamptz,
  exported_to_payroll_at timestamptz,
  payroll_export_reference text,
  audit_trail jsonb default '[]',
  approved_by uuid references profiles(id),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, user_id, period_year, period_month)
);

create index idx_reimbursements_org on reimbursements(organization_id);
create index idx_reimbursements_period on reimbursements(period_year, period_month);
create index idx_reimbursements_status on reimbursements(status);

-- ============================================================
-- INSTALLATIONS — projects, from quote to commissioning
-- ============================================================
create table installations (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  site_id uuid not null references sites(id) on delete cascade,
  installer_id uuid references installers(id) on delete set null,
  quote_amount_eur numeric(10,2),
  charger_count int not null default 0,
  status installation_status not null default 'quote',
  scheduled_for date,
  started_at timestamptz,
  completed_at timestamptz,
  verified_at timestamptz,
  audit_report_url text,
  checklist jsonb default '{}',
  photos jsonb default '[]',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_installations_org on installations(organization_id);
create index idx_installations_installer on installations(installer_id);
create index idx_installations_status on installations(status);

-- ============================================================
-- SUBSCRIPTIONS — Stripe-backed recurring billing
-- ============================================================
create table subscriptions (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade unique,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  status subscription_status not null default 'trialing',
  tier organization_tier not null,
  per_charger_fee_eur numeric(6,2) not null default 59.00,
  per_user_fee_eur numeric(6,2) not null default 12.00,
  active_chargers int not null default 0,
  active_users int not null default 0,
  current_period_starts_at timestamptz,
  current_period_ends_at timestamptz,
  trial_ends_at timestamptz,
  canceled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- INVOICES — generated monthly, optionally synced from Stripe
-- ============================================================
create table invoices (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  invoice_number text unique not null,
  period_year int not null,
  period_month int not null,
  subtotal_eur numeric(10,2) not null,
  vat_eur numeric(10,2) not null,
  total_eur numeric(10,2) not null,
  status invoice_status not null default 'draft',
  stripe_invoice_id text unique,
  pdf_url text,
  due_date date,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_invoices_org on invoices(organization_id);
create index idx_invoices_period on invoices(period_year, period_month);

-- ============================================================
-- AI REPORTS — generated executive summaries, audits, etc.
-- ============================================================
create table ai_reports (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  type text not null check (type in ('executive_summary', 'fleet_audit', 'esg_report', 'predictive_maintenance', 'subsidy_finder')),
  period_year int,
  period_month int,
  prompt_version text not null,
  input_payload jsonb not null,
  output_markdown text,
  output_structured jsonb,
  pdf_url text,
  model_used text not null default 'claude-sonnet-4-5',
  input_tokens int,
  output_tokens int,
  cost_eur numeric(8,4),
  generated_by uuid references profiles(id),
  generated_at timestamptz not null default now()
);

create index idx_ai_reports_org on ai_reports(organization_id);
create index idx_ai_reports_type on ai_reports(type);

-- ============================================================
-- POP COMMISSIONS — earned per period
-- ============================================================
create table pop_commissions (
  id uuid primary key default uuid_generate_v4(),
  pop_id uuid not null references pops(id) on delete cascade,
  organization_id uuid references organizations(id) on delete set null,
  period_year int not null,
  period_month int not null,
  category text not null check (category in ('install', 'hardware', 'audit', 'saas_recurring', 'kwh_margin', 'subsidy_success', 'base_retainer')),
  source_amount_eur numeric(10,2) not null,
  commission_rate numeric(5,4) not null,
  commission_amount_eur numeric(10,2) not null,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_pop_commissions_pop on pop_commissions(pop_id);
create index idx_pop_commissions_period on pop_commissions(period_year, period_month);

-- ============================================================
-- SUPPORT TICKETS — SLA tracking
-- ============================================================
create table tickets (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid references profiles(id),
  charger_id uuid references chargers(id),
  subject text not null,
  description text,
  priority ticket_priority not null default 'medium',
  status ticket_status not null default 'open',
  assigned_to uuid references profiles(id),
  first_response_at timestamptz,
  resolved_at timestamptz,
  sla_target_hours int not null default 24,
  metadata jsonb default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_tickets_org on tickets(organization_id);
create index idx_tickets_status on tickets(status);

-- ============================================================
-- AUDIT LOG — every meaningful action
-- ============================================================
create table audit_logs (
  id bigserial primary key,
  organization_id uuid references organizations(id) on delete cascade,
  user_id uuid references profiles(id) on delete set null,
  action text not null,
  resource_type text not null,
  resource_id uuid,
  before jsonb,
  after jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

create index idx_audit_org on audit_logs(organization_id);
create index idx_audit_resource on audit_logs(resource_type, resource_id);
create index idx_audit_created on audit_logs(created_at);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table organizations enable row level security;
alter table profiles enable row level security;
alter table pops enable row level security;
alter table installers enable row level security;
alter table sites enable row level security;
alter table chargers enable row level security;
alter table charging_sessions enable row level security;
alter table reimbursements enable row level security;
alter table installations enable row level security;
alter table subscriptions enable row level security;
alter table invoices enable row level security;
alter table ai_reports enable row level security;
alter table pop_commissions enable row level security;
alter table tickets enable row level security;
alter table audit_logs enable row level security;

-- Helper: get current user's organization_id
create or replace function auth_org_id() returns uuid as $$
  select organization_id from profiles where id = auth.uid()
$$ language sql stable security definer;

-- Helper: is current user super_admin
create or replace function auth_is_super_admin() returns boolean as $$
  select exists(select 1 from profiles where id = auth.uid() and role = 'super_admin')
$$ language sql stable security definer;

-- Policy template: org members read/write within their org; super_admin reads all
create policy "super_admin_full_access_organizations" on organizations
  for all using (auth_is_super_admin()) with check (auth_is_super_admin());

create policy "org_members_read_own_org" on organizations
  for select using (id = auth_org_id());

-- Apply same pattern to other tables (sample for chargers)
create policy "super_admin_full_chargers" on chargers
  for all using (auth_is_super_admin()) with check (auth_is_super_admin());
create policy "org_read_own_chargers" on chargers
  for select using (organization_id = auth_org_id());

-- (Similar policies for sessions, reimbursements, invoices, sites, etc.
--  Truncated here for brevity — full set ships in 002_rls_policies.sql)

-- ============================================================
-- TRIGGERS — auto-update updated_at
-- ============================================================
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_organizations_updated_at before update on organizations for each row execute function set_updated_at();
create trigger trg_profiles_updated_at before update on profiles for each row execute function set_updated_at();
create trigger trg_pops_updated_at before update on pops for each row execute function set_updated_at();
create trigger trg_installers_updated_at before update on installers for each row execute function set_updated_at();
create trigger trg_sites_updated_at before update on sites for each row execute function set_updated_at();
create trigger trg_chargers_updated_at before update on chargers for each row execute function set_updated_at();
create trigger trg_reimbursements_updated_at before update on reimbursements for each row execute function set_updated_at();
create trigger trg_installations_updated_at before update on installations for each row execute function set_updated_at();
create trigger trg_subscriptions_updated_at before update on subscriptions for each row execute function set_updated_at();
create trigger trg_invoices_updated_at before update on invoices for each row execute function set_updated_at();
create trigger trg_tickets_updated_at before update on tickets for each row execute function set_updated_at();
