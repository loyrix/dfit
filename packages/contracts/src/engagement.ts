import { z } from "zod";

const timeOfDaySchema = z
  .string()
  .trim()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/);

const nullableUrlSchema = z.string().trim().url().max(500).nullable();

const analyticsEventKeySchema = z.object({
  appOpen: z.boolean().default(true),
  bootstrapLoaded: z.boolean().default(true),
  tabSelected: z.boolean().default(false),
  scanStarted: z.boolean().default(true),
  scanAnalysisSucceeded: z.boolean().default(true),
  scanAnalysisFailed: z.boolean().default(true),
  scanConfirmed: z.boolean().default(true),
  manualMealSaved: z.boolean().default(true),
  mealUpdated: z.boolean().default(true),
  mealDeleted: z.boolean().default(true),
  rewardedAdStarted: z.boolean().default(true),
  rewardedAdEarned: z.boolean().default(true),
  rewardedAdFailed: z.boolean().default(true),
  accountGateShown: z.boolean().default(true),
  accountLinked: z.boolean().default(true),
  healthTargetSaved: z.boolean().default(true),
});

export const engagementAnalyticsPolicySchema = z.object({
  enabled: z.boolean().default(false),
  firebaseEnabled: z.boolean().default(false),
  debugLogging: z.boolean().default(false),
  sampleRatePercent: z.coerce.number().int().min(0).max(100).default(100),
  events: analyticsEventKeySchema.default({}),
});

const reviewPromptCopySchema = z.object({
  title: z.string().trim().min(3).max(120).default("Enjoying LogMyPlate?"),
  body: z
    .string()
    .trim()
    .min(3)
    .max(500)
    .default("A quick review helps more people discover simple meal tracking."),
  positiveLabel: z.string().trim().min(1).max(80).default("Rate LogMyPlate"),
  negativeLabel: z.string().trim().min(1).max(80).default("Not now"),
});

const platformStoreUrlsSchema = z.object({
  ios: nullableUrlSchema.default("https://apps.apple.com/app/id6770872606"),
  android: nullableUrlSchema.default(
    "https://play.google.com/store/apps/details?id=com.logmyplate.app",
  ),
});

export const engagementReviewPromptPolicySchema = z.object({
  enabled: z.boolean().default(false),
  minConfirmedScans: z.coerce.number().int().min(0).max(1000).default(3),
  minActiveDays: z.coerce.number().int().min(0).max(365).default(2),
  cooldownDays: z.coerce.number().int().min(1).max(365).default(90),
  oncePerAppVersion: z.boolean().default(true),
  storeUrls: platformStoreUrlsSchema.default({}),
  copy: reviewPromptCopySchema.default({}),
});

const platformAdUnitIdsSchema = z.object({
  ios: z.string().trim().max(160).nullable().default(null),
  android: z.string().trim().max(160).nullable().default(null),
});

export const engagementInterstitialAdsPolicySchema = z.object({
  enabled: z.boolean().default(false),
  freeUsersOnly: z.boolean().default(true),
  premiumExcluded: z.boolean().default(true),
  minConfirmedScansBeforeFirstAd: z.coerce.number().int().min(0).max(1000).default(2),
  scansBetweenAds: z.coerce.number().int().min(1).max(1000).default(2),
  cooldownMinutes: z.coerce.number().int().min(0).max(1440).default(10),
  dailyCap: z.coerce.number().int().min(0).max(100).default(3),
  adUnitIds: platformAdUnitIdsSchema.default({}),
});

export const engagementRewardedAdsPolicySchema = z.object({
  dailyScanLimit: z.coerce.number().int().min(1).max(100).default(5),
});

const notificationScenarioPolicySchema = z.object({
  enabled: z.boolean().default(false),
  windowStart: timeOfDaySchema.default("12:00"),
  windowEnd: timeOfDaySchema.default("13:00"),
  secondWindowStart: timeOfDaySchema.nullable().default(null),
  secondWindowEnd: timeOfDaySchema.nullable().default(null),
  title: z.string().trim().min(3).max(120).default("Meal reminder"),
  body: z.string().trim().min(3).max(500).default("Log your meal when it fits."),
  requiresTarget: z.boolean().default(false),
  onlyIfTargetNotReached: z.boolean().default(true),
});

const quietHoursPolicySchema = z.object({
  start: timeOfDaySchema.default("22:00"),
  end: timeOfDaySchema.default("07:00"),
});

export const engagementNotificationsPolicySchema = z.object({
  enabled: z.boolean().default(false),
  dailyCap: z.coerce.number().int().min(0).max(10).default(2),
  quietHours: quietHoursPolicySchema.default({}),
  scenarios: z
    .object({
      breakfast: notificationScenarioPolicySchema.default({
        windowStart: "08:30",
        windowEnd: "10:00",
        title: "Breakfast check-in",
        body: "A quick breakfast log keeps today on track.",
      }),
      lunch: notificationScenarioPolicySchema.default({
        windowStart: "13:00",
        windowEnd: "14:30",
        title: "Lunch reminder",
        body: "Still no lunch logged. Add it before the day gets busy.",
        requiresTarget: true,
      }),
      snack: notificationScenarioPolicySchema.default({
        windowStart: "17:00",
        windowEnd: "18:30",
        title: "Snack check-in",
        body: "If you had a snack, log it now while it is fresh.",
        requiresTarget: true,
      }),
      dinner: notificationScenarioPolicySchema.default({
        windowStart: "20:00",
        windowEnd: "21:30",
        title: "Dinner reminder",
        body: "Dinner not logged yet. Capture it before wrapping up.",
        requiresTarget: true,
      }),
      targetSetup: notificationScenarioPolicySchema.default({
        windowStart: "18:00",
        windowEnd: "19:00",
        secondWindowStart: "11:00",
        secondWindowEnd: "12:00",
        title: "Set your calorie target",
        body: "Set a target once so LogMyPlate can guide your day better.",
        onlyIfTargetNotReached: false,
      }),
    })
    .default({}),
});

const streakMilestoneSchema = z.object({
  days: z.coerce.number().int().min(1).max(3650),
  title: z.string().trim().min(3).max(120),
  body: z.string().trim().min(3).max(500),
  scanRewardAmount: z.coerce.number().int().min(0).max(100).default(0),
});

export const engagementStreaksPolicySchema = z.object({
  enabled: z.boolean().default(false),
  milestones: z
    .array(streakMilestoneSchema)
    .min(1)
    .max(20)
    .default([
      {
        days: 3,
        title: "3-day streak",
        body: "You logged meals for 3 days. Nice rhythm.",
        scanRewardAmount: 0,
      },
      {
        days: 7,
        title: "7-day streak",
        body: "A full week of logging. Your pattern is getting clearer.",
        scanRewardAmount: 0,
      },
      {
        days: 14,
        title: "14-day streak",
        body: "Two steady weeks. This is how awareness becomes a habit.",
        scanRewardAmount: 0,
      },
      {
        days: 30,
        title: "30-day streak",
        body: "A month of consistency. That is real progress.",
        scanRewardAmount: 0,
      },
    ]),
  scanRewards: z
    .object({
      enabled: z.boolean().default(false),
    })
    .default({}),
});

export const engagementPolicyConfigSchema = z.object({
  analytics: engagementAnalyticsPolicySchema.default({}),
  reviewPrompt: engagementReviewPromptPolicySchema.default({}),
  interstitialAds: engagementInterstitialAdsPolicySchema.default({}),
  rewardedAds: engagementRewardedAdsPolicySchema.default({}),
  notifications: engagementNotificationsPolicySchema.default({}),
  streaks: engagementStreaksPolicySchema.default({}),
});

export type EngagementPolicyConfigContract = z.infer<typeof engagementPolicyConfigSchema>;

export const defaultEngagementPolicyConfig = (): EngagementPolicyConfigContract =>
  engagementPolicyConfigSchema.parse({});

export const parseEngagementPolicyConfig = (value: unknown): EngagementPolicyConfigContract => {
  const parsed = engagementPolicyConfigSchema.safeParse(value);
  return parsed.success ? parsed.data : defaultEngagementPolicyConfig();
};
