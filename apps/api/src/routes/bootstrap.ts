import type { FastifyInstance } from "fastify";
import type { SqlClient } from "../db/client.js";
import type { AppRepository } from "../repositories/app-repository.js";
import type { MealImageStorage } from "../services/meal-image-storage.js";
import {
  loadAppUpdatePolicyConfig,
  readClientAppBuild,
  resolveAppUpdatePolicy,
} from "../services/app-update-policy.js";
import { loadEngagementPolicy } from "../services/engagement-policy.js";
import { buildStreakSummary } from "../services/streak-summary.js";
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
    const engagementPolicy = await timer.measure("engagementPolicy", () =>
      loadEngagementPolicy(sql),
    );
    const [quota, subscription, rawRewardedAdProgress, healthTarget] = await Promise.all([
      timer.measure("quota", () => repository.getQuota()),
      timer.measure("subscription", () => repository.getSubscriptionStatus()),
      timer.measure("rewardedAdProgress", () =>
        repository.getRewardedAdProgress(engagementPolicy.rewardedAds.dailyScanLimit),
      ),
      timer.measure("healthTarget", () => repository.getHealthTarget(profile.id)),
    ]);
    const rewardedAdProgress = engagementPolicy.rewardedAds.enabled
      ? rawRewardedAdProgress
      : {
          ...rawRewardedAdProgress,
          adsNeededForNextScan: 0,
          scansGrantedToday: rawRewardedAdProgress.dailyScanLimit,
        };
    const [today, weeklySummary, streakSummary] = await Promise.all([
      timer.measure("today", () =>
        buildTodayJournal(repository, profile, mealImageStorage, healthTarget ?? null),
      ),
      timer.measure("weeklySummary", () =>
        buildJournalSummary(repository, profile, 7, 0, healthTarget ?? null),
      ),
      timer.measure("streakSummary", () =>
        buildStreakSummary(repository, profile, engagementPolicy),
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
      engagementPolicy,
      quota,
      subscription,
      rewardedAdProgress,
      today,
      weeklySummary,
      streakSummary,
    };
  });
};
