import { z } from "zod";
import type { SqlClient } from "../db/client.js";

export const AI_SCAN_CONFIG_KEY = "ai_scan_config";

/**
 * Runtime-tunable settings for food-photo scan analysis, stored in
 * app_runtime_config and edited from the admin backoffice. Accuracy-first:
 * every default preserves existing provider behaviour, so nothing changes
 * until an operator explicitly saves a value.
 *
 * thinkingBudget: -1 = dynamic thinking (model decides), 0 = thinking off
 * (fastest), positive = capped thinking token budget.
 */
export const aiScanConfigSchema = z.object({
  thinkingBudget: z.coerce.number().int().min(-1).max(24_576).default(-1),
});

export type AiScanConfig = z.infer<typeof aiScanConfigSchema>;

export const defaultAiScanConfig = (): AiScanConfig => aiScanConfigSchema.parse({});

export const parseAiScanConfig = (value: unknown): AiScanConfig => {
  const parsed = aiScanConfigSchema.safeParse(value);
  return parsed.success ? parsed.data : defaultAiScanConfig();
};

type RuntimeConfigRow = {
  value: unknown;
};

type CachedConfig = {
  config: AiScanConfig | undefined;
  expiresAt: number;
};

const cacheTtlMs = 30_000;
let cached: CachedConfig | undefined;

export const clearAiScanConfigCache = (): void => {
  cached = undefined;
};

/**
 * Loads the runtime scan config, or undefined when no row has been saved yet
 * (callers then fall back to env/provider defaults). Cached for 30 seconds per
 * process so the hot analyze path does not pay a database round-trip on every
 * scan; admin changes propagate within the TTL.
 */
export const loadAiScanConfig = async (sql?: SqlClient): Promise<AiScanConfig | undefined> => {
  if (!sql) return undefined;
  if (cached && cached.expiresAt > Date.now()) return cached.config;

  const [row] = await sql<RuntimeConfigRow[]>`
    select value
    from app_runtime_config
    where key = ${AI_SCAN_CONFIG_KEY}
    limit 1
  `;
  const config = row ? parseAiScanConfig(row.value) : undefined;
  cached = { config, expiresAt: Date.now() + cacheTtlMs };
  return config;
};
