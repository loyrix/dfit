import {
  defaultMealScorePolicyConfig,
  mealScorePolicySchema,
  type MealScorePolicyContract,
} from "@logmyplate/contracts";
import type { DailyScorePolicy, StarThresholds, WeeklyScorePolicy } from "@logmyplate/domain";
import type { SqlClient } from "../db/client.js";

export const MEAL_SCORE_POLICY_KEY = "meal_score_policy";

/**
 * Runtime-tunable constants for Parts B–E, stored in app_runtime_config.
 *
 * Unlike `plate_score_policy`, these numbers never reach the client: every
 * rating is computed server-side, so editing the row is enough to change what
 * users see on their next request. That matters because the shipped defaults are
 * known to be harsh against real data — 60% of meals at one or two stars, 75% of
 * days scoring zero on calorie adherence — and the fix has to be available
 * without an app release.
 *
 * Every field defaults to the shipped value, so a missing or partial row falls
 * back rather than changing behaviour.
 */
export const parseMealScorePolicy = (value: unknown): MealScorePolicyContract => {
  const parsed = mealScorePolicySchema.safeParse(value);
  return parsed.success ? parsed.data : defaultMealScorePolicyConfig();
};

/**
 * The contract nests `meal` inside `daily` the same way the domain type does, so
 * the daily policy carries the meal policy rather than duplicating it.
 */
export const toDailyScorePolicy = (policy: MealScorePolicyContract): DailyScorePolicy => ({
  meal: policy.meal,
  calorieWindow: policy.daily.calorieWindow,
  calorieFalloff: policy.daily.calorieFalloff,
  blend: policy.daily.blend,
});

export const toWeeklyScorePolicy = (policy: MealScorePolicyContract): WeeklyScorePolicy =>
  policy.weekly;

export const toStarThresholds = (policy: MealScorePolicyContract): StarThresholds => policy.stars;

type RuntimeConfigRow = { value: unknown };

type CachedPolicy = {
  policy: MealScorePolicyContract;
  expiresAt: number;
};

const cacheTtlMs = 30_000;
let cached: CachedPolicy | undefined;

export const clearMealScorePolicyCache = (): void => {
  cached = undefined;
};

/**
 * Cached per process so the journal path does not pay a round-trip per request;
 * admin changes propagate within the TTL.
 */
export const loadMealScorePolicy = async (sql?: SqlClient): Promise<MealScorePolicyContract> => {
  // The whole body is guarded, not just the query. Scoring must never fail a
  // journal load, and that has to hold even if the defaults themselves stop
  // parsing — which is exactly how a bad schema bound surfaced during Phase 8,
  // as a 500 on every journal request rather than a missing star.
  try {
    if (!sql) return defaultMealScorePolicyConfig();
    if (cached && cached.expiresAt > Date.now()) return cached.policy;

    const [row] = await sql<RuntimeConfigRow[]>`
      select value
      from app_runtime_config
      where key = ${MEAL_SCORE_POLICY_KEY}
      limit 1
    `;
    const policy = row ? parseMealScorePolicy(row.value) : defaultMealScorePolicyConfig();
    cached = { policy, expiresAt: Date.now() + cacheTtlMs };
    return policy;
  } catch {
    return defaultMealScorePolicyConfig();
  }
};
