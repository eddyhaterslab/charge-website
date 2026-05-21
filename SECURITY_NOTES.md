# Charge Platform — Security notes

Single-page audit of how the platform handles auth, RLS, secrets, webhooks,
and GDPR. Aimed at the engineer doing the production handover and the CISO
who signs off on the first €1M ARR enterprise contract.

---

## 1. Row Level Security (RLS) — the primary tenant boundary

Every business table has RLS enabled (see `001_charge_platform.sql` and
`002_rls_complete.sql`). The product layer relies on this — no application
code does `where organization_id = ?` defensively. Translations:

- **Anon key** (sent to browsers): can only do what RLS allows.
- **Authenticated user**: sees their org's rows + their own rows; super_admin
  sees everything.
- **Service role key**: bypasses RLS entirely. Used in 2 places only — see § 2.

The full policy set covers super_admin, org_owner, org_admin, org_driver,
pop, installer. See `002_rls_complete.sql` for the exact predicates.

---

## 2. Service-role usage (where RLS is bypassed)

The `service_role` key is held server-side only. Calls to
`createServiceSupabase()` happen in:

| File                                                        | Why service role                                                                 |
|-------------------------------------------------------------|----------------------------------------------------------------------------------|
| `app/api/cron/monthly-reimbursements/route.ts`              | Iterates every org × every driver; no user session.                              |
| `app/api/webhooks/ampeco/route.ts`                          | AMPECO posts charger / session events with no Supabase JWT.                      |
| `app/api/webhooks/stripe/route.ts`                          | Stripe posts billing events with no Supabase JWT.                                |

Anywhere else (`/api/reimbursements/compute`, `/api/ai/audit-report`,
all dashboard pages) uses `createServerSupabase()` which respects RLS.

If a new server route needs service-role, audit it specifically — every new
bypass is a hole.

---

## 3. Webhook security

- **AMPECO**: HMAC-SHA256 over the raw request body using `AMPECO_WEBHOOK_SECRET`,
  compared against `x-ampeco-signature` header. Implemented in
  `app/api/webhooks/ampeco/route.ts`. If the env var is unset, the route
  currently accepts unsigned events — explicitly tighten before go-live by
  removing the `if (process.env.AMPECO_WEBHOOK_SECRET && signature)` guard
  to make signature mandatory.
- **Stripe**: official `stripe.webhooks.constructEvent(rawBody, signature, secret)`.
  Rejects with HTTP 400 on signature mismatch. Implemented in
  `app/api/webhooks/stripe/route.ts`.
- **Rate limiting**: deferred to Vercel / Cloudflare in front of the function.
  Add a per-IP limit on `/api/webhooks/*` and `/api/auth/*` before opening to
  the public Internet.

---

## 4. Cron security

`vercel.json` schedules `/api/cron/monthly-reimbursements`. Vercel signs
the request with `Authorization: Bearer ${CRON_SECRET}` automatically once
the env var is set. The route checks the header and returns 401 otherwise.

`CRON_SECRET` must be a strong random (≥32 bytes). Generate via:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 5. GDPR / data residency

- **PII fields**: `profiles.email`, `profiles.full_name`, `profiles.phone`,
  `reimbursements.audit_trail`, `tickets.description`. All other tables
  contain operational or fiscal data.
- **Data residency**: Supabase project must be created in `eu-central-1`
  (Frankfurt) — see `README_DEV.md` step 2. Vercel project should target
  the `fra1` region in its function config (Vercel auto-routes EU users to
  EU regions for app rendering, but DB and AI calls are what matter; for AI
  calls, Anthropic processes data in multiple regions — accept this in the
  DPA or block AI features for tenants who refuse).
- **Right to erasure**: `profiles.id` → `auth.users.id` with
  `ON DELETE CASCADE`. Deleting the auth.users row cascades through
  profiles → reimbursements → sessions → audit_logs (where
  `user_id` is set). To erase a user, call `supabase.auth.admin.deleteUser(id)`.
- **Right to access**: implement an export endpoint that bundles a JSON of
  every row keyed to the user. Not yet built — see § 7 known gaps.
- **Retention**: fiscal data (reimbursements, invoices, audit_logs around
  payroll) must be retained **7 years** under Belgian tax law (Art. 60 §1
  WIB 92). Personal data outside the fiscal scope (e.g., tickets) follows
  the org's own retention policy — set in the org settings UI (not yet
  built).

---

## 6. Type workarounds (for the production-readiness audit)

The Supabase TypeScript types are hand-written in `types/database.ts`. The
following localized casts exist in consumers because of how
`@supabase/supabase-js`'s generics interact with `Partial<Row>` insert types:

- `app/api/cron/monthly-reimbursements/route.ts` — `as never` on the
  `upsert({...})` payload (line ~80). The runtime payload matches the
  table; the cast satisfies the SDK's strict deep-narrowing.
- `app/api/webhooks/ampeco/route.ts` — same pattern on the charger status
  update (line ~57) and session upsert (line ~50).
- `app/api/webhooks/stripe/route.ts` — same pattern on subscription /
  invoice upserts.
- `app/api/ai/audit-report/route.ts` — same pattern on the `ai_reports`
  insert + update (lines ~38, ~62).

The Database type itself is unchanged. The fix for v2 is to regenerate
types with `supabase gen types typescript --linked > types/database.ts`,
which produces shapes that satisfy the SDK without manual casts.

Also: `package.json` pins `@supabase/supabase-js` to `~2.45.0` and
`@supabase/ssr` to `~0.5.0` because @supabase/ssr 0.5.x is incompatible
with @supabase/supabase-js >= 2.46 (a deep-path import was removed in
the supabase-js refactor). Upgrade both together in a single PR.

---

## 7. Known gaps / TODOs for the security review

These are items a CISO will flag before signing the first enterprise
contract. None block soft-launch.

1. **`audit_logs` is not append-only.** Currently a regular table; an org
   admin with direct SQL access could rewrite history. Solution: add a
   `before update` trigger that raises `EXCEPTION` (or move to a
   separate database role with no UPDATE/DELETE grant).

2. **No encryption-at-rest on JSONB columns.** `reimbursements.audit_trail`,
   `tickets.metadata`, and `profiles.metadata` can contain personal
   information. Supabase encrypts the volume but not column-level.
   For PII, add `pgcrypto`-encrypted columns or move to a vault provider.

3. **No 2FA on super_admin accounts.** Supabase supports MFA enrolment via
   `supabase.auth.mfa.enroll()`. Add a setup wizard and refuse super_admin
   login without MFA.

4. **Right-to-access export endpoint missing.** A user requesting their
   data under GDPR Art. 15 has no self-serve path. Build
   `GET /api/me/export` that streams a JSON bundle of profile + sessions
   + reimbursements.

5. **Service-role key in env vars.** Standard for Supabase deployments but
   means anyone with Vercel project access can read the key from
   `vercel env pull`. Restrict Vercel access to the production environment
   to ≤3 people and rotate `SUPABASE_SERVICE_ROLE_KEY` quarterly.

6. **No CSP / security headers.** `next.config.mjs` does not set
   Content-Security-Policy, Permissions-Policy, X-Frame-Options, or
   Strict-Transport-Security. Add via `headers()` once you've inventoried
   what scripts and frames the app loads (PostHog, Sentry, framer-motion
   inline styles).
