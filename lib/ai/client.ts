/**
 * Claude API client for Charge AI agents
 * ======================================
 *
 * Single source of truth for AI inference.
 * Handles retries, cost tracking, structured outputs.
 */

import Anthropic from '@anthropic-ai/sdk';
import { PROMPT_VERSIONS } from './prompts';

const MODEL = process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-5';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY ?? '',
});

export type AgentResult<T = unknown> = {
  output: T;
  rawText: string;
  model: string;
  promptVersion: string;
  inputTokens: number;
  outputTokens: number;
  costEur: number;
  durationMs: number;
};

const PRICING_USD = {
  // Claude Sonnet 4.5 pricing per 1M tokens (approx Q2 2026)
  input: 3.0,
  output: 15.0,
};
const USD_TO_EUR = 0.92;

function estimateCost(inputTokens: number, outputTokens: number): number {
  const usd = (inputTokens / 1_000_000) * PRICING_USD.input
            + (outputTokens / 1_000_000) * PRICING_USD.output;
  return Math.round(usd * USD_TO_EUR * 10000) / 10000;
}

export async function runAgent<T = unknown>(opts: {
  agentKey: keyof typeof PROMPT_VERSIONS;
  systemPrompt: string;
  userMessage: string;
  maxTokens?: number;
  parseJson?: boolean;
}): Promise<AgentResult<T>> {
  const start = Date.now();

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: opts.maxTokens ?? 4096,
    system: opts.systemPrompt,
    messages: [{ role: 'user', content: opts.userMessage }],
  });

  const rawText = response.content
    .filter(block => block.type === 'text')
    .map(block => (block as { text: string }).text)
    .join('\n');

  let output: T;
  if (opts.parseJson) {
    // Extract JSON from response (may be wrapped in markdown fences)
    const match = rawText.match(/\{[\s\S]*\}/);
    if (!match) throw new Error(`Agent ${opts.agentKey} did not return JSON: ${rawText.slice(0, 200)}`);
    output = JSON.parse(match[0]) as T;
  } else {
    output = rawText as unknown as T;
  }

  return {
    output,
    rawText,
    model: response.model,
    promptVersion: PROMPT_VERSIONS[opts.agentKey],
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    costEur: estimateCost(response.usage.input_tokens, response.usage.output_tokens),
    durationMs: Date.now() - start,
  };
}
