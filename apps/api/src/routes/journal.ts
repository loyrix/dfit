import type { FastifyInstance } from "fastify";
import { sumTotals } from "@dfit/domain";
import { createMealRequestSchema } from "@dfit/contracts";
import type { AppRepository } from "../repositories/app-repository.js";

type RouteMeal =
  Awaited<ReturnType<AppRepository["getMeal"]>> extends infer T ? NonNullable<T> : never;

const toApiMeal = (profileId: string, meal: RouteMeal) => ({
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

export const registerJournalRoutes = async (
  app: FastifyInstance,
  repository: AppRepository,
): Promise<void> => {
  app.get("/v1/journal/today", async () => {
    const profile = await repository.getProfile();
    const meals = await repository.listMeals();
    return {
      date: new Date().toISOString().slice(0, 10),
      timezone: profile.timezone,
      totals: sumTotals(meals.map((meal) => meal.totals)),
      target: {
        calories: 1900,
        proteinG: 120,
        carbsG: 220,
        fatG: 65,
      },
      meals: meals.map((meal) => toApiMeal(profile.id, meal)),
    };
  });

  app.post("/v1/meals", async (request, reply) => {
    const parsed = createMealRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: "invalid_meal",
        issues: parsed.error.issues,
      });
    }

    const meal = await repository.createMeal({
      mealType: parsed.data.mealType,
      title: parsed.data.title,
      loggedAt: parsed.data.loggedAt,
      items: parsed.data.items.map((item) => ({
        displayName: item.displayName,
        portion: {
          quantity: item.quantity,
          unit: item.unit,
          grams: item.grams,
        },
        nutrition: item.nutrition,
      })),
    });

    const profile = await repository.getProfile();
    return reply.status(201).send(toApiMeal(profile.id, meal));
  });

  app.get("/v1/meals/:id", async (request, reply) => {
    const params = request.params as { id: string };
    const meal = await repository.getMeal(params.id);
    if (!meal) return reply.status(404).send({ error: "meal_not_found" });
    const profile = await repository.getProfile();
    return toApiMeal(profile.id, meal);
  });
};
