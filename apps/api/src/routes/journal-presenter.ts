import { calculatePlateScore, sumTotals, type PlateScoreProfile } from "@logmyplate/domain";
import type {
  AppRepository,
  Profile,
  ProfileHealthTarget,
} from "../repositories/app-repository.js";
import type { MealImageStorage } from "../services/meal-image-storage.js";

type RouteMeal =
  Awaited<ReturnType<AppRepository["getMeal"]>> extends infer T ? NonNullable<T> : never;

/**
 * Turns a stored health target into the little the score actually needs.
 * Returns undefined for users without one, which selects the general tier
 * rather than scoring them against an invented profile.
 */
export const toPlateScoreProfile = (
  healthTarget: ProfileHealthTarget | null | undefined,
): PlateScoreProfile | undefined =>
  healthTarget?.dailyCalorieTarget
    ? { dailyCalorieTarget: healthTarget.dailyCalorieTarget, goal: healthTarget.goal }
    : undefined;

/**
 * `healthTarget` is a required parameter rather than an optional one so that
 * every call site has to decide. Defaulting it would silently downgrade users
 * who do have a target to the general tier.
 */
export const toApiMeal = async (
  profileId: string,
  meal: RouteMeal,
  mealImageStorage: MealImageStorage,
  healthTarget: ProfileHealthTarget | null | undefined,
) => {
  const imageUrl = meal.image ? await mealImageStorage.createSignedReadUrl(meal.image) : undefined;

  // Scored from per-item nutrition, never meal.totals: sumTotals coerces absent
  // micronutrients to 0, which would make every meal look fiber-free.
  const plateScore = calculatePlateScore({
    items: meal.items.map((item) => item.nutrition),
    mealType: meal.mealType,
    profile: toPlateScoreProfile(healthTarget),
  });

  return {
    plateScore,
    id: meal.mealId,
    profileId,
    mealType: meal.mealType,
    title: meal.title,
    loggedAt: meal.loggedAt,
    items: meal.items.map((item) => ({
      id: `${meal.mealId}_${item.displayName}`,
      foodId: item.foodId,
      displayName: item.displayName,
      quantity: item.portion.quantity,
      unit: item.portion.unit,
      grams: item.portion.grams,
      nutrition: item.nutrition,
      userEdited: false,
    })),
    totals: meal.totals,
    image:
      meal.image && imageUrl
        ? {
            url: imageUrl,
            mimeType: meal.image.mimeType,
            byteSize: meal.image.byteSize,
            width: meal.image.width,
            height: meal.image.height,
          }
        : undefined,
  };
};

const round = (value: number, decimals = 1): number => {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
};

const addDays = (date: Date, days: number): Date => {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
};

export const toDateString = (date: Date): string => date.toISOString().slice(0, 10);

const dateOnly = (date: Date): Date => {
  return new Date(`${toDateString(date)}T00:00:00.000Z`);
};

const dateWindow = (days: number, end: Date): string[] => {
  return Array.from({ length: days }, (_, index) => {
    const offset = index - (days - 1);
    return toDateString(addDays(end, offset));
  });
};

const dailyAverage = (totals: ReturnType<typeof sumTotals>, days: number) => ({
  calories: Math.round(totals.calories / days),
  proteinG: round(totals.proteinG / days),
  carbsG: round(totals.carbsG / days),
  fatG: round(totals.fatG / days),
  fiberG: round((totals.fiberG ?? 0) / days),
  sugarG: round((totals.sugarG ?? 0) / days),
  sodiumMg: Math.round((totals.sodiumMg ?? 0) / days),
});

const dailyCalorieTarget = (healthTarget?: ProfileHealthTarget) =>
  healthTarget
    ? {
        calories: healthTarget.dailyCalorieTarget,
        proteinG: 0,
        carbsG: 0,
        fatG: 0,
      }
    : undefined;

/**
 * `undefined` means "not supplied, go and load it"; `null` means "this user has
 * none". Callers must resolve once and reuse the result, because both the
 * calorie target and the Plate Score need the same answer — passing the raw
 * optional through would silently score a user who has a target as if they did
 * not.
 */
const resolveHealthTarget = async (
  repository: AppRepository,
  profileId: string,
  healthTarget?: ProfileHealthTarget | null,
): Promise<ProfileHealthTarget | null> =>
  healthTarget === undefined
    ? ((await repository.getHealthTarget(profileId)) ?? null)
    : healthTarget;

const resolveDailyCalorieTarget = async (
  repository: AppRepository,
  profileId: string,
  healthTarget?: ProfileHealthTarget | null,
) => {
  const resolved = await resolveHealthTarget(repository, profileId, healthTarget);
  return dailyCalorieTarget(resolved ?? undefined);
};

export const buildTodayJournal = async (
  repository: AppRepository,
  profile: Profile,
  mealImageStorage: MealImageStorage,
  healthTarget?: ProfileHealthTarget | null,
) => {
  const today = toDateString(new Date());
  const [meals, resolvedTarget] = await Promise.all([
    repository.listMeals({ fromDate: today, toDate: today }),
    resolveHealthTarget(repository, profile.id, healthTarget),
  ]);

  return {
    date: today,
    timezone: profile.timezone,
    totals: sumTotals(meals.map((meal) => meal.totals)),
    target: dailyCalorieTarget(resolvedTarget ?? undefined),
    meals: await Promise.all(
      meals.map((meal) => toApiMeal(profile.id, meal, mealImageStorage, resolvedTarget)),
    ),
  };
};

export const buildJournalRange = async (
  repository: AppRepository,
  profile: Profile,
  daysCount: number,
  mealImageStorage: MealImageStorage,
  weekOffset = 0,
  healthTarget?: ProfileHealthTarget | null,
) => {
  const endDate = addDays(new Date(), -(weekOffset * 7));
  const dates = dateWindow(daysCount, endDate);
  const [meals, resolvedTarget] = await Promise.all([
    repository.listMeals({
      fromDate: dates[0],
      toDate: dates[dates.length - 1],
      limit: daysCount * 20,
    }),
    resolveHealthTarget(repository, profile.id, healthTarget),
  ]);
  const mealsByDate = new Map<string, RouteMeal[]>();
  for (const meal of meals) {
    const day = meal.loggedAt.slice(0, 10);
    mealsByDate.set(day, [...(mealsByDate.get(day) ?? []), meal]);
  }

  const days = await Promise.all(
    dates.map(async (date) => {
      const dayMeals = mealsByDate.get(date) ?? [];
      return {
        date,
        mealCount: dayMeals.length,
        totals: sumTotals(dayMeals.map((meal) => meal.totals)),
        meals: await Promise.all(
          dayMeals.map((meal) => toApiMeal(profile.id, meal, mealImageStorage, resolvedTarget)),
        ),
      };
    }),
  );
  const totals = sumTotals(days.map((day) => day.totals));
  const activeDays = days.filter((day) => day.mealCount > 0).length;

  return {
    startDate: dates[0],
    endDate: dates[dates.length - 1],
    timezone: profile.timezone,
    target: dailyCalorieTarget(resolvedTarget ?? undefined),
    days,
    summary: {
      windowDays: daysCount,
      activeDays,
      mealCount: meals.length,
      totals,
      trackedDayAverage: dailyAverage(totals, activeDays || 1),
      calendarDayAverage: dailyAverage(totals, daysCount),
    },
  };
};

export const buildJournalSummary = async (
  repository: AppRepository,
  profile: Profile,
  daysCount: number,
  weekOffset = 0,
  healthTarget?: ProfileHealthTarget | null,
) => {
  const endDate = addDays(new Date(), -(weekOffset * 7));
  const dates = dateWindow(daysCount, endDate);
  const aggregates = await repository.summarizeMealsByDate({
    fromDate: dates[0],
    toDate: dates[dates.length - 1],
  });
  const aggregatesByDate = new Map(aggregates.map((day) => [day.date, day]));

  const dayTotals = dates.map((date) => {
    const aggregate = aggregatesByDate.get(date);
    return {
      date,
      mealCount: aggregate?.mealCount ?? 0,
      totals: aggregate?.totals ?? sumTotals([]),
    };
  });
  const totals = sumTotals(dayTotals.map((day) => day.totals));
  const activeDays = dayTotals.filter((day) => day.mealCount > 0).length;

  return {
    startDate: dates[0],
    endDate: dates[dates.length - 1],
    timezone: profile.timezone,
    target: await resolveDailyCalorieTarget(repository, profile.id, healthTarget),
    summary: {
      windowDays: daysCount,
      activeDays,
      mealCount: aggregates.reduce((total, day) => total + day.mealCount, 0),
      totals,
      trackedDayAverage: dailyAverage(totals, activeDays || 1),
      calendarDayAverage: dailyAverage(totals, daysCount),
    },
  };
};

export const buildJournalWeeks = async (repository: AppRepository, daysCount = 7) => {
  const today = dateOnly(new Date());
  const mealDates = await repository.listMealDates();
  const mealDateSet = new Set(mealDates);
  const offsets = new Set<number>();

  for (const mealDate of mealDates) {
    const parsed = new Date(`${mealDate}T00:00:00.000Z`);
    if (Number.isNaN(parsed.getTime()) || parsed > today) continue;
    const daysAgo = Math.floor((today.getTime() - parsed.getTime()) / (24 * 60 * 60 * 1000));
    offsets.add(Math.floor(daysAgo / daysCount));
  }

  const weeks = [...offsets]
    .sort((a, b) => a - b)
    .map((weekOffset) => {
      const endDate = addDays(today, -(weekOffset * daysCount));
      const dates = dateWindow(daysCount, endDate);
      return {
        weekOffset,
        startDate: dates[0],
        endDate: dates[dates.length - 1],
        activeDays: dates.filter((date) => mealDateSet.has(date)).length,
      };
    })
    .filter((week) => week.activeDays > 0);

  return { weeks };
};
