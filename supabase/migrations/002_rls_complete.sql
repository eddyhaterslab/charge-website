-- ============================================================
-- CHARGE PLATFORM — Complete RLS Policies (v2)
-- ============================================================
-- Expands the truncated policy set from 001_charge_platform.sql.
-- Goal: every business table is enforced by RLS for both reads and writes.
--
-- Patterns:
--   1. super_admin_full_*       : Charge internal staff sees/edits everything.
--   2. org_read_own_*           : org members read rows whose organization_id
--                                 matches auth_org_id().
--   3. org_write_own_*          : org_owner / org_admin may insert/update/delete
--                                 rows for their own organization.
--   4. driver_read_own_*        : org_driver may read their own row only
--                                 (charging_sessions, reimbursements).
--   5. pop_read_own_orgs_*      : POP partners can read all rows that belong
--                                 to organizations they own (organizations.pop_id
--                                 → pops.user_id == auth.uid()).
--   6. installer_read_assigned_*: installers see only installations they are
--                                 assigned to (installations.installer_id →
--                                 installers.user_id == auth.uid()).
--
-- Service-role key bypasses RLS automatically — used by cron jobs and webhooks
-- only. See SECURITY_NOTES.md.
-- ============================================================

-- ============================================================
-- Helper functions (idempotent)
-- ============================================================

-- Returns the role of the calling user
create or replace function auth_role() returns user_role as $$
  select role from profiles where id = auth.uid()
$$ language sql stable security definer;

-- Returns true if caller is an org_owner or org_admin in the given org
create or replace function auth_is_org_admin(org uuid) returns boolean as $$
  select exists(
    select 1 from profiles
    where id = auth.uid()
      and organization_id = org
      and role in ('org_owner', 'org_admin')
  )
$$ language sql stable security definer;

-- Returns true if the caller is the POP that owns the given org
create or replace function auth_is_pop_for_org(org uuid) returns boolean as $$
  select exists(
    select 1 from organizations o
    join pops p on p.id = o.pop_id
    where o.id = org and p.user_id = auth.uid() and p.is_active = true
  )
$$ language sql stable security definer;

-- Returns true if the caller is an installer assigned to the given installation
create or replace function auth_is_installer_for(install_id uuid) returns boolean as $$
  select exists(
    select 1 from installations i
    join installers ins on ins.id = i.installer_id
    where i.id = install_id and ins.user_id = auth.uid() and ins.is_active = true
  )
$$ language sql stable security definer;

-- ============================================================
-- ORGANIZATIONS
-- ============================================================
-- Existing policies in 001: super_admin_full_access_organizations, org_members_read_own_org
-- Add: pop can read its own orgs; org admins can update their org metadata.
drop policy if exists "pop_read_own_orgs" on organizations;
create policy "pop_read_own_orgs" on organizations
  for select using (auth_is_pop_for_org(id));

drop policy if exists "org_admin_update_own_org" on organizations;
create policy "org_admin_update_own_org" on organizations
  for update using (auth_is_org_admin(id)) with check (auth_is_org_admin(id));

-- ============================================================
-- PROFILES
-- ============================================================
drop policy if exists "super_admin_full_profiles" on profiles;
create policy "super_admin_full_profiles" on profiles
  for all using (auth_is_super_admin()) with check (auth_is_super_admin());

-- Every user can read their own profile
drop policy if exists "self_read_profile" on profiles;
create policy "self_read_profile" on profiles
  for select using (id = auth.uid());

-- Every user can update their own profile (limited columns — enforced in app layer)
drop policy if exists "self_update_profile" on profiles;
create policy "self_update_profile" on profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- Org admins can read all profiles in their org
drop policy if exists "org_admin_read_org_profiles" on profiles;
create policy "org_admin_read_org_profiles" on profiles
  for select using (
    organization_id is not null
    and auth_is_org_admin(organization_id)
  );

-- Org admins can insert/update profiles within their org
drop policy if exists "org_admin_write_org_profiles" on profiles;
create policy "org_admin_write_org_profiles" on profiles
  for all using (
    organization_id is not null
    and auth_is_org_admin(organization_id)
  ) with check (
    organization_id is not null
    and auth_is_org_admin(organization_id)
  );

-- POP can read all profiles in orgs they own
drop policy if exists "pop_read_org_profiles" on profiles;
create policy "pop_read_org_profiles" on profiles
  for select using (
    organization_id is not null
    and auth_is_pop_for_org(organization_id)
  );

-- ============================================================
-- POPS
-- ============================================================
drop policy if exists "super_admin_full_pops" on pops;
create policy "super_admin_full_pops" on pops
  for all using (auth_is_super_admin()) with check (auth_is_super_admin());

drop policy if exists "self_read_pop" on pops;
create policy "self_read_pop" on pops
  for select using (user_id = auth.uid());

-- ============================================================
-- INSTALLERS
-- ============================================================
drop policy if exists "super_admin_full_installers" on installers;
create policy "super_admin_full_installers" on installers
  for all using (auth_is_super_admin()) with check (auth_is_super_admin());

drop policy if exists "self_read_installer" on installers;
create policy "self_read_installer" on installers
  for select using (user_id = auth.uid());

-- ============================================================
-- SITES
-- ============================================================
drop policy if exists "super_admin_full_sites" on sites;
create policy "super_admin_full_sites" on sites
  for all using (auth_is_super_admin()) with check (auth_is_super_admin());

drop policy if exists "org_read_own_sites" on sites;
create policy "org_read_own_sites" on sites
  for select using (organization_id = auth_org_id());

drop policy if exists "org_admin_write_sites" on sites;
create policy "org_admin_write_sites" on sites
  for all using (auth_is_org_admin(organization_id))
  with check (auth_is_org_admin(organization_id));

drop policy if exists "pop_read_sites" on sites;
create policy "pop_read_sites" on sites
  for select using (auth_is_pop_for_org(organization_id));

-- ============================================================
-- CHARGERS
-- ============================================================
-- super_admin_full_chargers + org_read_own_chargers already in 001
-- Add: org admin writes; pop reads.
drop policy if exists "org_admin_write_chargers" on chargers;
create policy "org_admin_write_chargers" on chargers
  for all using (auth_is_org_admin(organization_id))
  with check (auth_is_org_admin(organization_id));

drop policy if exists "pop_read_chargers" on chargers;
create policy "pop_read_chargers" on chargers
  for select using (auth_is_pop_for_org(organization_id));

-- ============================================================
-- CHARGING_SESSIONS
-- ============================================================
drop policy if exists "super_admin_full_sessions" on charging_sessions;
create policy "super_admin_full_sessions" on charging_sessions
  for all using (auth_is_super_admin()) with check (auth_is_super_admin());

drop policy if exists "org_read_own_sessions" on charging_sessions;
create policy "org_read_own_sessions" on charging_sessions
  for select using (organization_id = auth_org_id());

drop policy if exists "driver_read_own_sessions" on charging_sessions;
create policy "driver_read_own_sessions" on charging_sessions
  for select using (user_id = auth.uid());

drop policy if exists "org_admin_write_sessions" on charging_sessions;
create policy "org_admin_write_sessions" on charging_sessions
  for all using (auth_is_org_admin(organization_id))
  with check (auth_is_org_admin(organization_id));

drop policy if exists "pop_read_sessions" on charging_sessions;
create policy "pop_read_sessions" on charging_sessions
  for select using (auth_is_pop_for_org(organization_id));

-- ============================================================
-- REIMBURSEMENTS
-- ============================================================
drop policy if exists "super_admin_full_reimbursements" on reimbursements;
create policy "super_admin_full_reimbursements" on reimbursements
  for all using (auth_is_super_admin()) with check (auth_is_super_admin());

drop policy if exists "org_read_own_reimbursements" on reimbursements;
create policy "org_read_own_reimbursements" on reimbursements
  for select using (organization_id = auth_org_id());

drop policy if exists "driver_read_own_reimbursements" on reimbursements;
create policy "driver_read_own_reimbursements" on reimbursements
  for select using (user_id = auth.uid());

drop policy if exists "org_admin_write_reimbursements" on reimbursements;
create policy "org_admin_write_reimbursements" on reimbursements
  for all using (auth_is_org_admin(organization_id))
  with check (auth_is_org_admin(organization_id));

drop policy if exists "pop_read_reimbursements" on reimbursements;
create policy "pop_read_reimbursements" on reimbursements
  for select using (auth_is_pop_for_org(organization_id));

-- ============================================================
-- INSTALLATIONS
-- ============================================================
drop policy if exists "super_admin_full_installations" on installations;
create policy "super_admin_full_installations" on installations
  for all using (auth_is_super_admin()) with check (auth_is_super_admin());

drop policy if exists "org_read_own_installations" on installations;
create policy "org_read_own_installations" on installations
  for select using (organization_id = auth_org_id());

drop policy if exists "org_admin_write_installations" on installations;
create policy "org_admin_write_installations" on installations
  for all using (auth_is_org_admin(organization_id))
  with check (auth_is_org_admin(organization_id));

drop policy if exists "pop_read_installations" on installations;
create policy "pop_read_installations" on installations
  for select using (auth_is_pop_for_org(organization_id));

-- Installers may read AND update only the installations assigned to them
drop policy if exists "installer_read_assigned_installations" on installations;
create policy "installer_read_assigned_installations" on installations
  for select using (auth_is_installer_for(id));

drop policy if exists "installer_update_assigned_installations" on installations;
create policy "installer_update_assigned_installations" on installations
  for update using (auth_is_installer_for(id))
  with check (auth_is_installer_for(id));

-- ============================================================
-- SUBSCRIPTIONS
-- ============================================================
drop policy if exists "super_admin_full_subscriptions" on subscriptions;
create policy "super_admin_full_subscriptions" on subscriptions
  for all using (auth_is_super_admin()) with check (auth_is_super_admin());

drop policy if exists "org_read_own_subscription" on subscriptions;
create policy "org_read_own_subscription" on subscriptions
  for select using (organization_id = auth_org_id());

-- Writes are service-role only (Stripe webhook). No org-side write policy.

-- ============================================================
-- INVOICES
-- ============================================================
drop policy if exists "super_admin_full_invoices" on invoices;
create policy "super_admin_full_invoices" on invoices
  for all using (auth_is_super_admin()) with check (auth_is_super_admin());

drop policy if exists "org_read_own_invoices" on invoices;
create policy "org_read_own_invoices" on invoices
  for select using (organization_id = auth_org_id());

drop policy if exists "pop_read_invoices" on invoices;
create policy "pop_read_invoices" on invoices
  for select using (auth_is_pop_for_org(organization_id));

-- ============================================================
-- AI_REPORTS
-- ============================================================
drop policy if exists "super_admin_full_ai_reports" on ai_reports;
create policy "super_admin_full_ai_reports" on ai_reports
  for all using (auth_is_super_admin()) with check (auth_is_super_admin());

drop policy if exists "org_read_own_ai_reports" on ai_reports;
create policy "org_read_own_ai_reports" on ai_reports
  for select using (organization_id = auth_org_id());

drop policy if exists "org_admin_write_ai_reports" on ai_reports;
create policy "org_admin_write_ai_reports" on ai_reports
  for all using (auth_is_org_admin(organization_id))
  with check (auth_is_org_admin(organization_id));

drop policy if exists "pop_read_ai_reports" on ai_reports;
create policy "pop_read_ai_reports" on ai_reports
  for select using (auth_is_pop_for_org(organization_id));

-- ============================================================
-- POP_COMMISSIONS
-- ============================================================
drop policy if exists "super_admin_full_pop_commissions" on pop_commissions;
create policy "super_admin_full_pop_commissions" on pop_commissions
  for all using (auth_is_super_admin()) with check (auth_is_super_admin());

-- Each POP can read their own commissions
drop policy if exists "pop_read_own_commissions" on pop_commissions;
create policy "pop_read_own_commissions" on pop_commissions
  for select using (
    exists (
      select 1 from pops p
      where p.id = pop_commissions.pop_id and p.user_id = auth.uid()
    )
  );

-- ============================================================
-- TICKETS
-- ============================================================
drop policy if exists "super_admin_full_tickets" on tickets;
create policy "super_admin_full_tickets" on tickets
  for all using (auth_is_super_admin()) with check (auth_is_super_admin());

drop policy if exists "org_read_own_tickets" on tickets;
create policy "org_read_own_tickets" on tickets
  for select using (organization_id = auth_org_id());

drop policy if exists "org_admin_write_tickets" on tickets;
create policy "org_admin_write_tickets" on tickets
  for all using (auth_is_org_admin(organization_id))
  with check (auth_is_org_admin(organization_id));

drop policy if exists "driver_insert_ticket" on tickets;
create policy "driver_insert_ticket" on tickets
  for insert with check (
    organization_id = auth_org_id()
    and (user_id = auth.uid() or user_id is null)
  );

drop policy if exists "pop_read_tickets" on tickets;
create policy "pop_read_tickets" on tickets
  for select using (auth_is_pop_for_org(organization_id));

-- ============================================================
-- AUDIT_LOGS — read-only for the UI; writes via service-role only
-- ============================================================
drop policy if exists "super_admin_full_audit_logs" on audit_logs;
create policy "super_admin_full_audit_logs" on audit_logs
  for all using (auth_is_super_admin()) with check (auth_is_super_admin());

drop policy if exists "org_admin_read_audit_logs" on audit_logs;
create policy "org_admin_read_audit_logs" on audit_logs
  for select using (
    organization_id is not null
    and auth_is_org_admin(organization_id)
  );

-- ============================================================
-- ELECTRICITY_TARIFFS — public reference data, readable by all authenticated users
-- ============================================================
alter table electricity_tariffs enable row level security;

drop policy if exists "any_auth_read_tariffs" on electricity_tariffs;
create policy "any_auth_read_tariffs" on electricity_tariffs
  for select using (auth.role() = 'authenticated');

drop policy if exists "super_admin_write_tariffs" on electricity_tariffs;
create policy "super_admin_write_tariffs" on electricity_tariffs
  for all using (auth_is_super_admin()) with check (auth_is_super_admin());

-- ============================================================
-- END
-- ============================================================
