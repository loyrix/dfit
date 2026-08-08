/**
 * Part E — star rating and guidance messages.
 *
 * Implements `docs/meal-health-score-logic.md` Part E. This is the only layer
 * users actually see: everything in Parts B, C and D produces a 0–100 number
 * that stays internal.
 *
 * **Why stars rather than the number.** "73/100" implies a precision a
 * macro-based heuristic does not have, and hands the user a figure to optimise
 * anxiously. Stars carry the same practical signal — roughly how balanced things
 * are — without the false precision. The numeric score is still computed and
 * kept for tuning and analytics; it is a display transformation, not a
 * replacement for the maths.
 *
 * **Why the message matters as much as the stars.** A star count alone does not
 * say why. The message carries the meaning, and is the natural place to grow
 * more specific over time (naming the weak macro, for instance) without ever
 * exposing a number.
 */

export type ScoreStars = 1 | 2 | 3 | 4 | 5;

/** E5. Where each rating is allowed to appear. */
export type ScoreLevel = "meal" | "daily" | "weekly";

/**
 * E1. Twenty-point buckets.
 *
 * Deliberately coarse. If the real distribution turns out to cluster in one
 * bucket the thresholds are the first thing to tune — they are policy, not law.
 */
export const scoreToStars = (score: number): ScoreStars => {
  if (!Number.isFinite(score)) return 1;
  if (score <= 20) return 1;
  if (score <= 40) return 2;
  if (score <= 60) return 3;
  if (score <= 80) return 4;
  return 5;
};

/** E2. Daily messages. The primary surface, so these carry the most weight. */
const DAILY_MESSAGES: Record<ScoreStars, string> = {
  1: "Today was tough — try to add more protein and balance tomorrow.",
  2: "A bit off balance today. Small tweaks tomorrow can help.",
  3: "Decent day — a little more balance would take this further.",
  4: "Solid day! You're close to your targets.",
  5: "Great job — today was well balanced across the board.",
};

/** E3. Weekly messages. */
const WEEKLY_MESSAGES: Record<ScoreStars, string> = {
  1: "This week was a rough stretch. Let's reset — small changes add up.",
  2: "Below your usual balance this week. One better day at a time.",
  3: "A fairly balanced week overall — keep building on it.",
  4: "Strong week! You're consistently close to your targets.",
  5: "Excellent week — great consistency across the days.",
};

/**
 * E4. Per-meal messages, deliberately lighter in touch.
 *
 * A single meal should not feel as final as a day or a week. This is
 * supplementary detail for someone who tapped in, not the signal they are meant
 * to act on.
 */
const MEAL_MESSAGES: Record<ScoreStars, string> = {
  1: "Low in balance — mostly one macro dominating.",
  2: "A bit skewed — could use more balance.",
  3: "Reasonably balanced meal.",
  4: "Nicely balanced meal.",
  5: "Great balance across carbs, fat, and protein.",
};

const MESSAGES: Record<ScoreLevel, Record<ScoreStars, string>> = {
  meal: MEAL_MESSAGES,
  daily: DAILY_MESSAGES,
  weekly: WEEKLY_MESSAGES,
};

export type ScoreRating = {
  stars: ScoreStars;
  message: string;
  level: ScoreLevel;
  /** True while a day is still in progress, so copy can frame it as in-progress. */
  provisional: boolean;
};

/**
 * Converts an internal score into the only thing a user sees.
 *
 * The numeric input is intentionally not carried on the result: nothing
 * downstream should be able to render it by accident.
 */
export const toScoreRating = (
  score: number,
  level: ScoreLevel,
  options: { provisional?: boolean } = {},
): ScoreRating => {
  const stars = scoreToStars(score);
  return {
    stars,
    message: MESSAGES[level][stars],
    level,
    provisional: options.provisional ?? false,
  };
};

/** E5. Per-meal ratings are reachable only by opening a specific meal. */
export const isPrimarySurface = (level: ScoreLevel): boolean => level !== "meal";
