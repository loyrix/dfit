import type { StreakSummaryContract } from "@logmyplate/contracts";
import type { AppRepository, Profile } from "../repositories/app-repository.js";
import type { EngagementPolicyConfig } from "./engagement-policy.js";

const dayMs = 24 * 60 * 60 * 1000;

export const buildStreakSummary = async (
  repository: AppRepository,
  profile: Profile,
  policy: EngagementPolicyConfig,
  now = new Date(),
): Promise<StreakSummaryContract> => {
  const uniqueMealDates = new Set(await repository.listMealDates());
  const sortedMealDates = [...uniqueMealDates].sort();
  const today = localDateForTimezone(now, profile.timezone);
  const todayLogged = uniqueMealDates.has(today);
  const currentStreakDays = countCurrentStreak(uniqueMealDates, today, todayLogged);
  const longestStreakDays = countLongestStreak(sortedMealDates);
  const milestones = [...policy.streaks.milestones].sort((left, right) => left.days - right.days);
  const nextMilestone = milestones.find((milestone) => milestone.days > currentStreakDays) ?? null;
  const achievedMilestone =
    [...milestones].reverse().find((milestone) => milestone.days <= currentStreakDays) ?? null;

  return {
    enabled: policy.streaks.enabled,
    currentStreakDays,
    longestStreakDays,
    todayLogged,
    lastLoggedDate: sortedMealDates.at(-1) ?? null,
    nextMilestoneDays: nextMilestone?.days ?? null,
    daysUntilNextMilestone: nextMilestone ? Math.max(0, nextMilestone.days - currentStreakDays) : 0,
    nextRewardScans:
      policy.streaks.scanRewards.enabled && nextMilestone ? nextMilestone.scanRewardAmount : 0,
    achievedMilestoneDays: achievedMilestone?.days ?? null,
    achievedMilestoneTitle: achievedMilestone?.title ?? null,
    achievedMilestoneBody: achievedMilestone?.body ?? null,
  };
};

const countCurrentStreak = (
  mealDates: Set<string>,
  today: string,
  todayLogged: boolean,
): number => {
  let cursor = todayLogged ? today : addIsoDays(today, -1);
  let streak = 0;

  while (mealDates.has(cursor)) {
    streak += 1;
    cursor = addIsoDays(cursor, -1);
  }

  return streak;
};

const countLongestStreak = (mealDates: string[]): number => {
  let longest = 0;
  let current = 0;
  let previous: string | undefined;

  for (const mealDate of mealDates) {
    if (!previous || mealDate === addIsoDays(previous, 1)) {
      current += 1;
    } else {
      current = 1;
    }
    longest = Math.max(longest, current);
    previous = mealDate;
  }

  return longest;
};

const addIsoDays = (date: string, days: number): string => {
  const parsed = new Date(`${date}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) return date;
  return new Date(parsed.getTime() + days * dayMs).toISOString().slice(0, 10);
};

const localDateForTimezone = (date: Date, timezone: string): string => {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone || "UTC",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(date);
    const year = parts.find((part) => part.type === "year")?.value;
    const month = parts.find((part) => part.type === "month")?.value;
    const day = parts.find((part) => part.type === "day")?.value;
    if (year && month && day) return `${year}-${month}-${day}`;
  } catch {
    // Fall back to UTC when a legacy client sends an invalid timezone string.
  }
  return date.toISOString().slice(0, 10);
};
