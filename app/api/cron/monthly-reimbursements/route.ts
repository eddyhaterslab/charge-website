/**
 * GET /api/cron/monthly-reimbursements
 * ------------------------------------
 * Vercel Cron — runs on the 1st of each month.
 * Iterates every active organization × every active user,
 * computes reimbursement for the previous month, persists.
 *
 * Vercel cron config in vercel.json:
 *   { "path": "/api/cron/monthly-reimbursements", "schedule": "0 6 1 * *" }
 *
 * Authentication: Vercel adds `Authorization: Bearer ${CRON_SECRET}` header.
 */

import { NextResponse } from 'next/server';
import { createServiceSupabase } from '@/lib/supabase/server';
import { computeReimbursement } from '@/lib/reimbursement/engine';

export async function GET(request: Request) {
  // Cron auth
  const auth = request.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const supabase = createServiceSupabase();
  const now = new Date();
  // Previous month
  const periodYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  const periodMonth = now.getMonth() === 0 ? 12 : now.getMonth();
  const periodStart = new Date(periodYear, periodMonth - 1, 1).toISOString();
  const periodEnd = new Date(periodYear, periodMonth, 1).toISOString();

  // Fetch all active orgs
  const { data: orgs } = await supabase
    .from('organizations')
    .select('id')
    .eq('is_active', true);

  if (!orgs?.length) return NextResponse.json({ ok: true, processed: 0 });

  let processed = 0;
  let failed = 0;

  for (const org of orgs) {
    // Fetch active users for this org
    const { data: users } = await supabase
      .from('profiles')
      .select('id')
      .eq('organization_id', org.id)
      .eq('is_active', true)
      .eq('role', 'org_driver');

    for (const u of users ?? []) {
      try {
        const { data: sessions } = await supabase
          .from('charging_sessions')
          .select('id, started_at, ended_at, energy_kwh, location_type')
          .eq('user_id', u.id)
          .gte('started_at', periodStart)
          .lt('started_at', periodEnd)
          .eq('status', 'completed');

        if (!sessions || sessions.length === 0) continue;

        const result = await computeReimbursement({
          organizationId: org.id,
          userId: u.id,
          periodYear,
          periodMonth,
          sessions: sessions.map(s => ({
            id: s.id,
            startedAt: new Date(s.started_at),
            endedAt: s.ended_at ? new Date(s.ended_at) : null,
            energyKwh: Number(s.energy_kwh ?? 0),
            locationType: s.location_type,
          })),
        });

        await supabase.from('reimbursements').upsert({
          organization_id: org.id,
          user_id: u.id,
          period_year: periodYear,
          period_month: periodMonth,
          total_kwh: result.totalKwh,
          applied_rate_eur_per_kwh: result.appliedRateEurPerKwh,
          total_amount_eur: result.totalAmountEur,
          session_count: result.sessionCount,
          audit_trail: result.auditTrail,
          status: 'pending',
        } as never, { onConflict: 'organization_id,user_id,period_year,period_month' });

        processed++;
      } catch (e) {
        failed++;
        console.error(`reimb failed org=${org.id} user=${u.id}`, e);
      }
    }
  }

  return NextResponse.json({
    ok: true,
    period: `${periodYear}-${String(periodMonth).padStart(2, '0')}`,
    processed,
    failed,
    orgs: orgs.length,
  });
}
