/**
 * GET /api/reimbursements/[id]/export
 * -----------------------------------
 * Generates the payroll-provider-specific export file for a batch
 * of reimbursements within the same period for the caller's organization.
 *
 * [id] = period identifier in format "YYYY-MM" (NOT a single-reimbursement UUID,
 *        as exports are batch-per-period).
 */

import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { getPayrollAdapter } from '@/lib/payroll/adapter';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response('unauthorized', { status: 401 });

  // Parse YYYY-MM
  const match = /^(\d{4})-(\d{2})$/.exec(params.id);
  if (!match) return new Response('invalid_period_format', { status: 400 });
  const periodYear = parseInt(match[1], 10);
  const periodMonth = parseInt(match[2], 10);

  // Get caller's org
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single();
  if (!profile?.organization_id) return new Response('no_org', { status: 404 });

  // Org settings — payroll provider + VAT
  const { data: org } = await supabase
    .from('organizations')
    .select('vat_number, payroll_provider, payroll_external_id')
    .eq('id', profile.organization_id)
    .single();
  if (!org?.payroll_provider) {
    return new Response('payroll_provider_not_configured', { status: 400 });
  }

  // Fetch approved reimbursements for the period
  const { data: reimbursements } = await supabase
    .from('reimbursements')
    .select('id, user_id, total_kwh, total_amount_eur, applied_rate_eur_per_kwh')
    .eq('organization_id', profile.organization_id)
    .eq('period_year', periodYear)
    .eq('period_month', periodMonth)
    .in('status', ['pending', 'approved']);

  if (!reimbursements || reimbursements.length === 0) {
    return new Response('no_reimbursements_for_period', { status: 404 });
  }

  // Resolve employee external IDs (from profiles.metadata.payroll_id)
  const userIds = reimbursements.map(r => r.user_id);
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, email, metadata')
    .in('id', userIds);

  const adapter = getPayrollAdapter(
    org.payroll_provider as Parameters<typeof getPayrollAdapter>[0]
  );

  const entries = reimbursements.map(r => {
    const p = profiles?.find(pp => pp.id === r.user_id);
    const externalId =
      (p?.metadata as Record<string, string> | undefined)?.payroll_id ??
      p?.id ?? // fallback: use Charge user id; payroll team must map
      'UNKNOWN';

    return {
      employee: {
        externalId,
        email: p?.email,
        fullName: p?.full_name ?? p?.email ?? 'Unknown',
      },
      result: {
        totalKwh: Number(r.total_kwh),
        appliedRateEurPerKwh: Number(r.applied_rate_eur_per_kwh),
        totalAmountEur: Number(r.total_amount_eur),
        sessionCount: 0,
        tariffSource: {
          year: periodYear,
          quarter: Math.ceil(periodMonth / 3),
          residentialRate: Number(r.applied_rate_eur_per_kwh),
          source: 'creg' as const,
        },
        excludedSessions: [],
        auditTrail: [],
      },
    };
  });

  const exportFile = await adapter.buildExport({
    organizationVatNumber: org.vat_number ?? 'UNKNOWN',
    periodYear,
    periodMonth,
    entries,
  });

  // Mark as exported
  await supabase
    .from('reimbursements')
    .update({ status: 'exported', exported_at: new Date().toISOString() })
    .in('id', reimbursements.map(r => r.id));

  return new Response(exportFile.payload, {
    headers: {
      'Content-Type': exportFile.contentType,
      'Content-Disposition': `attachment; filename="${exportFile.filename}"`,
    },
  });
}
