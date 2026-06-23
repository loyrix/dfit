import type { NutritionistContext } from "./nutritionist-context.js";

export const generateSuggestedPrompts = (context: NutritionistContext): string[] => {
  const prompts: string[] = [];

  const hasSingleMeal = context.today.mealsLogged === 1;

  if (hasSingleMeal) {
    prompts.push("What's good and bad about this meal?");
    prompts.push("How can I make this meal healthier?");
  }

  if (context.today.mealsLogged > 0) {
    if (!prompts.includes("How can I make this meal healthier?")) {
      prompts.push("How can I make this meal healthier?");
    }
    prompts.push("What should I eat for dinner?");
  }

  const proteinG = context.today.totals.proteinG;
  if (context.today.mealsLogged > 0 && proteinG < 30) {
    prompts.push("How's my protein intake?");
  }

  if (prompts.length < 4) {
    const general = [
      "Suggest a high-protein Indian breakfast",
      "Am I eating enough fiber?",
      "What should I change this week?",
      "How can I improve my meal timing?",
    ];
    for (const p of general) {
      if (prompts.length >= 4) break;
      if (!prompts.includes(p)) prompts.push(p);
    }
  }

  return prompts.slice(0, 4);
};

export const generateFollowUpSuggestions = (
  _aiResponse: string,
  context: NutritionistContext,
): string[] => {
  const suggestions: string[] = [];

  if (context.today.mealsLogged === 1) {
    suggestions.push("Compare this meal to my daily target");
  }

  if (context.today.mealsLogged > 0) {
    const remainingCals = context.today.remaining?.calories ?? 0;
    if (remainingCals > 200) {
      suggestions.push("What should I eat to hit my remaining calories?");
    }
  }

  if (context.weekSummary.activeDays >= 3) {
    suggestions.push("How's my weekly balance looking?");
  }

  suggestions.push("Suggest healthier alternatives for my meals");

  return suggestions.slice(0, 3);
};
