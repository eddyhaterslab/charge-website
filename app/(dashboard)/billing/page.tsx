import { createServerSupabase } from '@/lib/supabase/server';
import { formatCurrency } from '@/lib/utils';

export default async function BillingPage() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single();

  const orgId = profile?.organization_id ?? '';

  const [{ data: subscription }, { count: chargerCount }, { count: userCount }, { data: invoices }] = await Promise.all([
    supabase
      .from('subscriptions')
      .select('id, status, tier, per_charger_fee_eur, per_user_fee_eur, active_chargers, active_users, current_period_starts_at, current_period_ends_at, stripe_customer_id, trial_ends_at')
      .eq('organization_id', orgId)
      .maybeSingle(),
    supabase
      .from('chargers')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('is_active', true),
    supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('is_active', true)
      .eq('role', 'org_driver'),
    supabase
      .from('invoices')
      .select('id, invoice_number, period_year, period_month, total_eur, status, due_date, paid_at, pdf_url')
      .eq('organization_id', orgId)
      .order('period_year', { ascending: false })
      .order('period_month', { ascending: false })
      .limit(12),
  ]);

  const perCharger = Number(subscription?.per_charger_fee_eur ?? 0);
  const perUser    = Number(subscription?.per_user_fee_eur ?? 0);
  const chargers   = chargerCount ?? 0;
  const users      = userCount ?? 0;
  const projectedMonthly = chargers * perCharger + users * perUser;

  const portalEnabled = Boolean(subscription?.stripe_customer_id);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Billing</h1>
        <p className="mt-1 text-sm text-zinc-500">Subscription, projected charges, and invoices.</p>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="border border-zinc-200 bg-white p-5">
          <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500">Plan</div>
          <div className="mt-2 text-2xl font-semibold text-zinc-900">
            {subscription?.tier ? subscription.tier.toUpperCase() : '—'}
          </div>
          <div className="mt-1 text-xs text-zinc-500">
            Status: {subscription?.status ?? 'no subscription'}
          </div>
        </div>
        <div className="border border-zinc-200 bg-white p-5">
          <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500">
            Projected this month
          </div>
          <div className="mt-2 text-2xl font-semibold tabular-nums text-zinc-900">
            {formatCurrency(projectedMonthly)}
          </div>
          <div className="mt-1 text-xs text-zinc-500">
            {chargers} chargers × {formatCurrency(perCharger)} + {users} users × {formatCurrency(perUser)}
          </div>
        </div>
        <div className="border border-zinc-200 bg-white p-5">
          <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500">
            Current period
          </div>
          <div className="mt-2 text-sm text-zinc-900">
            {subscription?.current_period_starts_at
              ? new Date(subscription.current_period_starts_at).toLocaleDateString('nl-BE')
              : '—'}{' '}
            →{' '}
            {subscription?.current_period_ends_at
              ? new Date(subscription.current_period_ends_at).toLocaleDateString('nl-BE')
              : '—'}
          </div>
          <div className="mt-3">
            {portalEnabled ? (
              <a
                href={`/api/billing/portal`}
                className="border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-900 hover:border-zinc-500"
              >
                Update payment method
              </a>
            ) : (
              <span className="text-xs text-zinc-500">Stripe customer portal — Coming soon</span>
            )}
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-zinc-500">Invoices</h2>
        <div className="border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50">
              <tr className="text-left text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500">
                <th className="px-4 py-3">Invoice</th>
                <th className="px-4 py-3">Period</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Due</th>
                <th className="px-4 py-3 text-right">PDF</th>
              </tr>
            </thead>
            <tbody>
              {(invoices ?? []).length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-zinc-500">
                    No invoices yet. The first invoice generates on the 1st of next month.
                  </td>
                </tr>
              ) : (
                invoices!.map(inv => (
                  <tr key={inv.id} className="border-b border-zinc-100 last:border-0">
                    <td className="px-4 py-3 font-mono text-xs text-zinc-900">{inv.invoice_number}</td>
                    <td className="px-4 py-3 text-zinc-700">
                      {inv.period_year}-{String(inv.period_month).padStart(2, '0')}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-zinc-900">
                      {formatCurrency(Number(inv.total_eur))}
                    </td>
                    <td className="px-4 py-3 text-zinc-700">{inv.status}</td>
                    <td className="px-4 py-3 text-zinc-500">
                      {inv.due_date ? new Date(inv.due_date).toLocaleDateString('nl-BE') : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {inv.pdf_url ? (
                        <a href={inv.pdf_url} className="text-xs text-zinc-900 underline">Open</a>
                      ) : (
                        <span className="text-xs text-zinc-500">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
