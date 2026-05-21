-- ============================================================
-- CHARGE PLATFORM — Demo Seed (idempotent)
-- ============================================================
-- Loads enough fixture data to demonstrate the dashboard end-to-end:
--   - 1 demo organization (Demo Co BV)
--   - 1 super_admin profile (charly@charge.be)  [see note below]
--   - 1 org_admin profile
--   - 5 employee profiles (org_driver)
--   - 1 site, 5 chargers
--   - 20 charging sessions across the past 30 days
--   - 1 pending reimbursement batch for last calendar month
--
-- IMPORTANT — auth.users prerequisites
-- ------------------------------------
-- This file assumes the following auth.users rows already exist
-- (created via Supabase Auth dashboard, CLI, or admin API). Run this
-- AFTER you've signed-up the demo users:
--
--   id                                     email
--   11111111-1111-1111-1111-111111111111   charly@charge.be              -> will be flipped to super_admin
--   22222222-2222-2222-2222-222222222222   admin@demo-co.be              -> org_admin of Demo Co
--   33333333-3333-3333-3333-333333333333   jan.peeters@demo-co.be        -> driver
--   44444444-4444-4444-4444-444444444444   sofie.maes@demo-co.be         -> driver
--   55555555-5555-5555-5555-555555555555   thomas.janssens@demo-co.be    -> driver
--   66666666-6666-6666-6666-666666666666   els.de.smet@demo-co.be        -> driver
--   77777777-7777-7777-7777-777777777777   kevin.vermeulen@demo-co.be    -> driver
--
-- The on_auth_user_created trigger (from 001_charge_platform.sql) will
-- automatically insert a profiles row with role=org_driver. This script
-- then UPDATEs each row to the intended role + organization_id.
-- ============================================================

-- ============================================================
-- 1. Demo organization
-- ============================================================
insert into organizations (
  id, name, vat_number, billing_email, province, tier,
  payroll_provider, fleet_size_band, is_active
)
values (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Demo Co BV',
  'BE0123456789',
  'finance@demo-co.be',
  'antwerp',
  'pro',
  'sd_worx',
  '10-50',
  true
)
on conflict (id) do update set
  name             = excluded.name,
  vat_number       = excluded.vat_number,
  billing_email    = excluded.billing_email,
  province         = excluded.province,
  tier             = excluded.tier,
  payroll_provider = excluded.payroll_provider,
  fleet_size_band  = excluded.fleet_size_band,
  is_active        = true;

-- ============================================================
-- 2. Profiles — flip roles / wire to org
--    (handle_new_user trigger created a baseline org_driver row)
-- ============================================================

-- super_admin (Charge internal)
update profiles set
  role = 'super_admin',
  full_name = 'Charly Provenzano',
  organization_id = null,
  language = 'nl',
  is_active = true
where id = '11111111-1111-1111-1111-111111111111';

-- org_admin
update profiles set
  role = 'org_admin',
  full_name = 'Admin Demo',
  organization_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  language = 'nl',
  is_active = true
where id = '22222222-2222-2222-2222-222222222222';

-- Drivers (5 employees with Belgian names)
update profiles set
  role = 'org_driver',
  full_name = 'Jan Peeters',
  organization_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  language = 'nl',
  is_active = true,
  metadata = '{"payroll_id": "SDW-100123"}'::jsonb
where id = '33333333-3333-3333-3333-333333333333';

update profiles set
  role = 'org_driver',
  full_name = 'Sofie Maes',
  organization_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  language = 'nl',
  is_active = true,
  metadata = '{"payroll_id": "SDW-100124"}'::jsonb
where id = '44444444-4444-4444-4444-444444444444';

update profiles set
  role = 'org_driver',
  full_name = 'Thomas Janssens',
  organization_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  language = 'nl',
  is_active = true,
  metadata = '{"payroll_id": "SDW-100125"}'::jsonb
where id = '55555555-5555-5555-5555-555555555555';

update profiles set
  role = 'org_driver',
  full_name = 'Els De Smet',
  organization_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  language = 'nl',
  is_active = true,
  metadata = '{"payroll_id": "SDW-100126"}'::jsonb
where id = '66666666-6666-6666-6666-666666666666';

update profiles set
  role = 'org_driver',
  full_name = 'Kevin Vermeulen',
  organization_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  language = 'nl',
  is_active = true,
  metadata = '{"payroll_id": "SDW-100127"}'::jsonb
where id = '77777777-7777-7777-7777-777777777777';

-- ============================================================
-- 3. Subscription for the demo org
-- ============================================================
insert into subscriptions (
  organization_id, status, tier,
  per_charger_fee_eur, per_user_fee_eur,
  active_chargers, active_users,
  current_period_starts_at, current_period_ends_at
)
values (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'active', 'pro',
  59.00, 12.00,
  5, 5,
  date_trunc('month', now()),
  date_trunc('month', now()) + interval '1 month'
)
on conflict (organization_id) do update set
  status                   = excluded.status,
  tier                     = excluded.tier,
  per_charger_fee_eur      = excluded.per_charger_fee_eur,
  per_user_fee_eur         = excluded.per_user_fee_eur,
  active_chargers          = excluded.active_chargers,
  active_users             = excluded.active_users,
  current_period_starts_at = excluded.current_period_starts_at,
  current_period_ends_at   = excluded.current_period_ends_at;

-- ============================================================
-- 4. Site
-- ============================================================
insert into sites (id, organization_id, name, type, address, province, dso, grid_capacity_kw)
values (
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Demo Co HQ — Antwerpen',
  'office',
  jsonb_build_object(
    'street', 'Frankrijklei 1',
    'postal_code', '2000',
    'city', 'Antwerpen',
    'country', 'BE'
  ),
  'antwerp',
  'fluvius',
  150.00
)
on conflict (id) do update set
  organization_id = excluded.organization_id,
  name = excluded.name,
  type = excluded.type,
  address = excluded.address,
  province = excluded.province,
  dso = excluded.dso,
  grid_capacity_kw = excluded.grid_capacity_kw;

-- ============================================================
-- 5. Chargers (5 — mix of 11kW / 22kW; Wallbox + Alfen)
-- ============================================================
insert into chargers (
  id, organization_id, site_id, serial_number, brand, model,
  power_kw, connector_type, status, last_seen_at, installed_at, is_active
)
values
  ('cccccccc-cccc-cccc-cccc-cccccccccc01',
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
   'WBX-2024-0001', 'Wallbox', 'Pulsar Plus',
   11.0, 'type2', 'online', now() - interval '2 minutes',
   current_date - interval '120 days', true),
  ('cccccccc-cccc-cccc-cccc-cccccccccc02',
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
   'WBX-2024-0002', 'Wallbox', 'Pulsar Plus',
   11.0, 'type2', 'charging', now() - interval '1 minute',
   current_date - interval '120 days', true),
  ('cccccccc-cccc-cccc-cccc-cccccccccc03',
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
   'ALF-2024-0003', 'Alfen', 'Eve Single Pro-line',
   22.0, 'type2', 'online', now() - interval '5 minutes',
   current_date - interval '90 days', true),
  ('cccccccc-cccc-cccc-cccc-cccccccccc04',
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
   'ALF-2024-0004', 'Alfen', 'Eve Double Pro-line',
   22.0, 'type2', 'online', now() - interval '3 minutes',
   current_date - interval '90 days', true),
  ('cccccccc-cccc-cccc-cccc-cccccccccc05',
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
   'WBX-2024-0005', 'Wallbox', 'Commander 2',
   22.0, 'type2', 'charging', now() - interval '1 minute',
   current_date - interval '60 days', true)
on conflict (serial_number) do update set
  organization_id = excluded.organization_id,
  site_id         = excluded.site_id,
  brand           = excluded.brand,
  model           = excluded.model,
  power_kw        = excluded.power_kw,
  connector_type  = excluded.connector_type,
  status          = excluded.status,
  last_seen_at    = excluded.last_seen_at,
  installed_at    = excluded.installed_at,
  is_active       = true;

-- ============================================================
-- 6. Charging sessions — 20 over last 30 days (15 home, 5 work)
-- ============================================================
-- Distributed across 5 employees, 5 chargers.
-- Deterministic IDs (dddddddd-* + index) so re-run is idempotent.
-- ============================================================

with seed_data as (
  select * from (values
    -- (idx, user_id, charger_id, days_ago, energy_kwh, location, status)
    ( 1, '33333333-3333-3333-3333-333333333333'::uuid, 'cccccccc-cccc-cccc-cccc-cccccccccc01'::uuid, 28,  18.50, 'home', 'completed'),
    ( 2, '33333333-3333-3333-3333-333333333333'::uuid, 'cccccccc-cccc-cccc-cccc-cccccccccc01'::uuid, 25,  22.10, 'home', 'completed'),
    ( 3, '33333333-3333-3333-3333-333333333333'::uuid, 'cccccccc-cccc-cccc-cccc-cccccccccc01'::uuid, 21,  20.40, 'home', 'completed'),
    ( 4, '33333333-3333-3333-3333-333333333333'::uuid, 'cccccccc-cccc-cccc-cccc-cccccccccc01'::uuid, 18,  19.20, 'home', 'completed'),
    ( 5, '44444444-4444-4444-4444-444444444444'::uuid, 'cccccccc-cccc-cccc-cccc-cccccccccc02'::uuid, 27,  24.00, 'home', 'completed'),
    ( 6, '44444444-4444-4444-4444-444444444444'::uuid, 'cccccccc-cccc-cccc-cccc-cccccccccc02'::uuid, 23,  21.30, 'home', 'completed'),
    ( 7, '44444444-4444-4444-4444-444444444444'::uuid, 'cccccccc-cccc-cccc-cccc-cccccccccc02'::uuid, 19,  17.80, 'home', 'completed'),
    ( 8, '55555555-5555-5555-5555-555555555555'::uuid, 'cccccccc-cccc-cccc-cccc-cccccccccc03'::uuid, 26,  30.50, 'home', 'completed'),
    ( 9, '55555555-5555-5555-5555-555555555555'::uuid, 'cccccccc-cccc-cccc-cccc-cccccccccc03'::uuid, 22,  28.10, 'home', 'completed'),
    (10, '55555555-5555-5555-5555-555555555555'::uuid, 'cccccccc-cccc-cccc-cccc-cccccccccc03'::uuid, 17,  26.40, 'home', 'completed'),
    (11, '66666666-6666-6666-6666-666666666666'::uuid, 'cccccccc-cccc-cccc-cccc-cccccccccc04'::uuid, 24,  15.20, 'home', 'completed'),
    (12, '66666666-6666-6666-6666-666666666666'::uuid, 'cccccccc-cccc-cccc-cccc-cccccccccc04'::uuid, 20,  16.40, 'home', 'completed'),
    (13, '66666666-6666-6666-6666-666666666666'::uuid, 'cccccccc-cccc-cccc-cccc-cccccccccc04'::uuid, 15,  17.10, 'home', 'completed'),
    (14, '77777777-7777-7777-7777-777777777777'::uuid, 'cccccccc-cccc-cccc-cccc-cccccccccc05'::uuid, 29,  35.20, 'home', 'completed'),
    (15, '77777777-7777-7777-7777-777777777777'::uuid, 'cccccccc-cccc-cccc-cccc-cccccccccc05'::uuid, 16,  32.40, 'home', 'completed'),
    -- 5 work sessions
    (16, '33333333-3333-3333-3333-333333333333'::uuid, 'cccccccc-cccc-cccc-cccc-cccccccccc01'::uuid, 10,   8.10, 'work', 'completed'),
    (17, '44444444-4444-4444-4444-444444444444'::uuid, 'cccccccc-cccc-cccc-cccc-cccccccccc02'::uuid,  8,   9.40, 'work', 'completed'),
    (18, '55555555-5555-5555-5555-555555555555'::uuid, 'cccccccc-cccc-cccc-cccc-cccccccccc03'::uuid,  6,  11.20, 'work', 'completed'),
    (19, '66666666-6666-6666-6666-666666666666'::uuid, 'cccccccc-cccc-cccc-cccc-cccccccccc04'::uuid,  4,   7.50, 'work', 'completed'),
    (20, '77777777-7777-7777-7777-777777777777'::uuid, 'cccccccc-cccc-cccc-cccc-cccccccccc05'::uuid,  2,  10.80, 'work', 'completed')
  ) as t(idx, user_id, charger_id, days_ago, energy_kwh, location, status)
)
insert into charging_sessions (
  id, organization_id, charger_id, user_id, started_at, ended_at,
  energy_kwh, peak_power_kw, status, location_type
)
select
  ('dddddddd-dddd-dddd-dddd-' || lpad(idx::text, 12, '0'))::uuid,
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  charger_id, user_id,
  now() - (days_ago || ' days')::interval,
  now() - (days_ago || ' days')::interval + interval '2 hours',
  energy_kwh, 11.0, status::session_status, location
from seed_data
on conflict (id) do update set
  energy_kwh    = excluded.energy_kwh,
  status        = excluded.status,
  location_type = excluded.location_type,
  charger_id    = excluded.charger_id,
  user_id       = excluded.user_id;

-- ============================================================
-- 7. Reimbursement batch — pending, last calendar month
-- ============================================================
-- Pull aggregates per driver for the most recent COMPLETED calendar month.
-- ============================================================
with last_month as (
  select
    extract(year  from (date_trunc('month', now()) - interval '1 month'))::int as ly,
    extract(month from (date_trunc('month', now()) - interval '1 month'))::int as lm
),
agg as (
  select
    s.user_id,
    sum(s.energy_kwh) as total_kwh,
    count(*)         as session_count
  from charging_sessions s
  cross join last_month lm
  where s.organization_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
    and s.location_type   = 'home'
    and s.status          = 'completed'
    and extract(year  from s.started_at) = lm.ly
    and extract(month from s.started_at) = lm.lm
  group by s.user_id
),
rate as (
  select residential_rate_eur_per_kwh
  from electricity_tariffs, last_month
  where effective_year = last_month.ly
    and effective_quarter = ceil(last_month.lm::numeric / 3)::int
  limit 1
)
insert into reimbursements (
  organization_id, user_id, period_year, period_month,
  total_kwh, applied_rate_eur_per_kwh, total_amount_eur,
  session_count, status, audit_trail
)
select
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  agg.user_id,
  lm.ly,
  lm.lm,
  agg.total_kwh,
  coalesce((select residential_rate_eur_per_kwh from rate), 0.3284),
  round(agg.total_kwh * coalesce((select residential_rate_eur_per_kwh from rate), 0.3284), 2),
  agg.session_count,
  'pending',
  '[{"step":"seed","detail":{"source":"supabase/seed.sql"}}]'::jsonb
from agg
cross join last_month lm
on conflict (organization_id, user_id, period_year, period_month) do update set
  total_kwh                = excluded.total_kwh,
  applied_rate_eur_per_kwh = excluded.applied_rate_eur_per_kwh,
  total_amount_eur         = excluded.total_amount_eur,
  session_count            = excluded.session_count,
  audit_trail              = excluded.audit_trail;

-- ============================================================
-- END
-- ============================================================
