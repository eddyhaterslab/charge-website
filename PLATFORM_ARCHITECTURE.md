# Charge Platform — Execution Architecture

> Authoritative reference for the **execution layer**. Sits on top of the existing
> `charge-website` marketing site. Builds the customer dashboard, internal admin,
> POP portal, installer portal, AMPECO integration, payroll wedge, and AI agents.

---

## 1. Folder structure (target)

```
charge-website/
├── app/
│   ├── (marketing)/                  # existing — public site
│   │   └── page.tsx
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx            # NEW
│   ├── (dashboard)/                   # NEW — customer portal
│   │   ├── layout.tsx                 # auth-gated, picks role-specific nav
│   │   ├── overview/page.tsx          # 10 KPI cards
│   │   ├── chargers/page.tsx          # list + status
│   │   ├── chargers/[id]/page.tsx     # single charger view
│   │   ├── sessions/page.tsx          # filterable sessions table
│   │   ├── reimbursements/page.tsx    # current period preview + history
│   │   ├── reimbursements/[period]/page.tsx
│   │   ├── reports/page.tsx           # AI-generated execs + ESG + audits
│   │   ├── billing/page.tsx           # Stripe portal embed
│   │   ├── settings/page.tsx          # users, sites, payroll integration
│   │   └── settings/payroll/page.tsx
│   ├── (admin)/                       # NEW — Charge internal staff
│   │   ├── layout.tsx                 # role=super_admin only
│   │   ├── organizations/page.tsx
│   │   ├── organizations/[id]/page.tsx
│   │   ├── mrr/page.tsx               # the founder's homepage
│   │   ├── pops/page.tsx              # POP performance
│   │   ├── installers/page.tsx
│   │   └── ai-cost/page.tsx           # Claude API spend dashboard
│   ├── (pop)/                         # NEW — Provincial Operating Partners
│   │   ├── layout.tsx                 # role=pop only
│   │   ├── pipeline/page.tsx
│   │   ├── customers/page.tsx
│   │   ├── commissions/page.tsx
│   │   └── equity/page.tsx
│   ├── (installer)/                   # NEW — Installation partners
│   │   ├── layout.tsx                 # role=installer only
│   │   ├── jobs/page.tsx
│   │   ├── jobs/[id]/page.tsx
│   │   └── earnings/page.tsx
│   ├── api/                           # NEW
│   │   ├── auth/callback/route.ts
│   │   ├── webhooks/
│   │   │   ├── stripe/route.ts
│   │   │   ├── ampeco/route.ts        # OCPP events from AMPECO
│   │   │   └── mollie/route.ts
│   │   ├── reimbursements/
│   │   │   ├── compute/route.ts       # POST: compute for org+period
│   │   │   ├── [id]/approve/route.ts
│   │   │   └── [id]/export/route.ts   # generates payroll file
│   │   ├── ai/
│   │   │   ├── audit-report/route.ts
│   │   │   ├── exec-summary/route.ts
│   │   │   ├── meeting-prep/route.ts
│   │   │   └── outreach/route.ts
│   │   ├── pdf/
│   │   │   ├── audit/[id]/route.ts
│   │   │   ├── invoice/[id]/route.ts
│   │   │   └── report/[id]/route.ts
│   │   └── cron/
│   │       ├── sync-ampeco-sessions/route.ts   # hourly
│   │       ├── compute-monthly-reimbursements/route.ts  # 1st of month
│   │       └── refresh-creg-tariffs/route.ts            # quarterly
│   ├── layout.tsx                     # existing
│   └── globals.css                    # existing
├── components/
│   ├── marketing/                     # existing
│   ├── dashboard/                     # NEW
│   ├── admin/                         # NEW
│   ├── pop/                           # NEW
│   ├── installer/                     # NEW
│   └── ui/                            # NEW shadcn-style primitives
├── lib/
│   ├── supabase/
│   │   ├── client.ts                  # browser client
│   │   ├── server.ts                  # server client
│   │   └── middleware.ts              # auth gate
│   ├── ai/
│   │   ├── client.ts                  # Anthropic SDK wrapper
│   │   └── prompts.ts                 # 5 agent system prompts
│   ├── cpms/
│   │   └── adapter.ts                 # AMPECO interface + impl
│   ├── payroll/
│   │   └── adapter.ts                 # SD Worx + Securex + Acerta
│   ├── reimbursement/
│   │   └── engine.ts                  # Belgian computation logic
│   ├── billing/
│   │   ├── stripe.ts
│   │   └── mollie.ts
│   ├── pdf/
│   │   ├── audit-report.tsx
│   │   ├── invoice.tsx
│   │   └── monthly-report.tsx
│   ├── jobs/                          # Inngest functions
│   │   ├── sync-sessions.ts
│   │   ├── compute-reimbursements.ts
│   │   └── send-monthly-reports.ts
│   └── utils.ts
├── types/
│   ├── database.ts                    # Supabase-generated
│   ├── diagnostic.ts                  # form schemas (Zod)
│   └── domain.ts                      # business types
├── supabase/
│   ├── migrations/
│   │   ├── 001_charge_platform.sql    # ← already written
│   │   ├── 002_rls_policies.sql       # full RLS expansion
│   │   ├── 003_seed_creg_tariffs.sql  # 2024-2026 CREG quarterly rates
│   │   └── 004_views_for_reporting.sql # materialized views for dashboards
│   └── seed/
│       └── dev_fixtures.sql
├── middleware.ts                      # NEW — auth gate per route group
├── inngest.config.ts                  # background job runtime
├── next.config.mjs                    # existing
├── tailwind.config.ts                 # existing
├── package.json                       # existing + new deps
└── PLATFORM_ARCHITECTURE.md           # this file
```

---

## 2. New package.json dependencies (additions)

```json
{
  "dependencies": {
    // existing: next, react, tailwind, framer-motion, lucide-react
    "@supabase/ssr": "^0.5.0",
    "@supabase/supabase-js": "^2.45.0",
    "@anthropic-ai/sdk": "^0.32.0",
    "@react-pdf/renderer": "^4.0.0",
    "stripe": "^16.7.0",
    "@mollie/api-client": "^4.0.0",
    "resend": "^4.0.0",
    "inngest": "^3.22.0",
    "@sentry/nextjs": "^8.27.0",
    "posthog-js": "^1.157.0",
    "react-hook-form": "^7.52.0",
    "@hookform/resolvers": "^3.9.0",
    "zod": "^3.23.0",
    "date-fns": "^3.6.0",
    "@radix-ui/react-dialog": "^1.1.1",
    "@radix-ui/react-dropdown-menu": "^2.1.1",
    "@radix-ui/react-select": "^2.1.1",
    "@radix-ui/react-tabs": "^1.1.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.5.2"
  },
  "devDependencies": {
    "supabase": "^1.200.0",
    "tsx": "^4.19.0"
  }
}
```

---

## 3. Critical files already shipped

The execution-critical files are written and live in this repository:

| File | What it is | Why it's the moat |
|---|---|---|
| `supabase/migrations/001_charge_platform.sql` | 15-table schema with RLS, enums, triggers | Multi-tenant foundation that scales to 5.000 orgs without rewrite |
| `lib/reimbursement/engine.ts` | Belgian fiscal computation engine | The wedge competitors don't have — CREG tariff resolution + audit trail |
| `lib/payroll/adapter.ts` | SD Worx / Securex / Acerta adapter | The wedge UX layer — one button, one file, one format per provider |
| `lib/cpms/adapter.ts` | AMPECO abstraction | Vendor lock-in escape valve. Swap providers in one file. |
| `lib/ai/prompts.ts` | 5 agent system prompts | Charge's operational IP. Versioned. A/B testable. |
| `lib/ai/client.ts` | Claude API wrapper with cost tracking | Foundation for every AI workflow |
| `lib/supabase/server.ts` | Server-side Supabase client | Required for RSC + route handlers |
| `.env.example` | Full environment config | Vercel deployment template |

---

## 4. Execution priorities

### Week 1 — Foundation
1. `npm install` new deps from §2
2. Provision Supabase project (EU region — Frankfurt)
3. Run migration `001_charge_platform.sql` via Supabase SQL editor
4. Wire env vars in Vercel (use `.env.example` as checklist)
5. Set up Sentry + PostHog (free tiers)

### Month 1 — AMPECO + auth
6. Sign AMPECO white-label contract + receive API credentials
7. Connect AMPECO webhook → `app/api/webhooks/ampeco/route.ts`
8. Implement Supabase Auth flow + `(dashboard)/login` + `(dashboard)/signup`
9. Onboard first customer: manually create organization, link AMPECO tenant_id
10. First customer sees `(dashboard)/overview` with real charger data

### Month 3 — Reimbursement engine live
11. Implement `app/api/reimbursements/compute/route.ts` calling `engine.ts`
12. Implement `(dashboard)/reimbursements` UI — period selector + table
13. Ship CSV export for SD Worx (manual download for first customer)
14. Inngest cron: `compute-monthly-reimbursements` runs 1st of each month
15. First reimbursement period fully exported to a real SD Worx instance

### Month 6 — AI agents in production
16. Implement audit-report API → calls `runAgent(AUDIT_REPORT_SYSTEM, ...)`
17. PDF generation via `@react-pdf/renderer` for audit reports
18. Implement outreach + meeting-prep agents for internal sales use
19. POP portal v1 — show pipeline + commissions

### Month 12 — Full stack live
20. All 5 AI agents in production with cost tracking
21. Stripe subscriptions for all customers (auto-billing per charger + per user)
22. Installer portal with job queue + photo uploads
23. CSRD ESG report generator (AI agent #6) — premium add-on

---

## 5. The four files that **define** Charge as a defensible business

If a competitor tries to clone Charge tomorrow, the question is: which files
would take them 12-18 months to recreate at quality?

1. **`lib/reimbursement/engine.ts`** — Belgian fiscal logic, edge cases,
   CREG tariff lookup, audit trail. Took conversations with a Belgian
   fiscal advisor to design correctly. Not in any open-source repo.

2. **`lib/payroll/adapter.ts` + per-provider impls** — Each provider
   integration takes 2-4 months including legal data-processing
   agreements with SD Worx / Securex / Acerta. The interface design
   matters more than the code: it's the contract that survives provider
   changes.

3. **`lib/ai/prompts.ts`** — The 5 prompts encode Charles-Henry's operating
   playbook + Belgian context. Iterate via A/B testing. Treat as IP.

4. **`supabase/migrations/001_charge_platform.sql`** — The multi-tenant
   schema. A poorly designed schema means migration agony at 100 customers.
   This one survives to 5.000+ with no rewrite.

Build these well. The rest is execution-grade boilerplate that can be
delegated, refactored, or rewritten without consequence.

---

## 6. Deployment

```bash
# Local dev
npm install
cp .env.example .env.local      # then fill in real keys
npx supabase db push             # apply migrations to your Supabase project
npm run dev

# Vercel production
vercel link
vercel env add (all keys from .env.example)
vercel --prod

# Background jobs (Inngest)
# Inngest auto-discovers app/api/inngest/route.ts
# Deploys with Vercel automatically
```

DNS:
- `charge.be` → marketing site (Vercel)
- `app.charge.be` → customer dashboard (same Vercel deployment, route group)
- `admin.charge.be` → internal (same deployment, role-gated)
- `pop.charge.be` → POP portal (same deployment)
- `installer.charge.be` → installer portal (same deployment)

Single Vercel project handles all five via Next.js route groups + middleware.

---

## 7. What's NOT in this MVP (deliberately deferred)

- Native mobile apps (PWA only year 1-2)
- ISO 27001 certification (begin process month 12)
- Multi-language UI beyond NL/FR/EN (DE deferred to year 3)
- V2G aggregator features (year 4+ when BE regulation allows)
- Own CPMS replacing AMPECO (year 3+ build vs buy decision)
- SOC 2 Type II (when first US/UK enterprise customer appears)
- React Native driver app (PWA validates the experience first)

Building each of these prematurely is the most common B2B SaaS mistake.
Don't.
