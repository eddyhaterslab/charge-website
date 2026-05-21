import { createServerSupabase } from '@/lib/supabase/server';
import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { formatCurrency, formatNumber, formatPeriod } from '@/lib/utils';
import { computeReimbursement } from '@/lib/reimbursement/engine';

type PeriodOption = { year: number; month: number; label: string; value: string };

function buildPeriodOptions(): PeriodOption[] {
  const out: PeriodOption[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    out.push({
      year: y,
      month: m,
      label: formatPeriod(y, m),
      value: `${y}-${String(m).padStart(2, '0')}`,
    });
  }
  return out;
}

function parsePeriod(value: string | undefined): { year: number; month: number } {
  const fallback = (() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  })();
  if (!value) return fallback;
  const m = /^(\d{4})-(\d{2})$/.exec(value);
  if (!m) return fallback;
  return { year: parseInt(m[1], 10), month: parseInt(m[2], 10) };
}

export default async function ReimbursementsPage({
  searchParams,
}: {
  searchParams: { period?: string };
}) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, role')
    .eq('id', user.id)
    .single();

  const orgId = profile?.organization_id ?? '';
  const periods = buildPeriodOptions();
  const { year, month } = parsePeriod(searchParams.period);
  const periodValue = `${year}-${String(month).padStart(2, '0')}`;

  // Fetch driver list + this period's reimbursements
  const [{ data: drivers }, { data: reimbursements }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, email, metadata')
      .eq('organization_id', orgId)
      .eq('role', 'org_driver')
      .eq('is_active', true)
      .order('full_name', { ascending: true }),
    supabase
      .from('reimbursements')
      .select('id, user_id, total_kwh, total_amount_eur, applied_rate_eur_per_kwh, session_count, status, exported_at')
      .eq('organization_id', orgId)
      .eq('period_year', year)
      .eq('period_month', month),
  ]);

  const reimbByUser = new Map((reimbursements ?? []).map(r => [r.user_id, r]));
  const totalAmount = (reimbursements ?? []).reduce((s, r) => s + Number(r.total_amount_eur ?? 0), 0);
  const totalKwh    = (reimbursements ?? []).reduce((s, r) => s + Number(r.total_kwh ?? 0), 0);
  const totalSessions = (reimbursements ?? []).reduce((s, r) => s + Number(r.session_count ?? 0), 0);

  async function recompute(formData: FormData) {
    'use server';
    const userId = String(formData.get('userId') || '');
    const periodValue = String(formData.get('period') || '');
    const { year, month } = parsePeriod(periodValue);
    if (!userId || !year || !month) return;

    const supabase = createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: target } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', userId)
      .single();
    if (!target?.organization_id) return;

    const periodStart = new Date(year, month - 1, 1).toISOString();
    const periodEnd   = new Date(year, month,     1).toISOString();

    const { data: sessions } = await supabase
      .from('charging_sessions')
      .select('id, started_at, ended_at, energy_kwh, location_type')
      .eq('user_id', userId)
      .gte('started_at', periodStart)
      .lt('started_at', periodEnd)
      .eq('status', 'completed');

    const result = await computeReimbursement({
      organizationId: target.organization_id,
      userId,
      periodYear: year,
      periodMonth: month,
      sessions: (sessions ?? []).map(s => ({
        id: s.id,
        startedAt: new Date(s.started_at),
        endedAt: s.ended_at ? new Date(s.ended_at) : null,
        energyKwh: Number(s.energy_kwh ?? 0),
        locationType: s.location_type,
      })),
      // cregRateFetcher wired via Supabase electricity_tariffs in compute route;
      // here we rely on the engine fallback. See SECURITY_NOTES.md.
    });

    await supabase.from('reimbursements').upsert({
      organization_id: target.organization_id,
      user_id: userId,
      period_year: year,
      period_month: month,
      total_kwh: result.totalKwh,
      applied_rate_eur_per_kwh: result.appliedRateEurPerKwh,
      total_amount_eur: result.totalAmountEur,
      session_count: result.sessionCount,
      audit_trail: result.auditTrail,
      status: 'pending',
    } as never, { onConflict: 'organization_id,user_id,period_year,period_month' });

    revalidatePath('/reimbursements');
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Reimbursements</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Period: {formatPeriod(year, month)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <form method="get" className="flex items-center gap-2">
            <label className="text-xs text-zinc-500">
              Period
              <select
                name="period"
                defaultValue={periodValue}
                className="ml-2 border border-zinc-300 px-2 py-1 text-sm"
              >
                {periods.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </label>
            <button type="submit" className="bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800">
              Go
            </button>
          </form>

          <a
            href={`/api/reimbursements/${periodValue}/export`}
            className="border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-900 hover:border-zinc-500"
          >
            Export to SD Worx
          </a>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="border border-zinc-200 bg-white p-5">
          <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500">Total payout</div>
          <div className="mt-2 text-3xl font-semibold tabular-nums text-zinc-900">
            {formatCurrency(totalAmount)}
          </div>
        </div>
        <div className="border border-zinc-200 bg-white p-5">
          <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500">Total kWh</div>
          <div className="mt-2 text-3xl font-semibold tabular-nums text-zinc-900">
            {formatNumber(totalKwh, 1)}
          </div>
        </div>
        <div className="border border-zinc-200 bg-white p-5">
          <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500">Sessions</div>
          <div className="mt-2 text-3xl font-semibold tabular-nums text-zinc-900">
            {formatNumber(totalSessions)}
          </div>
        </div>
      </div>

      <div className="border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50">
            <tr className="text-left text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500">
              <th className="px-4 py-3">Employee</th>
              <th className="px-4 py-3 text-right">kWh</th>
              <th className="px-4 py-3 text-right">Rate</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {(drivers ?? []).length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-zinc-500">
                  No drivers in this organization yet.
                </td>
              </tr>
            ) : (
              drivers!.map(d => {
                const r = reimbByUser.get(d.id);
                return (
                  <tr key={d.id} className="border-b border-zinc-100 last:border-0">
                    <td className="px-4 py-3 text-zinc-900">
                      <div>{d.full_name || d.email}</div>
                      <div className="text-xs text-zinc-500">{d.email}</div>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-zinc-900">
                      {r ? formatNumber(Number(r.total_kwh), 2) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-zinc-700">
                      {r ? formatCurrency(Number(r.applied_rate_eur_per_kwh)) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold text-zinc-900">
                      {r ? formatCurrency(Number(r.total_amount_eur)) : '—'}
                    </td>
                    <td className="px-4 py-3 text-zinc-700">
                      {r ? r.status : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <form action={recompute}>
                        <input type="hidden" name="userId" value={d.id} />
                        <input type="hidden" name="period" value={periodValue} />
                        <button
                          type="submit"
                          className="border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-900 hover:border-zinc-500"
                        >
                          Recompute
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-zinc-500">
        Recompute pulls the eligible home-charging sessions for the selected period
        from the database, runs the Belgian reimbursement engine, and upserts the
        reimbursement record with status &quot;pending&quot;. The Export button
        downloads the SD Worx-compatible CSV file for all pending + approved
        reimbursements in this period.
      </p>
    </div>
  );
}
