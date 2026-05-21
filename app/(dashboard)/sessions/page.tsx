import { createServerSupabase } from '@/lib/supabase/server';
import Link from 'next/link';
import { formatNumber } from '@/lib/utils';

function startOfDay(d: Date): string {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.toISOString();
}

function endOfDay(d: Date): string {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x.toISOString();
}

function defaultFrom(): string {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
}

function defaultTo(): string {
  return new Date().toISOString().slice(0, 10);
}

export default async function SessionsPage({
  searchParams,
}: {
  searchParams: { from?: string; to?: string };
}) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single();

  const orgId = profile?.organization_id ?? '';
  const fromStr = searchParams.from || defaultFrom();
  const toStr   = searchParams.to   || defaultTo();
  const fromIso = startOfDay(new Date(fromStr));
  const toIso   = endOfDay(new Date(toStr));

  const { data: sessions } = await supabase
    .from('charging_sessions')
    .select('id, started_at, ended_at, energy_kwh, status, location_type, user_id, charger_id')
    .eq('organization_id', orgId)
    .gte('started_at', fromIso)
    .lte('started_at', toIso)
    .order('started_at', { ascending: false })
    .limit(100);

  // Resolve driver names + charger labels in batch
  const userIds = Array.from(new Set((sessions ?? []).map(s => s.user_id).filter(Boolean) as string[]));
  const chargerIds = Array.from(new Set((sessions ?? []).map(s => s.charger_id)));

  const [{ data: drivers }, { data: chargers }] = await Promise.all([
    userIds.length
      ? supabase.from('profiles').select('id, full_name, email').in('id', userIds)
      : Promise.resolve({ data: [] as { id: string; full_name: string | null; email: string }[] }),
    chargerIds.length
      ? supabase.from('chargers').select('id, serial_number').in('id', chargerIds)
      : Promise.resolve({ data: [] as { id: string; serial_number: string }[] }),
  ]);

  const driverMap = new Map((drivers ?? []).map(d => [d.id, d.full_name || d.email]));
  const chargerMap = new Map((chargers ?? []).map(c => [c.id, c.serial_number]));

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Sessions</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {sessions?.length ?? 0} {(sessions?.length ?? 0) === 1 ? 'session' : 'sessions'} (last 100)
          </p>
        </div>
        <form className="flex flex-wrap items-center gap-3" method="get">
          <label className="text-xs text-zinc-500">
            From
            <input
              type="date"
              name="from"
              defaultValue={fromStr}
              className="ml-2 border border-zinc-300 px-2 py-1 text-sm"
            />
          </label>
          <label className="text-xs text-zinc-500">
            To
            <input
              type="date"
              name="to"
              defaultValue={toStr}
              className="ml-2 border border-zinc-300 px-2 py-1 text-sm"
            />
          </label>
          <button type="submit" className="bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800">
            Apply
          </button>
          <Link href="/sessions" className="text-xs text-zinc-500 underline">Reset</Link>
        </form>
      </header>

      <div className="border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50">
            <tr className="text-left text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500">
              <th className="px-4 py-3">Started</th>
              <th className="px-4 py-3">Driver</th>
              <th className="px-4 py-3">Charger</th>
              <th className="px-4 py-3 text-right">kWh</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {(sessions ?? []).length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-zinc-500">
                  No sessions in this date range.
                </td>
              </tr>
            ) : (
              sessions!.map(s => (
                <tr key={s.id} className="border-b border-zinc-100 last:border-0">
                  <td className="px-4 py-3 text-zinc-700">
                    {new Date(s.started_at).toLocaleString('nl-BE')}
                  </td>
                  <td className="px-4 py-3 text-zinc-900">
                    {s.user_id ? (driverMap.get(s.user_id) ?? '—') : '—'}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-zinc-700">
                    {chargerMap.get(s.charger_id) ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-zinc-900">
                    {formatNumber(Number(s.energy_kwh ?? 0), 2)}
                  </td>
                  <td className="px-4 py-3 text-zinc-700">{s.location_type}</td>
                  <td className="px-4 py-3 text-zinc-700">{s.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
