/**
 * POST /api/reimbursements/compute
 * --------------------------------
 * Compute home-charging reimbursement for a user for a given period.
 * The actual computation logic lives in lib/reimbursement/engine.ts.
 * This route handles: auth, RLS, fetching sessions, persisting result.
 *
 * The route wires a `cregRateFetcher` so the engine reads the
 * residential tariff from the `electricity_tariffs` table seeded by
 * `supabase/migrations/003_seed_creg_tariffs.sql`. If the table has no
 * row for the requested quarter, the engine falls back to its
 * in-memory CREG_RATES_FALLBACK map.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabase } from '@/lib/supabase/server';
import { computeReimbursement } from '@/lib/reimbursement/engine';

const RequestSchema = z.object({
  userId: z.string().uuid(),
  periodYear: z.number().int().min(2024).max(2099),
  periodMonth: z.number().int().min(1).max(12),
  dryRun: z.boolean().default(false),
});

export async function POST(request: Request) {
  const supabase = createServerSupabase();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await request.json();
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_body', details: parsed.error.format() }, { status: 400 });
  }

  const { userId, periodYear, periodMonth, dryRun } = parsed.data;

  // Resolve organization (must match caller's org via RLS for non-admins)
  const { data: targetProfile } = await supabase
    .from('profiles')
    .select('organization_id, full_name, email')
    .eq('id', userId)
    .single();

  if (!targetProfile?.organization_id) {
    return NextResponse.json({ error: 'no_organization' }, { status: 404 });
  }

  // Fetch sessions for the period
  const periodStart = new Date(periodYear, periodMonth - 1, 1).toISOString();
  const periodEnd = new Date(periodYear, periodMonth, 1).toISOString();

  const { data: sessions, error: sessErr } = await supabase
    .from('charging_sessions')
    .select('id, started_at, ended_at, energy_kwh, location_type')
    .eq('user_id', userId)
    .gte('started_at', periodStart)
    .lt('started_at', periodEnd)
    .eq('status', 'completed');

  if (sessErr) {
    return NextResponse.json({ error: 'db_error', message: sessErr.message }, { status: 500 });
  }

  // CREG rate fetcher: read residential rate from electricity_tariffs
  const cregRateFetcher = async (year: number, q: number) => {
    const { data } = await supabase
      .from('electricity_tariffs')
      .select('residential_rate_eur_per_kwh')
      .eq('effective_year', year)
      .eq('effective_quarter', q)
      .maybeSingle();
    if (!data) return null;
    return Number(data.residential_rate_eur_per_kwh);
  };

  // Compute with engine
  const result = await computeReimbursement(
    {
      organizationId: targetProfile.organization_id,
      userId,
      periodYear,
      periodMonth,
      sessions: (sessions ?? []).map(s => ({
        id: s.id,
        startedAt: new Date(s.started_at),
        endedAt: s.ended_at ? new Date(s.ended_at) : null,
        energyKwh: Number(s.energy_kwh ?? 0),
        locationType: s.location_type,
      })),
    },
    { cregRateFetcher }
  );

  if (dryRun) {
    return NextResponse.json({ ok: true, result, persisted: false });
  }

  // Upsert reimbursement record
  const { data: persisted, error: upErr } = await supabase
    .from('reimbursements')
    .upsert({
      organization_id: targetProfile.organization_id,
      user_id: userId,
      period_year: periodYear,
      period_month: periodMonth,
      total_kwh: result.totalKwh,
      applied_rate_eur_per_kwh: result.appliedRateEurPerKwh,
      total_amount_eur: result.totalAmountEur,
      session_count: result.sessionCount,
      audit_trail: result.auditTrail,
      status: 'pending',
    }, { onConflict: 'organization_id,user_id,period_year,period_month' })
    .select('id')
    .single();

  if (upErr) {
    return NextResponse.json({ error: 'persist_failed', message: upErr.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    reimbursement_id: persisted?.id,
    result,
    persisted: true,
  });
}
