import { createServerSupabase } from '@/lib/supabase/server';
import Link from 'next/link';
import type { ChargerState } from '@/types/database';

const STATUS_FILTERS: Array<{ key: string; label: string; value?: ChargerState }> = [
  { key: 'all', label: 'All' },
  { key: 'online', label: 'Online', value: 'online' },
  { key: 'charging', label: 'Charging', value: 'charging' },
  { key: 'offline', label: 'Offline', value: 'offline' },
  { key: 'fault', label: 'Fault', value: 'fault' },
  { key: 'maintenance', label: 'Maintenance', value: 'maintenance' },
];

function statusClass(s: ChargerState | string) {
  switch (s) {
    case 'online':      return 'text-emerald-700';
    case 'charging':    return 'text-blue-700';
    case 'offline':     return 'text-zinc-500';
    case 'fault':       return 'text-red-700';
    case 'maintenance': return 'text-amber-700';
    default:            return 'text-zinc-700';
  }
}

export default async function ChargersPage({
  searchParams,
}: {
  searchParams: { status?: string };
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
  const statusKey = searchParams.status ?? 'all';
  const statusFilter = STATUS_FILTERS.find(f => f.key === statusKey);

  let query = supabase
    .from('chargers')
    .select('id, serial_number, brand, model, power_kw, status, last_seen_at, site_id')
    .eq('organization_id', orgId)
    .order('serial_number', { ascending: true });

  if (statusFilter?.value) {
    query = query.eq('status', statusFilter.value);
  }

  const { data: chargers } = await query;

  // Resolve site names in a single batch
  const siteIds = Array.from(new Set((chargers ?? []).map(c => c.site_id)));
  const { data: sites } = siteIds.length
    ? await supabase.from('sites').select('id, name').in('id', siteIds)
    : { data: [] };
  const siteMap = new Map((sites ?? []).map(s => [s.id, s.name]));

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Chargers</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {chargers?.length ?? 0} {(chargers?.length ?? 0) === 1 ? 'charger' : 'chargers'}
          </p>
        </div>
      </header>

      <nav className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map(f => {
          const isActive = f.key === statusKey;
          const href = f.key === 'all' ? '/chargers' : `/chargers?status=${f.key}`;
          return (
            <Link
              key={f.key}
              href={href}
              className={`border px-3 py-1.5 text-xs ${
                isActive
                  ? 'border-zinc-900 bg-zinc-900 text-white'
                  : 'border-zinc-300 bg-white text-zinc-700 hover:border-zinc-500'
              }`}
            >
              {f.label}
            </Link>
          );
        })}
      </nav>

      <div className="border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50">
            <tr className="text-left text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500">
              <th className="px-4 py-3">Serial</th>
              <th className="px-4 py-3">Brand</th>
              <th className="px-4 py-3">Model</th>
              <th className="px-4 py-3">Site</th>
              <th className="px-4 py-3 text-right">Power</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Last seen</th>
            </tr>
          </thead>
          <tbody>
            {(chargers ?? []).length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-sm text-zinc-500">
                  No chargers match this filter.
                </td>
              </tr>
            ) : (
              chargers!.map(c => (
                <tr key={c.id} className="border-b border-zinc-100 last:border-0">
                  <td className="px-4 py-3 font-mono text-xs text-zinc-900">{c.serial_number}</td>
                  <td className="px-4 py-3 text-zinc-700">{c.brand}</td>
                  <td className="px-4 py-3 text-zinc-700">{c.model}</td>
                  <td className="px-4 py-3 text-zinc-700">{siteMap.get(c.site_id) ?? '—'}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-zinc-900">
                    {Number(c.power_kw).toFixed(0)} kW
                  </td>
                  <td className={`px-4 py-3 font-medium ${statusClass(c.status)}`}>{c.status}</td>
                  <td className="px-4 py-3 text-zinc-500">
                    {c.last_seen_at ? new Date(c.last_seen_at).toLocaleString('nl-BE') : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
