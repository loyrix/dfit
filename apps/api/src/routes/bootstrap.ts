import type { FastifyInstance } from "fastify";
import type { AppRepository } from "../repositories/app-repository.js";
import type { MealImageStorage } from "../services/meal-image-storage.js";
import { buildJournalSummary, buildTodayJournal } from "./journal-presenter.js";
import { createRouteTimer } from "./route-timing.js";

export const registerBootstrapRoutes = async (
  app: FastifyInstance,
  repository: AppRepository,
  mealImageStorage: MealImageStorage,
): Promise<void> => {
  app.get("/v1/app/bootstrap", async (request) => {
    const timer = createRouteTimer();
    const profile = await timer.measure("profile", () => repository.getProfile());
    const [quota, today, weeklySummary] = await Promise.all([
      timer.measure("quota", () => repository.getQuota()),
      timer.measure("today", () => buildTodayJournal(repository, profile, mealImageStorage)),
      timer.measure("weeklySummary", () => buildJournalSummary(repository, profile, 7)),
    ]);

    request.log.info(
      {
        route: "/v1/app/bootstrap",
        timings: timer.snapshot(),
        todayMealCount: today.meals.length,
        weeklyMealCount: weeklySummary.summary.mealCount,
      },
      "app bootstrap timings",
    );

    return {
      serverTime: new Date().toISOString(),
      profile,
      quota,
      today,
      weeklySummary,
    };
  });
};
