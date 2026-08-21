/**
 * Token pricing for the Gemini models this app runs on, in USD per million
 * tokens.
 *
 * Google publishes these; nothing here is derived, so the table has to be
 * updated by hand when pricing changes. It is the single source of truth for
 * both the cost stored on each provider run and the fallback the admin cost
 * dashboard computes for older runs that predate storing it — keeping them in
 * one place is what stops the two from drifting apart and reporting different
 * totals for the same runs.
 */
export const GEMINI_TOKEN_PRICING_USD_PER_MILLION: Record<
  string,
  { input: number; output: number }
> = {
  "gemini-2.5-flash-lite": { input: 0.1, output: 0.4 },
  "gemini-2.5-flash": { input: 0.3, output: 2.5 },
  "gemini-2.5-pro": { input: 1.25, output: 10.0 },
};

/**
 * Cost of one run, or undefined when it cannot be worked out.
 *
 * Returns undefined rather than 0 for an unpriced model: a missing price and a
 * genuinely free run are different facts, and recording the second when we mean
 * the first understates spend without anyone noticing. Callers store undefined
 * as NULL, which the dashboard already handles.
 */
export const estimateGeminiCostUsd = (input: {
  model: string;
  inputTokens?: number;
  outputTokens?: number;
}): number | undefined => {
  const pricing = GEMINI_TOKEN_PRICING_USD_PER_MILLION[input.model];
  if (!pricing) return undefined;
  if (input.inputTokens === undefined && input.outputTokens === undefined) return undefined;

  const inputCost = ((input.inputTokens ?? 0) / 1_000_000) * pricing.input;
  const outputCost = ((input.outputTokens ?? 0) / 1_000_000) * pricing.output;

  return inputCost + outputCost;
};
