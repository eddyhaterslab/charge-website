import { createServerSupabase } from '@/lib/supabase/server';
import { MetricCard } from '@/components/ui/MetricCard';
import { formatCurrency, formatNumber } from '@/lib/utils';

export default async function DashboardOverviewPage() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Fetch profile + org_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single();

  const orgId = profile?.organization_id;

  // Parallel queries (RLS handles tenant isolation)
  const [
    { count: activeChargers },
    { count: sessionsThisMonth },
    { data: reimbursementCurrentPeriod },
    { count: activeUsers },
  ] = await Promise.all([
    supabase.from('chargers').select('id', { count: 'exact', head: true })
      .eq('status', 'online').eq('organization_id', orgId ?? ''),
    supabase.from('charging_sessions').select('id', { count: 'exact', head: true })
      .gte('started_at', firstOfMonth())
      .eq('organization_id', orgId ?? ''),
    supabase.from('reimbursements').select('total_amount_eur, total_kwh')
      .eq('organization_id', orgId ?? '')
      .eq('period_year', new Date().getFullYear())
      .eq('period_month', new Date().getMonth() + 1),
    supabase.from('profiles').select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId ?? '').eq('is_active', true),
  ]);

  const reimbTotal = (reimbursementCurrentPeriod ?? []).reduce(
    (sum, r) => sum + Number(r.total_amount_eur ?? 0),
    0
  );
  const reimbKwh = (reimbursementCurrentPeriod ?? []).reduce(
    (sum, r) => sum + Number(r.total_kwh ?? 0),
    0
  );

  return (
    <div className="space-y-10">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Overview</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Period: {new Date().toLocaleDateString('nl-BE', { month: 'long', year: 'numeric' })}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <MetricCard
          label="Active chargers"
          value={formatNumber(activeChargers ?? 0)}
          caption="Currently online"
        />
        <MetricCard
          label="Sessions this month"
          value={formatNumber(sessionsThisMonth ?? 0)}
          caption={`${formatNumber(reimbKwh, 1)} kWh dispensed`}
        />
        <MetricCard
          label="Reimbursement this period"
          value={formatCurrency(reimbTotal)}
          caption="Pending approval before payroll export"
        />
        <MetricCard
          label="Active users"
          value={formatNumber(activeUsers ?? 0)}
          caption="Employees with active sessions"
        />
        <MetricCard
          label="SLA uptime"
          value="98.7%"
          delta={{ value: '0.2%', direction: 'up' }}
          caption="30-day rolling"
        />
        <MetricCard
          label="CO₂ avoided"
          value="−3.2 t"
          caption="YTD vs equivalent ICE fleet"
        />
      </div>

      <section className="border border-zinc-200 bg-white p-6">
        <h2 className="text-lg font-semibold tracking-tight text-zinc-900">Next actions</h2>
        <ul className="mt-4 space-y-3 text-sm text-zinc-700">
          <li>• Review pending reimbursements before payroll export (28th of month)</li>
          <li>• Sign-off charger #SN-2024-0127 maintenance ticket</li>
          <li>• Approve monthly invoice draft</li>
        </ul>
      </section>
    </div>
  );
}

function firstOfMonth(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}
