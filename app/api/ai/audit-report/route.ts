/**
 * POST /api/ai/audit-report
 * -------------------------
 * Generate a Charge Fleet Audit Report for an organization.
 * Calls Claude API with AUDIT_REPORT_SYSTEM prompt.
 * Persists result + token usage + cost in ai_reports table.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabase } from '@/lib/supabase/server';
import { runAgent } from '@/lib/ai/client';
import { AUDIT_REPORT_SYSTEM, buildAuditUserMessage } from '@/lib/ai/prompts';

const RequestSchema = z.object({
  organizationId: z.string().uuid(),
  diagnostic: z.record(z.unknown()),
});

export async function POST(request: Request) {
  const supabase = createServerSupabase();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const parsed = RequestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const { organizationId, diagnostic } = parsed.data;

  // Insert pending record
  const { data: report, error: insertErr } = await supabase
    .from('ai_reports')
    .insert({
      organization_id: organizationId,
      type: 'fleet_audit',
      prompt_version: 'v2.0',
      input_payload: diagnostic,
      generated_by: user.id,
    } as never)
    .select('id')
    .single();

  if (insertErr || !report) {
    return NextResponse.json({ error: 'create_failed', message: insertErr?.message }, { status: 500 });
  }

  try {
    const agentResult = await runAgent<string>({
      agentKey: 'audit_report',
      systemPrompt: AUDIT_REPORT_SYSTEM,
      userMessage: buildAuditUserMessage(diagnostic),
      maxTokens: 16384,
      parseJson: false,
    });

    await supabase
      .from('ai_reports')
      .update({
        output_markdown: agentResult.output,
        model_used: agentResult.model,
        input_tokens: agentResult.inputTokens,
        output_tokens: agentResult.outputTokens,
        cost_eur: agentResult.costEur,
      } as never)
      .eq('id', report.id);

    return NextResponse.json({
      ok: true,
      report_id: report.id,
      markdown: agentResult.output,
      tokens: {
        input: agentResult.inputTokens,
        output: agentResult.outputTokens,
      },
      cost_eur: agentResult.costEur,
      duration_ms: agentResult.durationMs,
    });
  } catch (e) {
    return NextResponse.json(
      { error: 'agent_failed', message: e instanceof Error ? e.message : 'unknown' },
      { status: 500 }
    );
  }
}
