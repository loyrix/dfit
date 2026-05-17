import type { FastifyInstance } from "fastify";
import { createMealRequestSchema, journalRangeQuerySchema } from "@dfit/contracts";
import type { AppRepository } from "../repositories/app-repository.js";
import {
  buildJournalRange,
  buildJournalWeeks,
  buildTodayJournal,
  toApiMeal,
} from "./journal-presenter.js";

export const registerJournalRoutes = async (
  app: FastifyInstance,
  repository: AppRepository,
): Promise<void> => {
  app.get("/v1/journal/today", async () => {
    const profile = await repository.getProfile();
    return buildTodayJournal(repository, profile);
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
      parsed.data.weekOffset,
    );
  });

  app.get("/v1/journal/weeks", async () => {
    return buildJournalWeeks(repository);
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
