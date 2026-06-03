import "server-only";

import { randomUUID } from "node:crypto";

export type AdminOverview = {
  profiles: number;
  accountProfiles: number;
  scans: number;
  failedScans: number;
  meals: number;
  activeNotices: number;
  installs?: number;
  newInstallsToday?: number;
  activeInstalls24h?: number;
  activeInstalls7d?: number;
  inactiveInstalls30d?: number;
  scanActiveProfilesToday?: number;
  mealActiveProfilesToday?: number;
  dailyActivity?: Array<{
    date: string;
    activeProfiles: number;
    scans: number;
    mealProfiles: number;
    meals: number;
  }>;
  platforms?: Array<{
    platform: "ios" | "android";
    installs: number;
    newInstallsToday: number;
    activeInstallsToday: number;
    activeInstalls24h: number;
    activeInstalls7d: number;
    scans: number;
    aiRuns: number;
    aiCostInr: number;
  }>;
  dailyPlatformActivity?: Array<{
    date: string;
    platform: "ios" | "android";
    activeInstalls: number;
    installs: number;
    scans: number;
    aiRuns: number;
    aiCostInr: number;
  }>;
  appBuilds?: Array<{
    platform: "ios" | "android";
    appVersion: string;
    appBuild: number;
    installs: number;
    activeInstalls7d: number;
    lastSeenAt?: string;
  }>;
};

export type PageInfo = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  sort: string;
  direction: "asc" | "desc";
  isClientFallback?: boolean;
};

export type AiCostData = {
  generatedAt: string;
  days: number;
  usdToInr: number;
  overall: {
    runs: number;
    scans: number;
    successfulRuns: number;
    successfulScans: number;
    failedRuns: number;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    costUsd: number;
    costInr: number;
    averageRunCostInr: number;
    averageCostInr: number;
    runsPerTenInr: number;
    scansPerTenInr: number;
    averageLatencyMs: number | null;
    averageConfidence: number | null;
  };
  daily: Array<{
    date: string;
    runs: number;
    scans: number;
    costInr: number;
    averageRunCostInr: number;
    averageCostInr: number;
  }>;
  platforms: Array<{
    platform: "ios" | "android" | "unknown";
    runs: number;
    scans: number;
    inputTokens: number;
    outputTokens: number;
    costInr: number;
    averageRunCostInr: number;
    averageCostInr: number;
    runsPerTenInr: number;
    scansPerTenInr: number;
  }>;
  appBuilds: Array<{
    platform: "ios" | "android" | "unknown";
    appVersion: string;
    appBuild: number;
    runs: number;
    scans: number;
    inputTokens: number;
    outputTokens: number;
    costInr: number;
    averageRunCostInr: number;
    averageCostInr: number;
    runsPerTenInr: number;
    scansPerTenInr: number;
  }>;
  models: Array<{
    provider: string;
    model: string;
    runs: number;
    scans: number;
    inputTokens: number;
    outputTokens: number;
    costInr: number;
    averageRunCostInr: number;
    averageCostInr: number;
    runsPerTenInr: number;
    scansPerTenInr: number;
  }>;
  recentRuns: Array<{
    createdAt: string;
    platform: "ios" | "android" | "unknown";
    appVersion: string;
    appBuild: number;
    provider: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
    costInr: number;
    latencyMs: number | null;
    confidence: number | null;
    success: boolean;
  }>;
};

export type AdminUser = {
  id: string;
  authMethod: string;
  email?: string;
  displayName?: string;
  identityProvider?: string;
  providerSubject?: string;
  timezone: string;
  device?: {
    timezone?: string;
    region?: string;
    locale?: string;
    platform?: string;
    appVersion?: string;
    appBuild?: number;
    lastSeenAt?: string;
  };
  linkedAt?: string;
  deletionRequestedAt?: string;
  deactivatedAt?: string;
  deletedAt?: string;
  lifecycleEventId?: string;
  lifecycleEventType?: string;
  lifecycleActor?: string;
  lifecycleReason?: string;
  createdAt: string;
  updatedAt: string;
  lastScanAt?: string;
  quota: { freeRemaining: number; rewardedRemaining: number; premiumRemaining: number };
  stats: { meals: number; scans: number; failedScans: number; grants: number };
  grants?: AdminGrant[];
  recentScans?: AdminScan[];
  lifecycleEvents?: AdminLifecycleEvent[];
  noFoodLimit?: AdminNoFoodScanLimit;
};

export type AdminGrant = {
  id: string;
  profileId: string;
  creditType: string;
  amount: number;
  reason: string;
  actor: string;
  createdAt: string;
};

export type AdminNoFoodScanLimit = {
  attemptsLast24h: number;
  latestResetId?: string;
  latestResetReason?: string;
  latestResetActor?: string;
  latestResetAt?: string;
  resets: AdminNoFoodScanLimitReset[];
};

export type AdminNoFoodScanLimitReset = {
  id: string;
  profileId: string;
  reason: string;
  actor: string;
  resetAt: string;
  createdAt: string;
};

export type AdminLifecycleEvent = {
  id: string;
  profileId: string;
  eventType: "deactivated" | "deleted";
  actorType: string;
  actor: string;
  reason?: string;
  authMethod?: string;
  email?: string;
  displayName?: string;
  identityProvider?: string;
  providerSubject?: string;
  profileTimezone?: string;
  installId?: string;
  platform?: string;
  appVersion?: string;
  appBuild?: number;
  deviceTimezone?: string;
  deviceRegion?: string;
  deviceLocale?: string;
  scanCount: number;
  failedScanCount: number;
  mealCount: number;
  profileCreatedAt?: string;
  profileUpdatedAt?: string;
  createdAt: string;
};

export type AdminScan = {
  id: string;
  profileId?: string;
  installId?: string;
  platform?: string;
  appVersion?: string;
  appBuild?: number;
  profileEmail?: string;
  profileDisplayName?: string;
  profileAuthMethod?: string;
  profileTimezone?: string;
  deviceTimezone?: string;
  deviceRegion?: string;
  deviceLocale?: string;
  status: string;
  creditReason?: string;
  userHint?: string;
  image?: {
    mimeType?: string;
    byteSize?: number;
    bucket?: string;
    objectKey: string;
    url?: string;
  };
  ai?: {
    provider?: string;
    model: string;
    promptVersion?: string;
    latencyMs?: number;
    success?: boolean;
    errorCode?: string;
    confidence?: number | null;
  };
  meal?: { id: string; title?: string };
  createdAt: string;
  updatedAt: string;
  rawAiJson?: unknown;
};

export type AdminConversionSummary = {
  totalInstalls: number;
  registeredInstalls: number;
  anonymousInstalls: number;
  registrationRate: number;
};

export type AdminConversionInstall = {
  installId: string;
  platform: string;
  appVersion?: string;
  appBuild?: number;
  profileId?: string;
  authMethod?: string;
  email?: string;
  displayName?: string;
  identityProvider?: string;
  linkedAt?: string;
  profileCreatedAt?: string;
  profileUpdatedAt?: string;
  profileTimezone?: string;
  deviceTimezone?: string;
  deviceRegion?: string;
  deviceLocale?: string;
  createdAt: string;
  updatedAt: string;
  stats: {
    scans: number;
    failedScans: number;
    meals: number;
  };
};

export type AiModel = {
  key: string;
  platform: string;
  modelFamily: string;
  model: string;
  displayName: string;
  enabled: boolean;
  isDefault: boolean;
  fallbackKey?: string;
  maxOutputTokens: number;
  temperature: number;
  topP: number;
  pricing: unknown;
  notes?: string;
  updatedBy?: string;
  updatedAt: string;
};

export type AiPrompt = {
  id: string;
  key: string;
  version: string;
  modelFamily: string;
  title: string;
  body: string;
  status: string;
  isActive: boolean;
  updatedBy?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type FeatureFlag = {
  key: string;
  value: unknown;
  description?: string;
  updatedBy?: string;
  updatedAt: string;
};

export type AppNotice = {
  id: string;
  title: string;
  body: string;
  severity: string;
  active: boolean;
  ctaLabel?: string;
  ctaUrl?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
};

export type AppUpdatePlatformPolicy = {
  latestBuild: number;
  minSupportedBuild: number;
  latestVersion: string | null;
  storeUrl: string | null;
  optionalTitle: string;
  optionalMessage: string;
  mandatoryTitle: string;
  mandatoryMessage: string;
};

export type AppUpdatePolicy = {
  enabled: boolean;
  ios: AppUpdatePlatformPolicy;
  android: AppUpdatePlatformPolicy;
};

export type EngagementNotificationScenario = {
  enabled: boolean;
  windowStart: string;
  windowEnd: string;
  secondWindowStart?: string | null;
  secondWindowEnd?: string | null;
  title: string;
  body: string;
  requiresTarget: boolean;
  onlyIfTargetNotReached: boolean;
};

export type EngagementAnalyticsEvents = {
  appOpen: boolean;
  bootstrapLoaded: boolean;
  tabSelected: boolean;
  scanStarted: boolean;
  scanAnalysisSucceeded: boolean;
  scanAnalysisFailed: boolean;
  scanConfirmed: boolean;
  manualMealSaved: boolean;
  mealUpdated: boolean;
  mealDeleted: boolean;
  rewardedAdStarted: boolean;
  rewardedAdEarned: boolean;
  rewardedAdFailed: boolean;
  accountGateShown: boolean;
  accountLinked: boolean;
  healthTargetSaved: boolean;
};

export type EngagementPolicy = {
  analytics: {
    enabled: boolean;
    firebaseEnabled: boolean;
    debugLogging: boolean;
    sampleRatePercent: number;
    events: EngagementAnalyticsEvents;
  };
  reviewPrompt: {
    enabled: boolean;
    minConfirmedScans: number;
    minActiveDays: number;
    cooldownDays: number;
    oncePerAppVersion: boolean;
    storeUrls: {
      ios: string | null;
      android: string | null;
    };
    copy: {
      title: string;
      body: string;
      positiveLabel: string;
      negativeLabel: string;
    };
  };
  interstitialAds: {
    enabled: boolean;
    freeUsersOnly: boolean;
    premiumExcluded: boolean;
    minConfirmedScansBeforeFirstAd: number;
    scansBetweenAds: number;
    cooldownMinutes: number;
    dailyCap: number;
    adUnitIds: {
      ios: string | null;
      android: string | null;
    };
  };
  notifications: {
    enabled: boolean;
    dailyCap: number;
    quietHours: {
      start: string;
      end: string;
    };
    scenarios: {
      breakfast: EngagementNotificationScenario;
      lunch: EngagementNotificationScenario;
      snack: EngagementNotificationScenario;
      dinner: EngagementNotificationScenario;
      targetSetup: EngagementNotificationScenario;
    };
  };
  streaks: {
    enabled: boolean;
    milestones: Array<{
      days: number;
      title: string;
      body: string;
      scanRewardAmount: number;
    }>;
    scanRewards: {
      enabled: boolean;
    };
  };
};

export type AuditEntry = {
  id: string;
  actor: string;
  action: string;
  targetType: string;
  targetId?: string;
  reason?: string;
  before: unknown;
  after: unknown;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
};

export async function adminGet<T>(path: string): Promise<T> {
  return adminFetch<T>(path, { method: "GET" });
}

type AdminSendOptions = {
  idempotencyKey?: string;
  method?: string;
};

export async function adminSend<T>(
  path: string,
  body: Record<string, unknown>,
  options: AdminSendOptions | string = {},
) {
  const method = typeof options === "string" ? options : (options.method ?? "POST");
  const idempotencyKey = typeof options === "string" ? undefined : options.idempotencyKey;
  return adminFetch<T>(path, {
    method,
    headers: {
      "content-type": "application/json",
      "idempotency-key": normalizeIdempotencyKey(idempotencyKey, method),
    },
    body: JSON.stringify(body),
  });
}

async function adminFetch<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl()}${path}`, {
    ...init,
    headers: {
      authorization: `Basic ${Buffer.from(`${apiUsername()}:${apiPassword()}`).toString("base64")}`,
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Admin API ${response.status}: ${text.slice(0, 400)}`);
  }

  return (await response.json()) as T;
}

function apiBaseUrl() {
  return (process.env.ADMIN_API_BASE_URL ?? process.env.API_BASE_URL ?? "http://127.0.0.1:4000")
    .trim()
    .replace(/\/$/, "");
}

function apiUsername() {
  const username = process.env.ADMIN_API_USERNAME ?? process.env.ADMIN_DASHBOARD_USERNAME;
  if (!username) throw new Error("ADMIN_API_USERNAME is required for the admin app.");
  return username;
}

function apiPassword() {
  const password = process.env.ADMIN_API_PASSWORD ?? process.env.ADMIN_DASHBOARD_PASSWORD;
  if (!password) throw new Error("ADMIN_API_PASSWORD is required for the admin app.");
  return password;
}

function normalizeIdempotencyKey(idempotencyKey: string | undefined, method: string) {
  const value = idempotencyKey?.trim();
  if (!value) return `admin:${method.toLowerCase()}:${randomUUID()}`;
  if (/[\r\n]/.test(value)) throw new Error("Invalid idempotency key.");
  return value;
}
