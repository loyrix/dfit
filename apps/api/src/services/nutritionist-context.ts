import type { MealSummary, MealItemNutrition } from "@logmyplate/domain";
import type {
  AppRepository,
  ProfileHealthTarget,
  DailyMealAggregate,
} from "../repositories/app-repository.js";

export type NutritionistContext = {
  profile: {
    ageYears?: number;
    sex?: string;
    heightCm?: number;
    weightKg?: number;
    bmi?: number;
    bmiCategory?: string;
    activityLevel?: string;
    goal?: string;
    dailyCalorieTarget?: number;
    bmrCalories?: number;
  };
  today: {
    date: string;
    mealsLogged: number;
    totals: { calories: number; proteinG: number; carbsG: number; fatG: number };
    remaining?: { calories: number; proteinG: number; carbsG: number; fatG: number };
    meals: Array<{
      type: string;
      title: string;
      loggedAt: string;
      items: Array<{
        name: string;
        quantity: number;
        unit: string;
        calories: number;
        proteinG: number;
      }>;
      totals: { calories: number; proteinG: number; carbsG: number; fatG: number };
    }>;
  };
  weekSummary: {
    activeDays: number;
    mealCount: number;
    trackedDayAverage: { calories: number; proteinG: number; carbsG: number; fatG: number };
    dailyBreakdown: Array<{
      date: string;
      mealCount: number;
      totals: { calories: number; proteinG: number; carbsG: number; fatG: number };
    }>;
  };
  streak: {
    currentDays: number;
    longestDays: number;
  };
};

const toMacroNumbers = (totals: {
  calories?: number;
  proteinG?: number;
  carbsG?: number;
  fatG?: number;
}) => ({
  calories: totals.calories ?? 0,
  proteinG: totals.proteinG ?? 0,
  carbsG: totals.carbsG ?? 0,
  fatG: totals.fatG ?? 0,
});

const formatDateInZone = (date: Date, timezone: string): string => {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(date);
};

const formatToday = (timezone: string): string => formatDateInZone(new Date(), timezone);

const formatDaysAgo = (days: number, timezone: string): string => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return formatDateInZone(date, timezone);
};

const mealItemToSummary = (item: MealItemNutrition) => ({
  name: item.displayName,
  quantity: item.portion.quantity,
  unit: item.portion.unit,
  calories: item.nutrition.calories ?? 0,
  proteinG: item.nutrition.proteinG ?? 0,
});

const mealToSummary = (meal: MealSummary) => ({
  type: meal.mealType,
  title: meal.title,
  loggedAt: meal.loggedAt,
  items: (meal.items ?? []).map(mealItemToSummary),
  totals: toMacroNumbers(meal.totals ?? {}),
});

const sumMacros = (meals: MealSummary[]) =>
  meals.reduce(
    (acc, meal) => ({
      calories: acc.calories + (meal.totals?.calories ?? 0),
      proteinG: acc.proteinG + (meal.totals?.proteinG ?? 0),
      carbsG: acc.carbsG + (meal.totals?.carbsG ?? 0),
      fatG: acc.fatG + (meal.totals?.fatG ?? 0),
    }),
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
  );

const sumDayAggregates = (days: DailyMealAggregate[]) =>
  days
    .filter((d) => d.mealCount > 0)
    .reduce(
      (acc, d) => ({
        calories: acc.calories + (d.totals?.calories ?? 0),
        proteinG: acc.proteinG + (d.totals?.proteinG ?? 0),
        carbsG: acc.carbsG + (d.totals?.carbsG ?? 0),
        fatG: acc.fatG + (d.totals?.fatG ?? 0),
      }),
      { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
    );

const dayAggregateToSummary = (d: DailyMealAggregate) => ({
  date: d.date,
  mealCount: d.mealCount,
  totals: toMacroNumbers(d.totals ?? {}),
});

const buildProfile = (healthTarget: ProfileHealthTarget | undefined) => ({
  ageYears: healthTarget?.ageYears,
  sex: healthTarget?.sex,
  heightCm: healthTarget?.heightCm,
  weightKg: healthTarget?.weightKg,
  bmi: healthTarget?.bmi,
  bmiCategory: healthTarget?.bmiCategory,
  activityLevel: healthTarget?.activityLevel,
  goal: healthTarget?.goal,
  dailyCalorieTarget: healthTarget?.dailyCalorieTarget,
  bmrCalories: healthTarget?.bmrCalories,
});

const EMPTY_WEEK: NutritionistContext["weekSummary"] = {
  activeDays: 0,
  mealCount: 0,
  trackedDayAverage: { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
  dailyBreakdown: [],
};

export const assembleNutritionistContext = async (
  repository: AppRepository,
  healthTarget: ProfileHealthTarget | undefined,
  timezone: string,
  focusMealId?: string,
): Promise<NutritionistContext> => {
  const today = formatToday(timezone);

  const sevenDaysAgo = formatDaysAgo(7, timezone);

  const [todayMeals, weekSummary] = await Promise.all([
    repository.listMeals({ fromDate: today, toDate: today }),
    repository.summarizeMealsByDate({ fromDate: sevenDaysAgo, toDate: today }),
  ]);

  if (focusMealId) {
    const meal = await repository.getMeal(focusMealId);
    if (meal) {
      const summary = mealToSummary(meal);
      const activeDays = weekSummary.filter((d) => d.mealCount > 0).length;
      const totalMealCount = weekSummary.reduce((acc, d) => acc + d.mealCount, 0);
      const trackedDayTotals = sumDayAggregates(weekSummary);
      const trackedDayAverage =
        activeDays > 0
          ? {
              calories: Math.round(trackedDayTotals.calories / activeDays),
              proteinG: Math.round(trackedDayTotals.proteinG / activeDays),
              carbsG: Math.round(trackedDayTotals.carbsG / activeDays),
              fatG: Math.round(trackedDayTotals.fatG / activeDays),
            }
          : { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 };

      return {
        profile: buildProfile(healthTarget),
        today: {
          date: today,
          mealsLogged: 1,
          totals: summary.totals,
          meals: [summary],
        },
        weekSummary: {
          activeDays,
          mealCount: totalMealCount,
          trackedDayAverage,
          dailyBreakdown: weekSummary.map(dayAggregateToSummary),
        },
        streak: { currentDays: 0, longestDays: 0 },
      };
    }
  }

  const todayTotals = sumMacros(todayMeals);
  const target = healthTarget
    ? { calories: healthTarget.dailyCalorieTarget ?? 0, proteinG: 0, carbsG: 0, fatG: 0 }
    : undefined;

  const remaining = target
    ? {
        calories: Math.max(0, target.calories - todayTotals.calories),
        proteinG: Math.max(0, target.proteinG - todayTotals.proteinG),
        carbsG: Math.max(0, target.carbsG - todayTotals.carbsG),
        fatG: Math.max(0, target.fatG - todayTotals.fatG),
      }
    : undefined;

  const activeDays = weekSummary.filter((d) => d.mealCount > 0).length;
  const totalMealCount = weekSummary.reduce((acc, d) => acc + d.mealCount, 0);

  const trackedDayTotals = sumDayAggregates(weekSummary);
  const trackedDayAverage =
    activeDays > 0
      ? {
          calories: Math.round(trackedDayTotals.calories / activeDays),
          proteinG: Math.round(trackedDayTotals.proteinG / activeDays),
          carbsG: Math.round(trackedDayTotals.carbsG / activeDays),
          fatG: Math.round(trackedDayTotals.fatG / activeDays),
        }
      : { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 };

  return {
    profile: buildProfile(healthTarget),
    today: {
      date: today,
      mealsLogged: todayMeals.length,
      totals: todayTotals,
      remaining,
      meals: todayMeals.map(mealToSummary),
    },
    weekSummary: {
      activeDays,
      mealCount: totalMealCount,
      trackedDayAverage,
      dailyBreakdown: weekSummary.map(dayAggregateToSummary),
    },
    streak: {
      currentDays: 0,
      longestDays: 0,
    },
  };
};
