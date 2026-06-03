import { defaultEngagementPolicyConfig } from "@logmyplate/contracts";
import { describe, expect, it } from "vitest";
import type { EngagementPolicyConfig } from "./engagement-policy.js";
import {
  isWithinTimeWindow,
  localReminderClock,
  selectDueReminder,
  type ReminderCandidate,
} from "./push-reminders.js";

const candidate = (overrides: Partial<ReminderCandidate> = {}): ReminderCandidate => ({
  profileId: "profile-1",
  timezone: "Asia/Kolkata",
  localDate: "2026-06-03",
  localTimeMinutes: 9 * 60,
  hasTarget: true,
  dailyCalorieTarget: 1800,
  todayCalories: 400,
  loggedMealTypes: new Set(),
  sentScenarioKeys: new Set(),
  sentTodayCount: 0,
  tokens: [
    {
      id: "token-1",
      token: "fcm-token",
      tokenHash: "token-hash",
    },
  ],
  ...overrides,
});

const policyWithBreakfast = (): EngagementPolicyConfig => {
  const policy = defaultEngagementPolicyConfig();
  policy.notifications.enabled = true;
  policy.notifications.scenarios.breakfast.enabled = true;
  policy.notifications.scenarios.breakfast.windowStart = "08:30";
  policy.notifications.scenarios.breakfast.windowEnd = "10:00";
  policy.notifications.scenarios.breakfast.title = "Breakfast check-in";
  policy.notifications.scenarios.breakfast.body = "Log breakfast now.";
  return policy;
};

describe("push reminder scheduling", () => {
  it("handles normal and overnight time windows", () => {
    expect(isWithinTimeWindow(9 * 60, "08:30", "10:00")).toBe(true);
    expect(isWithinTimeWindow(11 * 60, "08:30", "10:00")).toBe(false);
    expect(isWithinTimeWindow(23 * 60, "22:00", "07:00")).toBe(true);
    expect(isWithinTimeWindow(6 * 60 + 30, "22:00", "07:00")).toBe(true);
    expect(isWithinTimeWindow(13 * 60, "22:00", "07:00")).toBe(false);
  });

  it("uses the profile timezone to calculate the local reminder day", () => {
    const clock = localReminderClock(new Date("2026-06-03T03:45:00.000Z"), "Asia/Kolkata");

    expect(clock).toEqual({
      timezone: "Asia/Kolkata",
      localDate: "2026-06-03",
      localTimeMinutes: 9 * 60 + 15,
    });
  });

  it("selects an enabled due reminder when the user has not logged that meal", () => {
    const decision = selectDueReminder(policyWithBreakfast(), candidate());

    expect(decision).toEqual({
      shouldSend: true,
      scenarioKey: "breakfast",
      scenarioSlot: "primary",
      title: "Breakfast check-in",
      body: "Log breakfast now.",
      deeplink: "logmyplate://",
    });
  });

  it("does not send during quiet hours", () => {
    const decision = selectDueReminder(
      policyWithBreakfast(),
      candidate({ localTimeMinutes: 23 * 60 }),
    );

    expect(decision).toEqual({ shouldSend: false, reason: "quiet_hours" });
  });

  it("does not send once the same meal is already logged today", () => {
    const decision = selectDueReminder(
      policyWithBreakfast(),
      candidate({ loggedMealTypes: new Set(["breakfast"]) }),
    );

    expect(decision).toEqual({ shouldSend: false, reason: "meal_already_logged" });
  });

  it("honors the notification daily cap", () => {
    const policy = policyWithBreakfast();
    policy.notifications.dailyCap = 1;

    const decision = selectDueReminder(policy, candidate({ sentTodayCount: 1 }));

    expect(decision).toEqual({ shouldSend: false, reason: "daily_cap_reached" });
  });

  it("does not send target-aware reminders after the user has reached their target", () => {
    const policy = defaultEngagementPolicyConfig();
    policy.notifications.enabled = true;
    policy.notifications.scenarios.lunch.enabled = true;

    const decision = selectDueReminder(
      policy,
      candidate({
        localTimeMinutes: 13 * 60 + 15,
        dailyCalorieTarget: 1500,
        todayCalories: 1500,
      }),
    );

    expect(decision).toEqual({ shouldSend: false, reason: "target_reached" });
  });

  it("allows target setup once in each configured target setup window when target is missing", () => {
    const policy = defaultEngagementPolicyConfig();
    policy.notifications.enabled = true;
    policy.notifications.scenarios.targetSetup.enabled = true;
    policy.notifications.scenarios.targetSetup.windowStart = "11:00";
    policy.notifications.scenarios.targetSetup.windowEnd = "12:00";
    policy.notifications.scenarios.targetSetup.secondWindowStart = "18:00";
    policy.notifications.scenarios.targetSetup.secondWindowEnd = "19:00";

    expect(
      selectDueReminder(
        policy,
        candidate({
          hasTarget: false,
          dailyCalorieTarget: null,
          localTimeMinutes: 11 * 60 + 15,
        }),
      ),
    ).toEqual({
      shouldSend: true,
      scenarioKey: "targetSetup",
      scenarioSlot: "primary",
      title: "Set your calorie target",
      body: "Set a target once so LogMyPlate can guide your day better.",
      deeplink: "logmyplate://target",
    });

    expect(
      selectDueReminder(
        policy,
        candidate({
          hasTarget: false,
          dailyCalorieTarget: null,
          localTimeMinutes: 18 * 60 + 15,
          sentScenarioKeys: new Set(["targetSetup:primary"]),
        }),
      ),
    ).toEqual({
      shouldSend: true,
      scenarioKey: "targetSetup",
      scenarioSlot: "secondary",
      title: "Set your calorie target",
      body: "Set a target once so LogMyPlate can guide your day better.",
      deeplink: "logmyplate://target",
    });
  });
});
