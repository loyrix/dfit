import { describe, expect, it } from "vitest";
import { defaultEngagementPolicyConfig } from "@logmyplate/contracts";
import { InMemoryStore } from "../repositories/in-memory-store.js";
import { buildStreakSummary } from "./streak-summary.js";

const mealInput = (loggedAt: string) => ({
  mealType: "lunch" as const,
  title: "Dal rice",
  loggedAt,
  items: [
    {
      displayName: "Dal rice",
      portion: { quantity: 1, unit: "bowl" as const, grams: 240 },
      nutrition: { calories: 320, proteinG: 14, carbsG: 52, fatG: 7 },
    },
  ],
});

describe("streak summary", () => {
  it("counts an alive streak from yesterday until the user logs today", async () => {
    const repository = new InMemoryStore();
    const profile = await repository.getProfile();
    const policy = defaultEngagementPolicyConfig();
    policy.streaks.enabled = true;
    policy.streaks.scanRewards.enabled = true;
    policy.streaks.milestones = [
      {
        days: 3,
        title: "3-day streak",
        body: "You logged meals for 3 days.",
        scanRewardAmount: 1,
      },
      {
        days: 7,
        title: "7-day streak",
        body: "A full week of logging.",
        scanRewardAmount: 2,
      },
    ];

    await repository.createMeal(mealInput("2026-06-01T08:30:00.000Z"));
    await repository.createMeal(mealInput("2026-06-02T08:30:00.000Z"));
    await repository.createMeal(mealInput("2026-06-03T08:30:00.000Z"));
    await repository.createMeal(mealInput("2026-05-29T08:30:00.000Z"));

    const summary = await buildStreakSummary(
      repository,
      profile,
      policy,
      new Date("2026-06-04T04:00:00.000Z"),
    );

    expect(summary).toMatchObject({
      enabled: true,
      currentStreakDays: 3,
      longestStreakDays: 3,
      todayLogged: false,
      lastLoggedDate: "2026-06-03",
      nextMilestoneDays: 7,
      daysUntilNextMilestone: 4,
      nextRewardScans: 2,
      achievedMilestoneDays: 3,
      achievedMilestoneTitle: "3-day streak",
    });
  });
});
