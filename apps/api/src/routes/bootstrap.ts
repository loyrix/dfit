import type { FastifyInstance } from "fastify";
import type { SqlClient } from "../db/client.js";
import type { AppRepository } from "../repositories/app-repository.js";
import type { MealImageStorage } from "../services/meal-image-storage.js";
import {
  loadAppUpdatePolicyConfig,
  readClientAppBuild,
  resolveAppUpdatePolicy,
} from "../services/app-update-policy.js";
import { buildJournalSummary, buildTodayJournal } from "./journal-presenter.js";
import { createRouteTimer } from "./route-timing.js";

export const registerBootstrapRoutes = async (
  app: FastifyInstance,
  repository: AppRepository,
  mealImageStorage: MealImageStorage,
  sql?: SqlClient,
): Promise<void> => {
  app.get("/v1/app/bootstrap", async (request) => {
    const timer = createRouteTimer();
    const profile = await timer.measure("profile", () => repository.getProfile());
    const updatePolicyConfig = await timer.measure("updatePolicy", () =>
      loadAppUpdatePolicyConfig(sql),
    );
    const [quota, rewardedAdProgress, healthTarget] = await Promise.all([
      timer.measure("quota", () => repository.getQuota()),
      timer.measure("rewardedAdProgress", () => repository.getRewardedAdProgress()),
      timer.measure("healthTarget", () => repository.getHealthTarget(profile.id)),
    ]);
    const [today, weeklySummary] = await Promise.all([
      timer.measure("today", () =>
        buildTodayJournal(repository, profile, mealImageStorage, healthTarget ?? null),
      ),
      timer.measure("weeklySummary", () =>
        buildJournalSummary(repository, profile, 7, 0, healthTarget ?? null),
      ),
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
      healthTarget,
      updatePolicy: resolveAppUpdatePolicy(updatePolicyConfig, readClientAppBuild(request)),
      quota,
      rewardedAdProgress,
      today,
      weeklySummary,
    };
  });
};
