import { createServerSupabase } from '@/lib/supabase/server';
import { formatNumber } from '@/lib/utils';

function firstOfMonth(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
}

export default async function EmployeesPage() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single();

  const orgId = profile?.organization_id ?? '';

  const { data: drivers } = await supabase
    .from('profiles')
    .select('id, full_name, email, metadata, is_active, role')
    .eq('organization_id', orgId)
    .eq('role', 'org_driver')
    .order('full_name', { ascending: true });

  const driverIds = (drivers ?? []).map(d => d.id);
  const monthStart = firstOfMonth();

  const { data: sessionsThisMonth } = driverIds.length
    ? await supabase
        .from('charging_sessions')
        .select('user_id, energy_kwh, started_at, location_type')
        .in('user_id', driverIds)
        .gte('started_at', monthStart)
    : { data: [] };

  type Agg = { kwh: number; last: string | null };
  const agg = new Map<string, Agg>();
  for (const s of (sessionsThisMonth ?? [])) {
    if (!s.user_id) continue;
    if (s.location_type !== 'home') continue;
    const a = agg.get(s.user_id) ?? { kwh: 0, last: null };
    a.kwh += Number(s.energy_kwh ?? 0);
    if (!a.last || s.started_at > a.last) a.last = s.started_at;
    agg.set(s.user_id, a);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Employees</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {drivers?.length ?? 0} {(drivers?.length ?? 0) === 1 ? 'driver' : 'drivers'}
          </p>
        </div>

        <details className="relative">
          <summary className="cursor-pointer list-none bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800">
            Invite employee
          </summary>
          <form className="absolute right-0 z-10 mt-2 w-80 border border-zinc-200 bg-white p-4 shadow-sm">
            <p className="mb-3 text-xs text-zinc-500">
              Stub form — email invitation is wired in a follow-up sprint.
            </p>
            <label className="block text-xs font-medium text-zinc-700">
              Full name
              <input
                name="full_name"
                required
                className="mt-1 w-full border border-zinc-300 px-2 py-1.5 text-sm"
              />
            </label>
            <label className="mt-3 block text-xs font-medium text-zinc-700">
              Email
              <input
                type="email"
                name="email"
                required
                className="mt-1 w-full border border-zinc-300 px-2 py-1.5 text-sm"
              />
            </label>
            <label className="mt-3 block text-xs font-medium text-zinc-700">
              Payroll external ID
              <input
                name="payroll_id"
                placeholder="e.g. SDW-100128"
                className="mt-1 w-full border border-zinc-300 px-2 py-1.5 text-sm"
              />
            </label>
            <button
              type="button"
              disabled
              className="mt-4 w-full bg-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-600"
            >
              Send invite (coming soon)
            </button>
          </form>
        </details>
      </header>

      <div className="border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50">
            <tr className="text-left text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Payroll ID</th>
              <th className="px-4 py-3 text-right">kWh this month</th>
              <th className="px-4 py-3">Last session</th>
            </tr>
          </thead>
          <tbody>
            {(drivers ?? []).length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-sm text-zinc-500">
                  No employees in this organization yet.
                </td>
              </tr>
            ) : (
              drivers!.map(d => {
                const a = agg.get(d.id);
                const meta = d.metadata as Record<string, string> | null;
                const payrollId = meta?.payroll_id ?? '—';
                return (
                  <tr key={d.id} className="border-b border-zinc-100 last:border-0">
                    <td className="px-4 py-3 text-zinc-900">{d.full_name || '—'}</td>
                    <td className="px-4 py-3 text-zinc-700">{d.email}</td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-700">{payrollId}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-zinc-900">
                      {a ? formatNumber(a.kwh, 1) : '0'}
                    </td>
                    <td className="px-4 py-3 text-zinc-500">
                      {a?.last ? new Date(a.last).toLocaleString('nl-BE') : '—'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
