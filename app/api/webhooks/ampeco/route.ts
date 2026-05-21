/**
 * POST /api/webhooks/ampeco
 * -------------------------
 * Receives session-completed + charger-status events from AMPECO.
 * Verifies HMAC signature, normalizes payload, upserts into charging_sessions / chargers.
 */

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createServiceSupabase } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const signature = request.headers.get('x-ampeco-signature');
  const rawBody = await request.text();

  // Verify HMAC-SHA256
  if (process.env.AMPECO_WEBHOOK_SECRET && signature) {
    const expected = crypto
      .createHmac('sha256', process.env.AMPECO_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');
    if (signature !== expected) {
      return NextResponse.json({ error: 'invalid_signature' }, { status: 401 });
    }
  }

  const payload = JSON.parse(rawBody);
  const supabase = createServiceSupabase();

  switch (payload.event) {
    case 'session.completed': {
      const s = payload.data;
      const { data: charger } = await supabase
        .from('chargers')
        .select('id, organization_id')
        .eq('ampeco_id', s.charge_point_id)
        .single();
      if (!charger) break;

      await supabase.from('charging_sessions').upsert({
        organization_id: charger.organization_id,
        charger_id: charger.id,
        ampeco_session_id: s.id,
        started_at: s.started_at,
        ended_at: s.ended_at,
        energy_kwh: s.energy_kwh,
        peak_power_kw: s.peak_power_kw,
        status: 'completed',
        location_type: s.location_type ?? 'home',
        rfid_token: s.user_token,
      } as never, { onConflict: 'ampeco_session_id' });
      break;
    }
    case 'charger.status_changed': {
      await supabase
        .from('chargers')
        .update({ status: mapAmpecoStatus(payload.data.status), last_seen_at: new Date().toISOString() } as never)
        .eq('ampeco_id', payload.data.charge_point_id);
      break;
    }
    default:
      // Ignore unknown events for forward compat
      break;
  }

  return NextResponse.json({ ok: true });
}

function mapAmpecoStatus(s: string) {
  switch (s) {
    case 'Available': return 'online';
    case 'Charging': return 'charging';
    case 'Faulted': return 'fault';
    case 'Maintenance': return 'maintenance';
    default: return 'offline';
  }
}
