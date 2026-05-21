/**
 * CPMS Adapter — abstraction over AMPECO / Monta / own implementation
 * ===================================================================
 *
 * Why this matters: in 2-3 years we may want to migrate off AMPECO
 * (cost, features, or strategic). Without this interface, everything
 * touching charger state would need rewriting. With it: swap one file.
 */

export type ChargerState = 'online' | 'offline' | 'charging' | 'fault' | 'maintenance';

export interface CpmsCharger {
  externalId: string;          // AMPECO charge_point_id
  serialNumber: string;
  brand: string;
  model: string;
  powerKw: number;
  state: ChargerState;
  lastSeenAt: Date | null;
  firmware?: string;
}

export interface CpmsSession {
  externalId: string;
  chargerExternalId: string;
  userToken?: string;          // RFID or driver app token
  startedAt: Date;
  endedAt: Date | null;
  energyKwh: number;
  peakPowerKw: number;
  status: 'started' | 'completed' | 'failed';
}

export interface CpmsAdapter {
  readonly providerKey: 'ampeco' | 'monta' | 'own';

  /** List chargers for an organization (via tenant_id mapping in CPMS) */
  listChargers(tenantExternalId: string): Promise<CpmsCharger[]>;

  /** Stream / paginate sessions for a date range */
  listSessions(opts: {
    tenantExternalId: string;
    from: Date;
    to: Date;
    cursor?: string;
  }): Promise<{ sessions: CpmsSession[]; nextCursor?: string }>;

  /** Remote start/stop (rarely used from Charge UI, but available) */
  startCharge(chargerExternalId: string, userToken: string): Promise<{ ok: boolean; sessionExternalId?: string }>;
  stopCharge(sessionExternalId: string): Promise<{ ok: boolean }>;

  /** Push firmware OTA (admin function) */
  updateFirmware?(chargerExternalId: string, firmwareVersion: string): Promise<{ ok: boolean }>;

  /** Provision a new charger into the CPMS */
  provisionCharger(input: {
    tenantExternalId: string;
    serialNumber: string;
    brand: string;
    model: string;
    siteName: string;
  }): Promise<{ externalId: string }>;
}

// =====================================================
// AMPECO implementation
// =====================================================

export class AmpecoAdapter implements CpmsAdapter {
  readonly providerKey = 'ampeco' as const;
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = process.env.AMPECO_API_BASE_URL ?? 'https://api.ampeco.com';
    this.apiKey = process.env.AMPECO_API_KEY ?? '';
    if (!this.apiKey) {
      console.warn('[AmpecoAdapter] AMPECO_API_KEY not configured — calls will fail');
    }
  }

  private async fetch<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
    });
    if (!res.ok) {
      throw new Error(`AMPECO ${res.status}: ${await res.text()}`);
    }
    return res.json() as Promise<T>;
  }

  async listChargers(tenantExternalId: string): Promise<CpmsCharger[]> {
    const r = await this.fetch<{ data: any[] }>(`/v1/charge-points?tenant=${tenantExternalId}`);
    return r.data.map(c => ({
      externalId: c.id,
      serialNumber: c.serial_number,
      brand: c.brand,
      model: c.model,
      powerKw: c.max_power_kw,
      state: mapAmpecoState(c.status),
      lastSeenAt: c.last_heartbeat_at ? new Date(c.last_heartbeat_at) : null,
      firmware: c.firmware_version,
    }));
  }

  async listSessions(opts: { tenantExternalId: string; from: Date; to: Date; cursor?: string; }) {
    const params = new URLSearchParams({
      tenant: opts.tenantExternalId,
      from: opts.from.toISOString(),
      to: opts.to.toISOString(),
      ...(opts.cursor ? { cursor: opts.cursor } : {}),
      limit: '500',
    });
    const r = await this.fetch<{ data: any[]; next_cursor?: string }>(`/v1/sessions?${params}`);
    return {
      sessions: r.data.map(s => ({
        externalId: s.id,
        chargerExternalId: s.charge_point_id,
        userToken: s.user_token,
        startedAt: new Date(s.started_at),
        endedAt: s.ended_at ? new Date(s.ended_at) : null,
        energyKwh: s.energy_kwh,
        peakPowerKw: s.peak_power_kw,
        status: s.status,
      })),
      nextCursor: r.next_cursor,
    };
  }

  async startCharge(chargerExternalId: string, userToken: string) {
    const r = await this.fetch<{ session_id: string }>(`/v1/charge-points/${chargerExternalId}/start`, {
      method: 'POST',
      body: JSON.stringify({ user_token: userToken }),
    });
    return { ok: true, sessionExternalId: r.session_id };
  }

  async stopCharge(sessionExternalId: string) {
    await this.fetch(`/v1/sessions/${sessionExternalId}/stop`, { method: 'POST' });
    return { ok: true };
  }

  async provisionCharger(input: { tenantExternalId: string; serialNumber: string; brand: string; model: string; siteName: string; }) {
    const r = await this.fetch<{ id: string }>(`/v1/charge-points`, {
      method: 'POST',
      body: JSON.stringify({
        tenant_id: input.tenantExternalId,
        serial_number: input.serialNumber,
        brand: input.brand,
        model: input.model,
        site_name: input.siteName,
      }),
    });
    return { externalId: r.id };
  }
}

function mapAmpecoState(s: string): ChargerState {
  switch (s) {
    case 'Available': return 'online';
    case 'Charging': return 'charging';
    case 'Faulted': return 'fault';
    case 'Maintenance': return 'maintenance';
    default: return 'offline';
  }
}

// =====================================================
// Factory
// =====================================================

export function getCpmsAdapter(): CpmsAdapter {
  const provider = (process.env.CPMS_PROVIDER ?? 'ampeco') as CpmsAdapter['providerKey'];
  switch (provider) {
    case 'ampeco': return new AmpecoAdapter();
    default: throw new Error(`CPMS provider not implemented: ${provider}`);
  }
}
