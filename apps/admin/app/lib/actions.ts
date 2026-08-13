"use server";

import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { adminGet, adminSend, type EngagementPolicy } from "./api";
import { readMutationKey } from "./idempotency";
import {
  defaultProjectId,
  getProjectSource,
  projectCookieName,
  projectIdFromPathname,
} from "./registry";
import {
  clearAdminSession,
  createAdminSession,
  requireAdminSession,
  validateAdminCredentials,
} from "./session";

/**
 * Which project the operator was looking at when they submitted a form.
 *
 * Actions receive FormData, not route params, so the project is recovered from
 * the request context: Next sends `next-url` for action requests, and `referer`
 * covers the no-JavaScript form post. If neither resolves — a stripped referrer,
 * say — we fall back to the remembered project rather than guessing, so the
 * operator lands where they left off.
 *
 * The mutation itself is never affected by this; only where the redirect lands.
 * When a second project exists and this proves too loose, the explicit fix is a
 * hidden project field per form.
 */
async function activeProjectId() {
  const headerList = await headers();
  const candidates = [headerList.get("next-url"), headerList.get("referer")];

  for (const candidate of candidates) {
    if (!candidate) continue;
    const pathname = candidate.startsWith("/") ? candidate : safeUrlPathname(candidate);
    const projectId = pathname ? projectIdFromPathname(pathname) : undefined;
    if (projectId) return projectId;
  }

  const remembered = (await cookies()).get(projectCookieName)?.value;
  return remembered && getProjectSource(remembered) ? remembered : defaultProjectId;
}

function safeUrlPathname(value: string) {
  try {
    return new URL(value).pathname;
  } catch {
    return undefined;
  }
}

/** Revalidates a project-relative path for the active project. */
async function revalidateProjectPath(path: string) {
  revalidatePath(`/${await activeProjectId()}${path}`);
}

/** Redirects to a project-relative path within the active project. */
async function redirectToProject(path: string): Promise<never> {
  redirect(`/${await activeProjectId()}${path}`);
}

/** Remembers the chosen project and opens it. */
export async function switchProjectAction(formData: FormData) {
  await requireAdminSession();
  const requested = stringValue(formData, "project");
  const source = getProjectSource(requested);
  if (!source) redirect("/");

  (await cookies()).set(projectCookieName, source.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  redirect(`/${source.id}`);
}

export async function loginAction(formData: FormData) {
  const username = stringValue(formData, "username");
  const password = stringValue(formData, "password");

  if (!validateAdminCredentials(username, password)) {
    redirect("/login?error=invalid");
  }

  await createAdminSession(username);
  redirect("/");
}

export async function logoutAction() {
  await clearAdminSession();
  redirect("/login");
}

export async function grantCreditsAction(formData: FormData) {
  await requireAdminSession();
  const profileId = stringValue(formData, "profileId");
  await adminSend(
    `/admin/users/${profileId}/grants`,
    {
      creditType: stringValue(formData, "creditType"),
      amount: numberValue(formData, "amount"),
      reason: stringValue(formData, "reason"),
    },
    { idempotencyKey: readMutationKey(formData) },
  );
  await revalidateProjectPath("/users");
  await redirectToProject(`/users?profileId=${encodeURIComponent(profileId)}`);
}

export async function reactivateUserAction(formData: FormData) {
  await requireAdminSession();
  const profileId = stringValue(formData, "profileId");
  await adminSend(
    `/admin/users/${profileId}/reactivate`,
    {
      reason: stringValue(formData, "reason"),
    },
    { idempotencyKey: readMutationKey(formData), method: "PATCH" },
  );
  await revalidateProjectPath("/users");
  await redirectToProject(`/users?profileId=${encodeURIComponent(profileId)}`);
}

export async function resetNoFoodLimitAction(formData: FormData) {
  await requireAdminSession();
  const profileId = stringValue(formData, "profileId");
  await adminSend(
    `/admin/users/${profileId}/no-food-limit/reset`,
    {
      reason: stringValue(formData, "reason"),
    },
    { idempotencyKey: readMutationKey(formData) },
  );
  await revalidateProjectPath("/users");
  await redirectToProject(`/users?profileId=${encodeURIComponent(profileId)}`);
}

export async function setDefaultModelAction(formData: FormData) {
  await requireAdminSession();
  await adminSend(
    "/admin/ai/models/default",
    {
      key: stringValue(formData, "key"),
      reason: stringValue(formData, "reason"),
    },
    { idempotencyKey: readMutationKey(formData), method: "PUT" },
  );
  await revalidateProjectPath("/ai");
  await redirectToProject("/ai?section=models");
}

export async function updateModelAction(formData: FormData) {
  await requireAdminSession();
  const key = stringValue(formData, "key");
  await adminSend(
    `/admin/ai/models/${encodeURIComponent(key)}`,
    {
      enabled: formData.get("enabled") === "on",
      maxOutputTokens: numberValue(formData, "maxOutputTokens"),
      temperature: numberValue(formData, "temperature"),
      topP: numberValue(formData, "topP"),
      notes: stringValue(formData, "notes"),
      reason: stringValue(formData, "reason"),
    },
    { idempotencyKey: readMutationKey(formData), method: "PATCH" },
  );
  await revalidateProjectPath("/ai");
  await redirectToProject("/ai?section=models");
}

export async function createPromptAction(formData: FormData) {
  await requireAdminSession();
  await adminSend(
    "/admin/ai/prompts",
    {
      key: stringValue(formData, "key") || "food_photo",
      version: stringValue(formData, "version"),
      title: stringValue(formData, "title"),
      body: stringValue(formData, "body"),
      reason: stringValue(formData, "reason"),
    },
    { idempotencyKey: readMutationKey(formData) },
  );
  await revalidateProjectPath("/ai");
  await redirectToProject("/ai?section=prompts");
}

export async function activatePromptAction(formData: FormData) {
  await requireAdminSession();
  await adminSend(
    "/admin/ai/prompts/active",
    {
      id: stringValue(formData, "id"),
      reason: stringValue(formData, "reason"),
    },
    { idempotencyKey: readMutationKey(formData), method: "PUT" },
  );
  await revalidateProjectPath("/ai");
  await redirectToProject("/ai?section=prompts");
}

export async function updatePromptAction(formData: FormData) {
  await requireAdminSession();
  const id = stringValue(formData, "id");
  await adminSend(
    `/admin/ai/prompts/${id}`,
    {
      body: stringValue(formData, "body"),
      title: stringValue(formData, "title") || undefined,
      reason: stringValue(formData, "reason"),
    },
    { idempotencyKey: readMutationKey(formData), method: "PATCH" },
  );
  await revalidateProjectPath("/ai");
  await redirectToProject("/ai?section=prompts");
}

export async function updateAiChatSettingsAction(formData: FormData) {
  await requireAdminSession();
  await adminSend(
    "/admin/ai/chat-settings",
    {
      maxTurnsPerSession: numberValue(formData, "maxTurnsPerSession"),
      welcomeMessagePrompt: stringValue(formData, "welcomeMessagePrompt"),
      freeMaxSessionsPerDay: numberValue(formData, "freeMaxSessionsPerDay"),
      premiumMaxSessionsPerDay: numberValue(formData, "premiumMaxSessionsPerDay"),
      reason: stringValue(formData, "reason"),
    },
    { idempotencyKey: readMutationKey(formData), method: "PUT" },
  );
  await revalidateProjectPath("/ai");
  await redirectToProject("/ai?section=chat");
}

export async function updateAiScanConfigAction(formData: FormData) {
  await requireAdminSession();
  await adminSend(
    "/admin/ai/scan-config",
    {
      thinkingBudget: numberValue(formData, "thinkingBudget"),
      reason: stringValue(formData, "reason"),
    },
    { idempotencyKey: readMutationKey(formData), method: "PUT" },
  );
  await revalidateProjectPath("/ai");
  await redirectToProject("/ai?section=models");
}

export async function updateFeatureFlagAction(formData: FormData) {
  await requireAdminSession();
  const key = stringValue(formData, "key");
  await adminSend(
    `/admin/feature-flags/${encodeURIComponent(key)}`,
    {
      value: formData.get("value") === "on",
      description: stringValue(formData, "description"),
      reason: stringValue(formData, "reason"),
    },
    { idempotencyKey: readMutationKey(formData), method: "PUT" },
  );
  await revalidateProjectPath("/flags");
  await redirectToProject("/flags?section=flags");
}

export async function createNoticeAction(formData: FormData) {
  await requireAdminSession();
  await adminSend(
    "/admin/notices",
    {
      title: stringValue(formData, "title"),
      body: stringValue(formData, "body"),
      severity: stringValue(formData, "severity"),
      active: formData.get("active") === "on",
      ctaLabel: optionalStringValue(formData, "ctaLabel"),
      ctaUrl: optionalStringValue(formData, "ctaUrl"),
      reason: stringValue(formData, "reason"),
    },
    { idempotencyKey: readMutationKey(formData) },
  );
  await revalidateProjectPath("/flags");
  await redirectToProject("/flags?section=notices");
}

export async function updateNoticeAction(formData: FormData) {
  await requireAdminSession();
  const noticeId = stringValue(formData, "noticeId");
  await adminSend(
    `/admin/notices/${noticeId}`,
    {
      active: formData.get("active") === "on",
      reason: stringValue(formData, "reason"),
    },
    { idempotencyKey: readMutationKey(formData), method: "PATCH" },
  );
  await revalidateProjectPath("/flags");
  await redirectToProject("/flags?section=notices");
}

export async function updateAppUpdatePolicyAction(formData: FormData) {
  await requireAdminSession();
  await adminSend(
    "/admin/app-update-policy",
    {
      enabled: formData.get("enabled") === "on",
      ios: readPlatformPolicy(formData, "ios"),
      android: readPlatformPolicy(formData, "android"),
      reason: stringValue(formData, "reason"),
    },
    { idempotencyKey: readMutationKey(formData), method: "PUT" },
  );
  await revalidateProjectPath("/versions");
  await redirectToProject("/versions");
}

export async function updateEngagementPolicyAction(formData: FormData) {
  await requireAdminSession();
  await adminSend("/admin/engagement-policy", readEngagementPolicy(formData), {
    idempotencyKey: readMutationKey(formData),
    method: "PUT",
  });
  await revalidateProjectPath("/growth");
  await redirectToProject("/growth?section=analytics");
}

export async function updateEngagementAnalyticsAction(formData: FormData) {
  await updateEngagementPolicySection(
    formData,
    "analytics",
    readAnalyticsPolicy(formData),
    "analytics",
  );
}

export async function updateReviewPromptAction(formData: FormData) {
  await updateEngagementPolicySection(
    formData,
    "reviewPrompt",
    readReviewPromptPolicy(formData),
    "review",
  );
}

export async function updateInterstitialAdsAction(formData: FormData) {
  await updateEngagementPolicySection(
    formData,
    "interstitialAds",
    readInterstitialAdsPolicy(formData),
    "ads",
  );
}

export async function updateRewardedAdsAction(formData: FormData) {
  await updateEngagementPolicySection(
    formData,
    "rewardedAds",
    readRewardedAdsPolicy(formData),
    "rewarded",
  );
}

export async function updateAdmobAction(formData: FormData) {
  await updateEngagementPolicySection(formData, "admob", readAdmobPolicy(formData), "admob");
}

export async function updateNotificationsAction(formData: FormData) {
  await updateEngagementPolicySection(
    formData,
    "notifications",
    readNotificationsPolicy(formData),
    "notifications",
  );
}

export async function updateStreaksAction(formData: FormData) {
  await updateEngagementPolicySection(formData, "streaks", readStreaksPolicy(formData), "streaks");
}

export async function sendPushNotificationAction(formData: FormData) {
  await requireAdminSession();
  let pushError: string | undefined;
  let pushMessage: string | undefined;
  try {
    const response = await adminSend<PushNotificationSendResponse>(
      "/admin/push-notifications/send",
      {
        targetType: stringValue(formData, "targetType"),
        profileId: optionalStringValue(formData, "profileId"),
        installId: optionalStringValue(formData, "installId"),
        title: stringValue(formData, "title"),
        body: stringValue(formData, "body"),
        confirmAll: optionalStringValue(formData, "confirmAll"),
        reason: stringValue(formData, "reason"),
        data: {
          deeplink: optionalStringValue(formData, "deeplink") ?? "logmyplate://",
        },
      },
      { idempotencyKey: readMutationKey(formData) },
    );
    if (response.delivery.failed > 0) {
      pushError = formatPushDeliveryFailure(response.delivery);
    } else {
      pushMessage = `Push sent to ${response.delivery.sent} active token${
        response.delivery.sent === 1 ? "" : "s"
      }.`;
    }
  } catch (error) {
    pushError = error instanceof Error ? error.message : "Push notification send failed.";
  }
  await revalidateProjectPath("/growth");
  if (pushError) {
    redirect(
      `/growth?section=push&push=error&message=${encodeURIComponent(pushError.slice(0, 220))}`,
    );
  }
  redirect(
    `/growth?section=push&push=sent${
      pushMessage ? `&message=${encodeURIComponent(pushMessage)}` : ""
    }`,
  );
}

type PushNotificationDelivery = {
  attempted: number;
  sent: number;
  failed: number;
  disabledTokens: number;
  failures: Record<string, number>;
};

type PushNotificationSendResponse = {
  delivery: PushNotificationDelivery;
};

const formatPushDeliveryFailure = (delivery: PushNotificationDelivery): string => {
  const failureSummary = Object.entries(delivery.failures)
    .sort(([, left], [, right]) => right - left)
    .map(([key, count]) => `${key} (${count})`)
    .join(", ");
  return `Push attempted ${delivery.attempted} token${
    delivery.attempted === 1 ? "" : "s"
  }: sent ${delivery.sent}, failed ${delivery.failed}${
    failureSummary ? `. Failures: ${failureSummary}.` : "."
  }`;
};

const stringValue = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();

const optionalStringValue = (formData: FormData, key: string) => {
  const value = stringValue(formData, key);
  return value ? value : undefined;
};

const nullableStringValue = (formData: FormData, key: string) => {
  const value = stringValue(formData, key);
  return value ? value : null;
};

const nullableDateTimeValue = (formData: FormData, key: string) => {
  const value = nullableStringValue(formData, key);
  if (!value) return null;
  if (/(?:z|[+-]\d{2}:\d{2})$/i.test(value)) return value;
  const withSeconds = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value) ? `${value}:00` : value;
  return `${withSeconds}+05:30`;
};

const booleanValue = (formData: FormData, key: string) => formData.get(key) === "on";

const numberValue = (formData: FormData, key: string) => Number(formData.get(key) ?? 0);

const readPlatformPolicy = (formData: FormData, platform: "ios" | "android") => ({
  latestBuild: numberValue(formData, `${platform}.latestBuild`),
  minSupportedBuild: numberValue(formData, `${platform}.minSupportedBuild`),
  latestVersion: optionalStringValue(formData, `${platform}.latestVersion`),
  storeUrl: optionalStringValue(formData, `${platform}.storeUrl`),
  optionalTitle: stringValue(formData, `${platform}.optionalTitle`),
  optionalMessage: stringValue(formData, `${platform}.optionalMessage`),
  mandatoryTitle: stringValue(formData, `${platform}.mandatoryTitle`),
  mandatoryMessage: stringValue(formData, `${platform}.mandatoryMessage`),
});

const notificationScenarioKeys = ["breakfast", "lunch", "snack", "dinner", "targetSetup"] as const;

const analyticsEventKeys = [
  "appOpen",
  "bootstrapLoaded",
  "tabSelected",
  "scanStarted",
  "scanAnalysisSucceeded",
  "scanAnalysisFailed",
  "scanConfirmed",
  "manualMealSaved",
  "mealUpdated",
  "mealDeleted",
  "rewardedAdStarted",
  "rewardedAdEarned",
  "rewardedAdFailed",
  "accountGateShown",
  "accountLinked",
  "healthTargetSaved",
] as const;

const readEngagementPolicy = (formData: FormData) => ({
  analytics: readAnalyticsPolicy(formData),
  reviewPrompt: readReviewPromptPolicy(formData),
  interstitialAds: readInterstitialAdsPolicy(formData),
  rewardedAds: readRewardedAdsPolicy(formData),
  admob: readAdmobPolicy(formData),
  notifications: readNotificationsPolicy(formData),
  streaks: readStreaksPolicy(formData),
  reason: stringValue(formData, "reason"),
});

const readAnalyticsPolicy = (formData: FormData): EngagementPolicy["analytics"] => ({
  enabled: booleanValue(formData, "analytics.enabled"),
  firebaseEnabled: booleanValue(formData, "analytics.firebaseEnabled"),
  debugLogging: booleanValue(formData, "analytics.debugLogging"),
  sampleRatePercent: numberValue(formData, "analytics.sampleRatePercent"),
  events: Object.fromEntries(
    analyticsEventKeys.map((key) => [key, booleanValue(formData, `analytics.events.${key}`)]),
  ) as EngagementPolicy["analytics"]["events"],
});

const readReviewPromptPolicy = (formData: FormData): EngagementPolicy["reviewPrompt"] => ({
  enabled: booleanValue(formData, "reviewPrompt.enabled"),
  minConfirmedScans: numberValue(formData, "reviewPrompt.minConfirmedScans"),
  minActiveDays: numberValue(formData, "reviewPrompt.minActiveDays"),
  cooldownDays: numberValue(formData, "reviewPrompt.cooldownDays"),
  oncePerAppVersion: booleanValue(formData, "reviewPrompt.oncePerAppVersion"),
  storeUrls: {
    ios: nullableStringValue(formData, "reviewPrompt.storeUrls.ios"),
    android: nullableStringValue(formData, "reviewPrompt.storeUrls.android"),
  },
  copy: {
    title: stringValue(formData, "reviewPrompt.copy.title"),
    body: stringValue(formData, "reviewPrompt.copy.body"),
    positiveLabel: stringValue(formData, "reviewPrompt.copy.positiveLabel"),
    negativeLabel: stringValue(formData, "reviewPrompt.copy.negativeLabel"),
  },
});

const readInterstitialAdsPolicy = (formData: FormData): EngagementPolicy["interstitialAds"] => ({
  enabled: booleanValue(formData, "interstitialAds.enabled"),
  freeUsersOnly: booleanValue(formData, "interstitialAds.freeUsersOnly"),
  premiumExcluded: booleanValue(formData, "interstitialAds.premiumExcluded"),
  minConfirmedScansBeforeFirstAd: numberValue(
    formData,
    "interstitialAds.minConfirmedScansBeforeFirstAd",
  ),
  scansBetweenAds: numberValue(formData, "interstitialAds.scansBetweenAds"),
  cooldownMinutes: numberValue(formData, "interstitialAds.cooldownMinutes"),
  dailyCap: numberValue(formData, "interstitialAds.dailyCap"),
  adUnitIds: {
    ios: nullableStringValue(formData, "interstitialAds.adUnitIds.ios"),
    android: nullableStringValue(formData, "interstitialAds.adUnitIds.android"),
  },
});

const readAdmobPolicy = (formData: FormData): EngagementPolicy["admob"] => {
  const idsStr = stringValue(formData, "admob.testDeviceIds");
  const testDeviceIds = idsStr
    .split(/[\n,]+/)
    .map((id) => id.trim())
    .filter((id) => id.length > 0);

  return { testDeviceIds };
};

const readRewardedAdsPolicy = (formData: FormData): EngagementPolicy["rewardedAds"] => {
  const iosDailyCredits = numberValue(
    formData,
    "rewardedAds.adSuspensionDailyCredits.platform.ios",
  );
  const androidDailyCredits = numberValue(
    formData,
    "rewardedAds.adSuspensionDailyCredits.platform.android",
  );

  return {
    enabled: booleanValue(formData, "rewardedAds.enabled"),
    dailyScanLimit: numberValue(formData, "rewardedAds.dailyScanLimit"),
    adSuspensionDailyCredits: {
      enabled: booleanValue(formData, "rewardedAds.adSuspensionDailyCredits.enabled"),
      registeredUsersOnly: booleanValue(
        formData,
        "rewardedAds.adSuspensionDailyCredits.registeredUsersOnly",
      ),
      freeScansPerDay: Math.max(iosDailyCredits, androidDailyCredits),
      platformFreeScansPerDay: {
        ios: iosDailyCredits,
        android: androidDailyCredits,
      },
      startsAt: nullableDateTimeValue(formData, "rewardedAds.adSuspensionDailyCredits.startsAt"),
      endsAt: nullableDateTimeValue(formData, "rewardedAds.adSuspensionDailyCredits.endsAt"),
    },
  };
};

const readNotificationsPolicy = (formData: FormData): EngagementPolicy["notifications"] => ({
  enabled: booleanValue(formData, "notifications.enabled"),
  dailyCap: numberValue(formData, "notifications.dailyCap"),
  quietHours: {
    start: stringValue(formData, "notifications.quietHours.start"),
    end: stringValue(formData, "notifications.quietHours.end"),
  },
  scenarios: Object.fromEntries(
    notificationScenarioKeys.map((key) => [key, readNotificationScenario(formData, key)]),
  ) as EngagementPolicy["notifications"]["scenarios"],
});

const readStreaksPolicy = (formData: FormData): EngagementPolicy["streaks"] => ({
  enabled: booleanValue(formData, "streaks.enabled"),
  milestones: readStreakMilestones(formData),
  scanRewards: {
    enabled: booleanValue(formData, "streaks.scanRewards.enabled"),
  },
});

const updateEngagementPolicySection = async <K extends keyof EngagementPolicy>(
  formData: FormData,
  section: K,
  value: EngagementPolicy[K],
  redirectSection: string,
) => {
  await requireAdminSession();
  const { policy } = await adminGet<{ policy: EngagementPolicy }>("/admin/engagement-policy");
  const nextPolicy = {
    ...policy,
    [section]: value,
    reason: stringValue(formData, "reason"),
  };
  await adminSend("/admin/engagement-policy", nextPolicy as unknown as Record<string, unknown>, {
    idempotencyKey: readMutationKey(formData),
    method: "PUT",
  });
  await revalidateProjectPath("/growth");
  await redirectToProject(`/growth?section=${redirectSection}`);
};

const readNotificationScenario = (
  formData: FormData,
  key: (typeof notificationScenarioKeys)[number],
) => ({
  enabled: booleanValue(formData, `notifications.scenarios.${key}.enabled`),
  windowStart: stringValue(formData, `notifications.scenarios.${key}.windowStart`),
  windowEnd: stringValue(formData, `notifications.scenarios.${key}.windowEnd`),
  secondWindowStart:
    key === "targetSetup"
      ? nullableStringValue(formData, `notifications.scenarios.${key}.secondWindowStart`)
      : null,
  secondWindowEnd:
    key === "targetSetup"
      ? nullableStringValue(formData, `notifications.scenarios.${key}.secondWindowEnd`)
      : null,
  title: stringValue(formData, `notifications.scenarios.${key}.title`),
  body: stringValue(formData, `notifications.scenarios.${key}.body`),
  requiresTarget: booleanValue(formData, `notifications.scenarios.${key}.requiresTarget`),
  onlyIfTargetNotReached: booleanValue(
    formData,
    `notifications.scenarios.${key}.onlyIfTargetNotReached`,
  ),
});

const readStreakMilestones = (formData: FormData) => {
  const count = numberValue(formData, "streaks.milestoneCount");
  return Array.from({ length: count }, (_, index) => ({
    days: numberValue(formData, `streaks.milestones.${index}.days`),
    title: stringValue(formData, `streaks.milestones.${index}.title`),
    body: stringValue(formData, `streaks.milestones.${index}.body`),
    scanRewardAmount: numberValue(formData, `streaks.milestones.${index}.scanRewardAmount`),
  }));
};
