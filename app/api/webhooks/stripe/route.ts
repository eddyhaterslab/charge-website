/**
 * POST /api/webhooks/stripe
 * -------------------------
 * Stripe webhook receiver.
 *
 * Required env:
 *   STRIPE_SECRET_KEY      — Stripe API key (sk_live_… or sk_test_…)
 *   STRIPE_WEBHOOK_SECRET  — Endpoint signing secret (whsec_…)
 *
 * Events handled (skeleton — extend in v2):
 *   - customer.subscription.created
 *   - customer.subscription.updated
 *   - customer.subscription.deleted
 *   - invoice.paid
 *   - invoice.payment_failed
 *
 * The route returns 200 fast after verifying the signature. Any database
 * write that fails is logged but does NOT cause a 5xx — Stripe will retry
 * on real failure, but we don't want noisy retries for write conflicts.
 */

import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServiceSupabase } from '@/lib/supabase/server';

const STRIPE_SECRET_KEY     = process.env.STRIPE_SECRET_KEY ?? '';
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? '';

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });

// Stripe needs the raw body bytes to verify the signature, so opt out of
// Next's body parsing.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const signature = request.headers.get('stripe-signature');
  const rawBody   = await request.text();

  if (!STRIPE_WEBHOOK_SECRET || !signature) {
    return NextResponse.json({ error: 'missing_signature_or_secret' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'invalid';
    return NextResponse.json({ error: 'invalid_signature', message: msg }, { status: 400 });
  }

  // Acknowledge fast — do db work after but before returning.
  try {
    await handleEvent(event);
  } catch (err) {
    console.error('[stripe.webhook] handler error', { type: event.type, err });
    // We still return 200 to prevent infinite retry on persistent errors;
    // log + alerting (Sentry) should pick this up. Swap to 500 once on-call
    // is established.
  }

  return NextResponse.json({ received: true });
}

async function handleEvent(event: Stripe.Event) {
  const supabase = createServiceSupabase();

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;

      // Try locating the organization either by the existing
      // stripe_subscription_id OR by stripe_customer_id (first webhook of
      // a fresh subscription).
      const { data: existing } = await supabase
        .from('subscriptions')
        .select('id, organization_id')
        .or(`stripe_subscription_id.eq.${sub.id},stripe_customer_id.eq.${customerId}`)
        .maybeSingle();

      if (!existing) {
        console.warn('[stripe.webhook] no subscription row matches', { customerId, subId: sub.id });
        return;
      }

      await supabase
        .from('subscriptions')
        .update({
          stripe_customer_id:       customerId,
          stripe_subscription_id:   sub.id,
          status:                   mapStripeStatus(sub.status),
          current_period_starts_at: sub.current_period_start ? new Date(sub.current_period_start * 1000).toISOString() : null,
          current_period_ends_at:   sub.current_period_end   ? new Date(sub.current_period_end   * 1000).toISOString() : null,
          trial_ends_at:            sub.trial_end            ? new Date(sub.trial_end            * 1000).toISOString() : null,
          canceled_at:              sub.canceled_at          ? new Date(sub.canceled_at          * 1000).toISOString() : null,
        } as never)
        .eq('id', existing.id);
      return;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      await supabase
        .from('subscriptions')
        .update({
          status: 'canceled',
          canceled_at: new Date().toISOString(),
        } as never)
        .eq('stripe_subscription_id', sub.id);
      return;
    }

    case 'invoice.paid':
    case 'invoice.payment_failed': {
      const inv = event.data.object as Stripe.Invoice;
      const customerId = typeof inv.customer === 'string' ? inv.customer : inv.customer?.id ?? '';
      if (!customerId) return;

      const { data: sub } = await supabase
        .from('subscriptions')
        .select('organization_id')
        .eq('stripe_customer_id', customerId)
        .maybeSingle();
      if (!sub?.organization_id) return;

      const periodStart = inv.period_start ? new Date(inv.period_start * 1000) : new Date();
      const status = event.type === 'invoice.paid' ? 'paid' : 'overdue';

      await supabase
        .from('invoices')
        .upsert({
          organization_id: sub.organization_id,
          invoice_number:  inv.number ?? inv.id,
          stripe_invoice_id: inv.id,
          period_year:     periodStart.getUTCFullYear(),
          period_month:    periodStart.getUTCMonth() + 1,
          subtotal_eur:    (inv.subtotal ?? 0) / 100,
          vat_eur:         (inv.tax ?? 0) / 100,
          total_eur:       (inv.total ?? 0) / 100,
          status,
          due_date:        inv.due_date ? new Date(inv.due_date * 1000).toISOString().slice(0, 10) : null,
          paid_at:         event.type === 'invoice.paid'
            ? (inv.status_transitions?.paid_at
                ? new Date(inv.status_transitions.paid_at * 1000).toISOString()
                : new Date().toISOString())
            : null,
          pdf_url:         inv.invoice_pdf ?? null,
        } as never, { onConflict: 'stripe_invoice_id' });
      return;
    }

    default:
      // Ignore unhandled events to stay forward-compatible.
      return;
  }
}

function mapStripeStatus(s: Stripe.Subscription.Status): 'trialing' | 'active' | 'past_due' | 'canceled' | 'paused' {
  switch (s) {
    case 'trialing':           return 'trialing';
    case 'active':             return 'active';
    case 'past_due':           return 'past_due';
    case 'canceled':           return 'canceled';
    case 'incomplete':         return 'past_due';
    case 'incomplete_expired': return 'canceled';
    case 'unpaid':             return 'past_due';
    case 'paused':             return 'paused';
    default:                   return 'past_due';
  }
}
