/**
 * Part D — weekly score.
 *
 * Implements `docs/meal-health-score-logic.md` Part D. Averages daily scores
 * rather than meal scores, so no single plate and no single rough day defines
 * the headline the user sees.
 */

export type WeeklyScorePolicy = {
  /** D2. A day at or above this counts toward the consistency bonus. */
  goodDayThreshold: number;
  /** D2. Points added per good day, and the ceiling on that bonus. */
  consistencyPerDay: number;
  consistencyCap: number;
};

export const defaultWeeklyScorePolicy: WeeklyScorePolicy = {
  goodDayThreshold: 61,
  consistencyPerDay: 1,
  consistencyCap: 5,
};

export type WeeklyScoreDay = {
  date: string;
  /** Undefined for a day with no meals logged. */
  dailyScore?: number;
};

export type WeeklyScoreBreakdown = {
  /** 0–100, internal only. Users see stars (Part E). */
  score: number;
  /** Mean of the scored days, before the consistency bonus. */
  average: number;
  /** Days with at least one logged meal. */
  scoredDays: number;
  /** Days in the window with nothing logged. Excluded, not scored zero. */
  untrackedDays: number;
  goodDays: number;
  consistencyBonus: number;
};

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

const round1 = (value: number): number => Math.round((value + Number.EPSILON) * 10) / 10;

/**
 * Scores a week from its daily scores.
 *
 * Returns undefined when no day in the window has a score, so the caller shows
 * an empty state.
 *
 * **Untracked days are excluded, not scored zero.** A day with no meals logged
 * is not evidence of poor eating, and scoring it zero would punish a gap in
 * logging as though it were a gap in diet.
 */
export const calculateWeeklyScore = (
  days: WeeklyScoreDay[],
  policy: WeeklyScorePolicy = defaultWeeklyScorePolicy,
): WeeklyScoreBreakdown | undefined => {
  const scored = days
    .map((day) => day.dailyScore)
    .filter((score): score is number => score !== undefined && Number.isFinite(score));

  if (scored.length === 0) return undefined;

  // D1
  const average = scored.reduce((sum, score) => sum + score, 0) / scored.length;

  // D2. A plain average cannot tell "consistently decent" from "three great days
  // and four poor ones" when they land on the same mean, so steadiness earns a
  // small bonus of its own.
  const goodDays = scored.filter((score) => score >= policy.goodDayThreshold).length;
  const consistencyBonus = Math.min(policy.consistencyCap, goodDays * policy.consistencyPerDay);

  return {
    score: Math.round(clamp(average + consistencyBonus, 0, 100)),
    average: round1(average),
    scoredDays: scored.length,
    untrackedDays: days.length - scored.length,
    goodDays,
    consistencyBonus,
  };
};
