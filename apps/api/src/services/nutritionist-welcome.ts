import type { NutritionistContext } from "./nutritionist-context.js";

/**
 * Builds the opening message of a nutritionist session from the context we
 * already hold, without calling the model.
 *
 * The greeting used to be generated — a full system prompt plus context sent to
 * Gemini to produce sixty words summarising data the server had in structured
 * form. It accounted for 37% of all chat AI calls, and 44% of those sessions
 * never received a reply, so most of that spend bought a greeting nobody read.
 *
 * Everything the generated version said is derivable here, and this follows the
 * same pattern already used for suggested prompts. Plain text only, matching the
 * formatting rules the system prompt puts on the model.
 */
export const buildNutritionistWelcome = (context: NutritionistContext): string => {
  const lines: string[] = [greetingLine(context), statusLine(context)];

  const streak = streakLine(context);
  if (streak) lines.push(streak);

  lines.push("What would you like to look at?");

  return lines.join("\n\n");
};

const greetingLine = (context: NutritionistContext): string => {
  const goal = goalPhrase(context.profile.goal);
  return goal
    ? `Hello. I'm your AI Nutritionist, and I can see your logs from the last few days. Your goal is to ${goal}.`
    : "Hello. I'm your AI Nutritionist, and I can see your logs from the last few days.";
};

/**
 * What the user's day looks like so far. Ordered by how much the user is likely
 * to care: today's meals first, then the week, then nothing-logged-yet.
 */
const statusLine = (context: NutritionistContext): string => {
  const { mealsLogged, totals, remaining } = context.today;

  if (mealsLogged > 0) {
    const meals = mealsLogged === 1 ? "1 meal" : `${mealsLogged} meals`;
    const calories = Math.round(totals.calories);
    const base = `Today you have logged ${meals}, coming to about ${calories} calories and ${Math.round(totals.proteinG)}g of protein.`;

    const left = remaining?.calories;
    if (typeof left === "number" && left > 0) {
      return `${base} That leaves roughly ${Math.round(left)} calories for the rest of the day.`;
    }
    return base;
  }

  if (context.weekSummary.mealCount > 0) {
    const days = context.weekSummary.activeDays;
    const dayWord = days === 1 ? "day" : "days";
    return `Nothing logged today yet. Over the past week you tracked ${days} ${dayWord}, averaging about ${Math.round(context.weekSummary.trackedDayAverage.calories)} calories on the days you logged.`;
  }

  return "You have not logged any meals yet, so I cannot comment on your intake. Log a meal and I can be much more specific.";
};

const streakLine = (context: NutritionistContext): string | undefined => {
  const days = context.streak.currentDays;
  if (days < 2) return undefined;
  return `You are on a ${days}-day logging streak.`;
};

const GOAL_PHRASES: Record<string, string> = {
  maintain: "maintain your current weight",
  lose_gently: "lose weight gently",
  gain_gently: "gain weight gently",
};

const goalPhrase = (goal?: string): string | undefined => (goal ? GOAL_PHRASES[goal] : undefined);
