import {
  defaultPlateScorePolicyConfig,
  plateScorePolicySchema,
  type PlateScorePolicyContract,
} from "@logmyplate/contracts";
import type { PlateScorePolicy } from "@logmyplate/domain";
import type { SqlClient } from "../db/client.js";

export const PLATE_SCORE_POLICY_KEY = "plate_score_policy";

/**
 * Runtime-tunable Plate Score constants, stored in app_runtime_config.
 *
 * Serving these lets the mobile app compute an identical score locally, so the
 * review screen updates instantly while the user edits portions. Because only
 * the numbers travel — never the algorithm — they stay tunable from the backend
 * without shipping an app release.
 *
 * Every field has a default matching the shipped values, so a missing row or a
 * partially filled one falls back rather than changing behaviour.
 */
export const parsePlateScorePolicy = (value: unknown): PlateScorePolicyContract => {
  const parsed = plateScorePolicySchema.safeParse(value);
  return parsed.success ? parsed.data : defaultPlateScorePolicyConfig();
};

/** The contract shape and the domain shape are structurally identical by design. */
export const toDomainPlateScorePolicy = (policy: PlateScorePolicyContract): PlateScorePolicy =>
  policy;

type RuntimeConfigRow = { value: unknown };

type CachedPolicy = {
  policy: PlateScorePolicyContract;
  expiresAt: number;
};

const cacheTtlMs = 30_000;
let cached: CachedPolicy | undefined;

export const clearPlateScorePolicyCache = (): void => {
  cached = undefined;
};

/**
 * Cached per process so the hot scan and journal paths do not pay a database
 * round-trip per request; admin changes propagate within the TTL.
 */
export const loadPlateScorePolicy = async (sql?: SqlClient): Promise<PlateScorePolicyContract> => {
  if (!sql) return defaultPlateScorePolicyConfig();
  if (cached && cached.expiresAt > Date.now()) return cached.policy;

  try {
    const [row] = await sql<RuntimeConfigRow[]>`
      select value
      from app_runtime_config
      where key = ${PLATE_SCORE_POLICY_KEY}
      limit 1
    `;
    const policy = row ? parsePlateScorePolicy(row.value) : defaultPlateScorePolicyConfig();
    cached = { policy, expiresAt: Date.now() + cacheTtlMs };
    return policy;
  } catch {
    // Scoring must never fail a scan or a journal load over a config lookup.
    return defaultPlateScorePolicyConfig();
  }
};
