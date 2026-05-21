# Charge Platform — Developer onboarding

This document is the first thing a new engineer reads. It covers
prerequisites, environment setup, running the app locally, the end-to-end
reimbursement test, deployment to Vercel, and how to add a new dashboard
page.

The marketing site README (`README.md`) is still in the repo but only
describes the public landing page. This document covers the SaaS layer
behind the login.

---

## Prerequisites

- **Node.js 20+** (`node --version`) — Next.js 14 requires Node 18.17+; 20 LTS recommended.
- **npm 10+** ships with Node 20.
- **A Supabase project** in the EU-Central region (Frankfurt). Free tier is enough to start.
- **Vercel CLI** (optional, only for `vercel env pull` and local cron testing): `npm i -g vercel`.
- **Supabase CLI** (optional, recommended): `brew install supabase/tap/supabase` (macOS) or follow https://supabase.com/docs/guides/cli.
- **Stripe CLI** (optional, for local webhook forwarding): `brew install stripe/stripe-cli/stripe`.

---

## 1. Clone + install

```bash
git clone <repo>
cd charge-website
npm install
```

`npm install` pulls all dependencies, including Supabase, Stripe, Anthropic
SDK, Tailwind, and React PDF. First install takes ~40 seconds.

---

## 2. Supabase setup

1. **Create a project** in the Supabase dashboard.
   - Region: `eu-central-1` (Frankfurt) — required for GDPR/data-residency.
   - Database password: generate and store in a password manager.

2. **Copy the three keys** from Project Settings → API:
   - `URL`               → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key   → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key  → `SUPABASE_SERVICE_ROLE_KEY` (server-only)

3. **Run the migrations** in order. Using the dashboard SQL editor or `psql`:
   - `supabase/migrations/001_charge_platform.sql` — schema + enums + base RLS
   - `supabase/migrations/002_rls_complete.sql`    — full RLS policies for every table
   - `supabase/migrations/003_seed_creg_tariffs.sql` — CREG quarterly rates 2024-2026

   With the Supabase CLI:
   ```bash
   supabase link --project-ref <your-ref>
   supabase db push
   ```

4. **Create the seed users** via Authentication → Users → "Add user" (or via
   `supabase auth admin createUser`). The seed.sql file expects these
   UUIDs to already exist in `auth.users`:

   | id                                   | email                       |
   |--------------------------------------|-----------------------------|
   | 11111111-1111-1111-1111-111111111111 | charly@charge.be            |
   | 22222222-2222-2222-2222-222222222222 | admin@demo-co.be            |
   | 33333333-3333-3333-3333-333333333333 | jan.peeters@demo-co.be      |
   | 44444444-4444-4444-4444-444444444444 | sofie.maes@demo-co.be       |
   | 55555555-5555-5555-5555-555555555555 | thomas.janssens@demo-co.be  |
   | 66666666-6666-6666-6666-666666666666 | els.de.smet@demo-co.be      |
   | 77777777-7777-7777-7777-777777777777 | kevin.vermeulen@demo-co.be  |

   When creating users via the dashboard, paste the exact UUID into the "User
   ID" field, otherwise Supabase generates a random one and the seed becomes
   inert. CLI alternative:

   ```bash
   psql "$DATABASE_URL" -c "INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, role)
   VALUES ('11111111-1111-1111-1111-111111111111', 'charly@charge.be', crypt('temp-password', gen_salt('bf')), now(), 'authenticated');"
   ```

5. **Run the seed**:
   ```bash
   psql "$DATABASE_URL" -f supabase/seed.sql
   ```
   The seed is idempotent — re-running it does not duplicate rows.

---

## 3. Environment variables

Copy `.env.example` to `.env.local` and fill in real values. The full
reference list:

| Variable                          | Required? | What it does                                                                 |
|-----------------------------------|-----------|------------------------------------------------------------------------------|
| `NEXT_PUBLIC_SUPABASE_URL`        | yes       | Supabase REST endpoint, sent to the browser.                                |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`   | yes       | Public Supabase key, RLS-protected.                                          |
| `SUPABASE_SERVICE_ROLE_KEY`       | yes       | Server-only key that bypasses RLS — used by cron + webhooks ONLY.            |
| `ANTHROPIC_API_KEY`               | yes (AI)  | Claude API key for the 5 AI agents.                                          |
| `ANTHROPIC_MODEL`                 | no        | Override default `claude-sonnet-4-5`.                                        |
| `STRIPE_SECRET_KEY`               | yes (billing) | Stripe API key.                                                              |
| `STRIPE_WEBHOOK_SECRET`           | yes (billing) | Signs incoming Stripe webhooks; from Stripe Dashboard → Webhooks.            |
| `AMPECO_API_BASE_URL`             | yes (CPMS) | AMPECO REST endpoint.                                                         |
| `AMPECO_API_KEY`                  | yes (CPMS) | AMPECO bearer token.                                                          |
| `AMPECO_WEBHOOK_SECRET`           | yes (CPMS) | HMAC-shared secret for incoming AMPECO webhooks.                              |
| `CPMS_PROVIDER`                   | no        | Default `ampeco`. Set to a future provider when implemented.                 |
| `CRON_SECRET`                     | yes       | Vercel Cron sends `Bearer ${CRON_SECRET}` header. Generate a strong random.  |
| `RESEND_API_KEY` / `RESEND_FROM_EMAIL` | no   | Outbound email (invitations, alerts).                                        |
| `NEXT_PUBLIC_SENTRY_DSN` / `SENTRY_AUTH_TOKEN` | no | Error reporting.                                                              |
| `NEXT_PUBLIC_POSTHOG_KEY`         | no        | Product analytics.                                                            |
| `INNGEST_EVENT_KEY` / `INNGEST_SIGNING_KEY` | no  | Background jobs (queued AI generation, retries).                              |

---

## 4. Local dev

```bash
npm run dev
```

The app starts at http://localhost:3000.

- `/`                — marketing landing page
- `/login`           — sign-in form
- `/dashboard`       — authenticated overview
- `/chargers`        — charger inventory
- `/sessions`        — recent charging sessions
- `/reimbursements`  — per-employee monthly payout
- `/employees`       — driver list
- `/billing`         — subscription + invoices

The route group `app/(dashboard)/` shares one layout (`app/(dashboard)/layout.tsx`).
The route group does not appear in the URL.

---

## 5. Test account flow

1. Open http://localhost:3000/login.
2. Sign in as `admin@demo-co.be` (set the password during seed-user creation).
3. You should land on `/dashboard` and see the demo organisation's data:
   - 5 active chargers
   - ~20 sessions in the last 30 days
   - Pending reimbursements for last calendar month

4. Sign in as `charly@charge.be` to verify super_admin sees all
   organisations (currently only Demo Co BV exists).

---

## 6. End-to-end reimbursement test

1. Navigate to `/reimbursements`.
2. In the **Period** selector, choose the previous calendar month.
3. The seed already inserted reimbursement rows for the 5 drivers — verify
   the totals match.
4. Click **Recompute** on any driver row. The server action re-runs
   `lib/reimbursement/engine.ts` for that driver-period using their
   home-charging sessions and the CREG quarterly rate from
   `electricity_tariffs`.
5. Click **Export to SD Worx**. The browser downloads a CSV file named
   `sdworx-charge-BE0123456789-YYYY-MM.csv` that you can drop into the
   SD Worx variable-pay import.

If the export fails with `payroll_provider_not_configured`, check that
`organizations.payroll_provider` is `sd_worx` for Demo Co BV — the seed
sets this.

---

## 7. Deployment to Vercel

1. Push the repo to GitHub.
2. In Vercel: New Project → Import the repo.
3. Framework preset is auto-detected (Next.js).
4. Under **Environment Variables**, paste every key from your `.env.local`.
   The marketing page works without env vars, but `/dashboard` will 500 if
   `NEXT_PUBLIC_SUPABASE_URL` is missing.
5. **Custom domain**: Project → Domains → Add `charge.be` and `www.charge.be`.
   Set DNS A/CNAME records as Vercel instructs.
6. **Cron** is wired in `vercel.json` — Vercel reads it automatically.
   Confirm under Project → Settings → Cron Jobs after the first deploy.
7. **Stripe webhook**: in Stripe Dashboard → Developers → Webhooks add an
   endpoint pointing at `https://<your-domain>/api/webhooks/stripe`, then
   copy the signing secret into `STRIPE_WEBHOOK_SECRET`.
8. **AMPECO webhook**: log into AMPECO and configure a webhook to
   `https://<your-domain>/api/webhooks/ampeco`. Pass the same value you set
   in `AMPECO_WEBHOOK_SECRET` so HMAC verification matches.

---

## 8. Adding a new dashboard page (the 4-step pattern)

All authenticated pages follow the same structure. To add (for example)
`/installations`:

1. **Create the folder**: `app/(dashboard)/installations/page.tsx`.
2. **Server component, fetch with RLS**:

   ```ts
   import { createServerSupabase } from '@/lib/supabase/server';

   export default async function InstallationsPage() {
     const supabase = createServerSupabase();
     const { data: { user } } = await supabase.auth.getUser();
     if (!user) return null;

     const { data: profile } = await supabase
       .from('profiles').select('organization_id').eq('id', user.id).single();

     const { data: rows } = await supabase
       .from('installations')
       .select('*')
       .eq('organization_id', profile?.organization_id ?? '')
       .order('created_at', { ascending: false });

     return <Table rows={rows ?? []} />;
   }
   ```

3. **Add a link** to `app/(dashboard)/layout.tsx`'s `<nav>` block.
4. **Verify RLS** — `supabase/migrations/002_rls_complete.sql` already has
   `org_read_own_installations`. If you added a new table, write the same
   pattern: `super_admin_full_*`, `org_read_own_*`, `org_admin_write_*`,
   `pop_read_*`.

That's it — no extra wiring needed.
