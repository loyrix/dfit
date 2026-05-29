import type { FastifyInstance } from "fastify";
import {
  createMealRequestSchema,
  journalRangeQuerySchema,
  updateMealRequestSchema,
} from "@logmyplate/contracts";
import type { AppRepository } from "../repositories/app-repository.js";
import {
  buildJournalRange,
  buildJournalWeeks,
  buildTodayJournal,
  toApiMeal,
} from "./journal-presenter.js";
import { createRouteTimer } from "./route-timing.js";
import type { MealImageStorage } from "../services/meal-image-storage.js";
import type { CreateMealInput } from "../repositories/app-repository.js";

type MealItemInput = CreateMealInput["items"][number];

const normalizeMealItems = async (
  repository: AppRepository,
  items: MealItemInput[],
): Promise<MealItemInput[]> => {
  return Promise.all(
    items.map(async (item) => {
      if (!item.foodId) return item;
      const food = await repository.getFood(item.foodId);
      return food ? item : { ...item, foodId: undefined };
    }),
  );
};

export const registerJournalRoutes = async (
  app: FastifyInstance,
  repository: AppRepository,
  mealImageStorage: MealImageStorage,
): Promise<void> => {
  app.get("/v1/journal/today", async () => {
    const profile = await repository.getProfile();
    return buildTodayJournal(repository, profile, mealImageStorage);
  });

  app.get("/v1/journal/range", async (request, reply) => {
    const parsed = journalRangeQuerySchema.safeParse(request.query ?? {});
    if (!parsed.success) {
      return reply.status(400).send({
        error: "invalid_journal_range",
        issues: parsed.error.issues,
      });
    }

    const profile = await repository.getProfile();
    return buildJournalRange(
      repository,
      profile,
      parsed.data.days,
      mealImageStorage,
      parsed.data.weekOffset,
    );
  });

  app.get("/v1/journal/weeks", async () => {
    return buildJournalWeeks(repository);
  });

  app.post("/v1/meals", async (request, reply) => {
    const timer = createRouteTimer();
    const parsed = createMealRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: "invalid_meal",
        issues: parsed.error.issues,
      });
    }

    const items = await timer.measure("normalizeItems", () =>
      normalizeMealItems(
        repository,
        parsed.data.items.map((item) => ({
          foodId: item.foodId,
          displayName: item.displayName,
          portion: {
            quantity: item.quantity,
            unit: item.unit,
            grams: item.grams,
          },
          nutrition: item.nutrition,
        })),
      ),
    );

    const meal = await timer.measure("dbCreateMeal", () =>
      repository.createMeal({
        mealType: parsed.data.mealType,
        title: parsed.data.title,
        loggedAt: parsed.data.loggedAt,
        items,
      }),
    );

    const profile = await timer.measure("profile", () => repository.getProfile());
    const response = await timer.measure("hydrateMeal", () =>
      toApiMeal(profile.id, meal, mealImageStorage),
    );
    request.log.info(
      {
        route: "/v1/meals",
        mealId: meal.mealId,
        itemCount: items.length,
        timings: timer.snapshot(),
      },
      "meal create timings",
    );
    return reply.status(201).send(response);
  });

  app.get("/v1/meals/:id", async (request, reply) => {
    const params = request.params as { id: string };
    const meal = await repository.getMeal(params.id);
    if (!meal) return reply.status(404).send({ error: "meal_not_found" });
    const profile = await repository.getProfile();
    return toApiMeal(profile.id, meal, mealImageStorage);
  });

  app.patch("/v1/meals/:id", async (request, reply) => {
    const timer = createRouteTimer();
    const params = request.params as { id: string };
    const parsed = updateMealRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: "invalid_meal_update",
        issues: parsed.error.issues,
      });
    }

    const items = await timer.measure("normalizeItems", () =>
      normalizeMealItems(
        repository,
        parsed.data.items.map((item) => ({
          foodId: item.foodId,
          displayName: item.displayName,
          portion: {
            quantity: item.quantity,
            unit: item.unit,
            grams: item.grams,
          },
          nutrition: item.nutrition,
        })),
      ),
    );

    const meal = await timer.measure("dbUpdateMeal", () =>
      repository.updateMeal(params.id, {
        mealType: parsed.data.mealType,
        title: parsed.data.title,
        items,
      }),
    );
    if (!meal) return reply.status(404).send({ error: "meal_not_found" });

    const profile = await timer.measure("profile", () => repository.getProfile());
    const response = await timer.measure("hydrateMeal", () =>
      toApiMeal(profile.id, meal, mealImageStorage),
    );
    request.log.info(
      {
        route: "/v1/meals/:id",
        mealId: meal.mealId,
        itemCount: items.length,
        timings: timer.snapshot(),
      },
      "meal update timings",
    );
    return response;
  });

  app.delete("/v1/meals/:id", async (request, reply) => {
    const params = request.params as { id: string };
    const deletionPlan = await repository.getMealDeletionPlan(params.id);
    if (!deletionPlan) return reply.status(404).send({ error: "meal_not_found" });

    if (deletionPlan.storedObjects.length > 0) {
      if (!mealImageStorage.enabled) {
        return reply.status(503).send({
          error: "meal_image_delete_unavailable",
          message: "Meal image storage is not configured.",
        });
      }

      try {
        for (const target of deletionPlan.storedObjects) {
          await mealImageStorage.deleteStoredObject(target);
        }
      } catch (error) {
        request.log.error({ err: error, mealId: params.id }, "meal image delete failed");
        return reply.status(502).send({
          error: "meal_image_delete_failed",
          message: "Could not delete the stored meal image.",
        });
      }
    }

    const deleted = await repository.deleteMeal(params.id);
    if (!deleted) return reply.status(404).send({ error: "meal_not_found" });

    return reply.status(204).send();
  });
};
