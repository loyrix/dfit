import { sumTotals } from "@dfit/domain";
import type { AppRepository, Profile } from "../repositories/app-repository.js";

type RouteMeal =
  Awaited<ReturnType<AppRepository["getMeal"]>> extends infer T ? NonNullable<T> : never;

export const toApiMeal = (profileId: string, meal: RouteMeal) => ({
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
});

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

export const buildTodayJournal = async (repository: AppRepository, profile: Profile) => {
  const today = toDateString(new Date());
  const meals = await repository.listMeals({ fromDate: today, toDate: today });

  return {
    date: today,
    timezone: profile.timezone,
    totals: sumTotals(meals.map((meal) => meal.totals)),
    meals: meals.map((meal) => toApiMeal(profile.id, meal)),
  };
};

export const buildJournalRange = async (
  repository: AppRepository,
  profile: Profile,
  daysCount: number,
  weekOffset = 0,
) => {
  const endDate = addDays(new Date(), -(weekOffset * 7));
  const dates = dateWindow(daysCount, endDate);
  const meals = await repository.listMeals({
    fromDate: dates[0],
    toDate: dates[dates.length - 1],
    limit: daysCount * 20,
  });
  const mealsByDate = new Map<string, RouteMeal[]>();
  for (const meal of meals) {
    const day = meal.loggedAt.slice(0, 10);
    mealsByDate.set(day, [...(mealsByDate.get(day) ?? []), meal]);
  }

  const days = dates.map((date) => {
    const dayMeals = mealsByDate.get(date) ?? [];
    return {
      date,
      mealCount: dayMeals.length,
      totals: sumTotals(dayMeals.map((meal) => meal.totals)),
      meals: dayMeals.map((meal) => toApiMeal(profile.id, meal)),
    };
  });
  const totals = sumTotals(days.map((day) => day.totals));
  const activeDays = days.filter((day) => day.mealCount > 0).length;

  return {
    startDate: dates[0],
    endDate: dates[dates.length - 1],
    timezone: profile.timezone,
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

export const buildJournalWeeks = async (
  repository: AppRepository,
  daysCount = 7,
) => {
  const today = dateOnly(new Date());
  const mealDates = await repository.listMealDates();
  const mealDateSet = new Set(mealDates);
  const offsets = new Set<number>([0]);

  for (const mealDate of mealDates) {
    const parsed = new Date(`${mealDate}T00:00:00.000Z`);
    if (Number.isNaN(parsed.getTime()) || parsed > today) continue;
    const daysAgo = Math.floor(
      (today.getTime() - parsed.getTime()) / (24 * 60 * 60 * 1000),
    );
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
    });

  return { weeks };
};
