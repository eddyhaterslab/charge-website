/**
 * Payroll Adapter — abstraction over Belgian payroll providers
 * ============================================================
 *
 * Charge's competitive moat lives in this file.
 *
 * Every payroll provider (SD Worx, Securex, Acerta, Liantis) has its own
 * idiosyncrasies — different APIs, file formats, field semantics, auth.
 * Customers don't care. They want "show me my export, click button, done."
 *
 * This adapter standardizes the interface. Each provider implements it.
 * Adding a new provider = new class implementing PayrollAdapter.
 */

import type { ReimbursementResult } from '@/lib/reimbursement/engine';

// =====================================================
// The interface every provider implements
// =====================================================

export interface PayrollEmployeeRef {
  /** Provider-side stable employee identifier (varies by system) */
  externalId: string;
  /** Belgian national number (rijksregister), optional fallback */
  nationalNumber?: string;
  email?: string;
  fullName: string;
}

export interface PayrollAdapter {
  readonly providerKey: 'sd_worx' | 'securex' | 'acerta' | 'liantis';
  readonly displayName: string;

  /**
   * Validate that an org's payroll credentials work.
   * Called on integration setup.
   */
  testConnection(credentials: Record<string, string>): Promise<{
    ok: boolean;
    message: string;
    employeeCountSample?: number;
  }>;

  /**
   * Resolve a Charge user to their payroll-side employee record.
   * Critical: the matching logic differs per provider.
   */
  resolveEmployee(
    credentials: Record<string, string>,
    chargeUserHints: { email?: string; nationalNumber?: string; fullName: string }
  ): Promise<PayrollEmployeeRef | null>;

  /**
   * Build the export payload for a batch of reimbursements.
   * Each provider has different format requirements.
   */
  buildExport(input: {
    organizationVatNumber: string;
    periodYear: number;
    periodMonth: number;
    entries: Array<{
      employee: PayrollEmployeeRef;
      result: ReimbursementResult;
      paymentCode?: string;
    }>;
  }): Promise<{
    format: 'csv' | 'xml' | 'json' | 'soap';
    filename: string;
    payload: string;
    contentType: string;
  }>;

  /**
   * Optionally push the export directly to the provider's API.
   * Returns the provider-side reference (for audit / dispute trail).
   */
  pushExport?(input: {
    credentials: Record<string, string>;
    payload: string;
    periodYear: number;
    periodMonth: number;
  }): Promise<{
    success: boolean;
    providerReference: string;
    rawResponse?: unknown;
  }>;
}

// =====================================================
// SD Worx implementation (the priority — biggest market share BE)
// =====================================================

export class SDWorxAdapter implements PayrollAdapter {
  readonly providerKey = 'sd_worx' as const;
  readonly displayName = 'SD Worx';

  async testConnection(credentials: Record<string, string>) {
    // SD Worx API expects: client_id, client_secret, tenant_id
    const { client_id, client_secret, tenant_id } = credentials;
    if (!client_id || !client_secret || !tenant_id) {
      return { ok: false, message: 'Missing SD Worx credentials' };
    }
    // TODO: hit SD Worx OAuth2 token endpoint and small probe
    // For MVP we accept presence-of-credentials as "configured"
    return { ok: true, message: 'Credentials present', employeeCountSample: undefined };
  }

  async resolveEmployee(
    _credentials: Record<string, string>,
    hints: { email?: string; nationalNumber?: string; fullName: string }
  ): Promise<PayrollEmployeeRef | null> {
    // In production: GET /employees?search=email or nationalNumber
    // For MVP: caller passes the external_id already mapped in org settings
    return null;
  }

  async buildExport(input: {
    organizationVatNumber: string;
    periodYear: number;
    periodMonth: number;
    entries: Array<{
      employee: PayrollEmployeeRef;
      result: ReimbursementResult;
      paymentCode?: string;
    }>;
  }) {
    // SD Worx variable-pay import expects CSV with semicolon separators
    // Columns: EmployeeID;PeriodYear;PeriodMonth;Code;Amount;Description
    const header = 'EmployeeID;PeriodYear;PeriodMonth;PaymentCode;Amount;Description';
    const lines = input.entries.map(e => {
      const code = e.paymentCode ?? 'EV_REIMB';
      const desc = `EV home charging ${input.periodYear}-${String(input.periodMonth).padStart(2, '0')} (${e.result.totalKwh.toFixed(2)} kWh @ €${e.result.appliedRateEurPerKwh}/kWh)`;
      // CSV-safe: SD Worx wants no quotes, commas escaped
      const safeDesc = desc.replace(/[;\n\r]/g, ' ');
      return [
        e.employee.externalId,
        input.periodYear,
        input.periodMonth,
        code,
        e.result.totalAmountEur.toFixed(2).replace('.', ','), // BE locale uses comma
        safeDesc,
      ].join(';');
    });

    const payload = [header, ...lines].join('\r\n');
    const filename = `sdworx-charge-${input.organizationVatNumber}-${input.periodYear}-${String(input.periodMonth).padStart(2, '0')}.csv`;

    return {
      format: 'csv' as const,
      filename,
      payload,
      contentType: 'text/csv; charset=utf-8',
    };
  }

  // pushExport intentionally omitted for MVP — customer downloads CSV
  // and imports via SD Worx web portal. Direct API push deferred to v2.
}

// =====================================================
// Securex stub (year 2)
// =====================================================

export class SecurexAdapter implements PayrollAdapter {
  readonly providerKey = 'securex' as const;
  readonly displayName = 'Securex';

  async testConnection() {
    return { ok: false, message: 'Securex integration scheduled Q3 2027' };
  }
  async resolveEmployee() { return null; }
  async buildExport(input: Parameters<PayrollAdapter['buildExport']>[0]) {
    // Stub: generic CSV until proper Securex impl
    return new SDWorxAdapter().buildExport(input);
  }
}

// =====================================================
// Acerta stub (year 2)
// =====================================================

export class AcertaAdapter implements PayrollAdapter {
  readonly providerKey = 'acerta' as const;
  readonly displayName = 'Acerta';

  async testConnection() {
    return { ok: false, message: 'Acerta integration scheduled Q4 2027' };
  }
  async resolveEmployee() { return null; }
  async buildExport(input: Parameters<PayrollAdapter['buildExport']>[0]) {
    return new SDWorxAdapter().buildExport(input);
  }
}

// =====================================================
// Factory
// =====================================================

export function getPayrollAdapter(providerKey: PayrollAdapter['providerKey']): PayrollAdapter {
  switch (providerKey) {
    case 'sd_worx': return new SDWorxAdapter();
    case 'securex': return new SecurexAdapter();
    case 'acerta': return new AcertaAdapter();
    case 'liantis': throw new Error('Liantis adapter not yet implemented');
  }
}
