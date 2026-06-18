import type {
  FoodRecord,
  FoodSearchResult,
  MacroTotals,
  MealImageSummary,
  MealItemNutrition,
  MealSummary,
  ScanCreditState,
} from "@logmyplate/domain";
import type { AiProviderRunMetadata } from "../services/ai-provider.js";
import type {
  ActivityLevel,
  BmiCategory,
  HealthGoal,
  HealthSex,
} from "../services/health-targets.js";

export type Profile = {
  id: string;
  authMethod: "anonymous" | "apple" | "google" | "email";
  email?: string;
  timezone: string;
  linkedAt?: string;
  createdAt: string;
};

export type AccountSession = {
  profile: Profile;
  accessToken: string;
  expiresAt: string;
};

export type PasswordResetRequest = {
  email: string;
  code: string;
  expiresAt: string;
};

export type OAuthAccountInput = {
  provider: "apple" | "google";
  providerSubject: string;
  email?: string;
  emailVerified?: boolean;
  displayName?: string;
};

export class AccountAuthError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode = 400,
  ) {
    super(message);
    this.name = "AccountAuthError";
  }
}

export type ScanSession = {
  id: string;
  profileId: string;
  installId?: string;
  platform?: "ios" | "android";
  appVersion?: string;
  appBuild?: number;
  status: "prepared" | "analyzing" | "ready_for_review" | "confirmed" | "cancelled" | "failed";
  creditReason?: "free" | "rewarded" | "premium";
  analyzedResponse?: unknown;
  aiProviderRun?: AiProviderRunMetadata;
  userHint?: string;
  imageMimeType?: string;
  imageByteSize?: number;
  imageBucket?: string;
  imageObjectKey?: string;
  imageHash?: string;
  imageHashAlgorithm?: "sha256:v1";
  createdAt: string;
};

export type ScanAnalysisCacheRecord = {
  profileId: string;
  imageHash: string;
  hashAlgorithm: "sha256:v1";
  imageMimeType?: string;
  imageByteSize?: number;
  analyzedResponse: unknown;
  createdAt: string;
  updatedAt: string;
};

export type UpsertScanAnalysisCacheInput = Omit<ScanAnalysisCacheRecord, "createdAt" | "updatedAt">;

export type IdempotencyRecord = {
  responseStatus: number;
  responseBody: unknown;
  createdAt: number;
};

export type CreateMealInput = {
  profileId?: string;
  mealType: MealSummary["mealType"];
  title: string;
  loggedAt?: string;
  source?: "manual" | "ai_scan";
  scanSessionId?: string;
  items: Array<Omit<MealItemNutrition, "foodId"> & { foodId?: string }>;
};

export type UpdateMealInput = Omit<
  CreateMealInput,
  "profileId" | "loggedAt" | "source" | "scanSessionId"
>;

export type ConfirmedScanFoodLearningItem = {
  name: string;
  aliases?: string[];
  quantity: number;
  unit: MealItemNutrition["portion"]["unit"];
  estimatedGrams: number;
  confidence?: number;
  nutrition: MacroTotals;
};

export type LearnFoodsFromConfirmedScanInput = {
  scanId: string;
  region?: string;
  predictedItems: ConfirmedScanFoodLearningItem[];
  confirmedItems: ConfirmedScanFoodLearningItem[];
};

export type AttachMealImageInput = Omit<MealImageSummary, "imageId" | "createdAt">;

export type MealDeletionPlan = {
  mealId: string;
  storedObjects: StoredObjectDeletionTarget[];
  scanSessionId?: string;
};

export type StoredObjectDeletionTarget = {
  bucket: string;
  objectKey: string;
};

export type ProfileDeletionPlan = {
  profileId: string;
  storedObjects: StoredObjectDeletionTarget[];
};

export type RewardedAdCompletionInput = {
  provider: "admob";
  placement: "scan_unlock";
  adUnitId?: string;
  transactionId?: string;
  verificationToken?: string;
  rewardType?: string;
  rewardAmount?: number;
};

export type RewardedAdServerVerificationInput = {
  provider: "admob";
  transactionId: string;
  profileId?: string;
  adUnitId?: string;
  customData?: string;
  rewardType?: string;
  rewardAmount?: number;
  signatureKeyId?: string;
  rawQuery: Record<string, string>;
};

export type RewardedAdServerVerification = {
  transactionId: string;
  profileId?: string;
  adUnitId?: string;
  customData?: string;
  rewardType?: string;
  rewardAmount?: number;
};

export type RewardedAdCreditResult = {
  grantedScan: boolean;
  adsWatchedToday: number;
  adsNeededForNextScan: number;
  scansGrantedToday: number;
  dailyScanLimit: number;
  adsPerScan: number;
  quota: ScanCreditState;
};

export type RewardedAdProgressState = Omit<RewardedAdCreditResult, "grantedScan" | "quota">;

export type SubscriptionStatusValue =
  | "active"
  | "inactive"
  | "expired"
  | "cancelled"
  | "billing_issue"
  | "unknown";

export type SubscriptionStore = "app_store" | "play_store" | "stripe" | "promotional" | "unknown";

export type SubscriptionUsageState = {
  monthlyLimit: number;
  dailyLimit: number;
  usedThisPeriod: number;
  usedToday: number;
  remainingThisPeriod: number;
  remainingToday: number;
  premiumRemaining: number;
};

export type SubscriptionStatusState = {
  appUserId: string;
  entitlementId: string;
  active: boolean;
  status: SubscriptionStatusValue;
  store?: SubscriptionStore;
  productId?: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  willRenew?: boolean;
  usage: SubscriptionUsageState;
};

export type UpsertSubscriptionEntitlementInput = {
  appUserId: string;
  entitlementId: string;
  status: SubscriptionStatusValue;
  store?: SubscriptionStore;
  productId?: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  willRenew?: boolean;
  environment?: string;
  latestEventId?: string;
  rawPayload?: unknown;
};

export type RecordSubscriptionEventInput = {
  eventId: string;
  appUserId: string;
  entitlementId?: string;
  eventType: string;
  productId?: string;
  store?: SubscriptionStore;
  environment?: string;
  purchasedAt?: string;
  expirationAt?: string;
  rawPayload: unknown;
};

export type PushTokenRegistrationInput = {
  provider: "fcm" | "apns";
  token: string;
  platform?: "ios" | "android";
  permissionStatus?: "authorized" | "provisional" | "denied" | "not_determined" | "unknown";
  apnsSandbox?: boolean;
};

export type PushTokenRegistrationResult = {
  profileId: string;
  installId: string;
  provider: "fcm" | "apns";
  platform: "ios" | "android";
  registeredAt: string;
};

export type ListMealsInput = {
  fromDate?: string;
  toDate?: string;
  limit?: number;
};

export type DailyMealAggregate = {
  date: string;
  mealCount: number;
  totals: MacroTotals;
};

export type ProfileHealthTarget = {
  profileId: string;
  heightCm: number;
  weightKg: number;
  ageYears: number;
  sex: HealthSex;
  activityLevel: ActivityLevel;
  goal: HealthGoal;
  bmi: number;
  bmiCategory: BmiCategory;
  bmrCalories: number;
  dailyCalorieTarget: number;
  formula: string;
  createdAt: string;
  updatedAt: string;
};

export type UpsertProfileHealthTargetInput = Omit<
  ProfileHealthTarget,
  "profileId" | "createdAt" | "updatedAt"
>;

export interface AppRepository {
  getProfile(): Promise<Profile>;
  deactivateProfile(): Promise<boolean>;
  getProfileDeletionPlan(): Promise<ProfileDeletionPlan>;
  deleteProfile(): Promise<boolean>;
  getHealthTarget(profileId?: string): Promise<ProfileHealthTarget | undefined>;
  upsertHealthTarget(input: UpsertProfileHealthTargetInput): Promise<ProfileHealthTarget>;
  signUpWithEmail(input: { email: string; password: string }): Promise<AccountSession>;
  loginWithEmail(input: { email: string; password: string }): Promise<AccountSession>;
  requestPasswordReset(input: { email: string }): Promise<PasswordResetRequest | undefined>;
  resetPasswordWithCode(input: {
    email: string;
    code: string;
    password: string;
  }): Promise<AccountSession>;
  signInWithOAuth(input: OAuthAccountInput): Promise<AccountSession>;
  revokeSession(token: string): Promise<void>;
  searchFoods(query: string): Promise<FoodSearchResult[]>;
  getFood(foodId: string): Promise<FoodRecord | undefined>;
  getQuota(): Promise<ScanCreditState>;
  getSubscriptionStatus(): Promise<SubscriptionStatusState>;
  upsertSubscriptionEntitlement(
    input: UpsertSubscriptionEntitlementInput,
  ): Promise<SubscriptionStatusState>;
  recordSubscriptionEvent(input: RecordSubscriptionEventInput): Promise<boolean>;
  getRewardedAdProgress(dailyScanLimit?: number): Promise<RewardedAdProgressState>;
  consumeCredit(reason: "free" | "rewarded" | "premium"): Promise<ScanCreditState>;
  recordRewardedAdServerVerification(
    input: RewardedAdServerVerificationInput,
  ): Promise<RewardedAdServerVerification>;
  findRewardedAdServerVerification(input: {
    profileId: string;
    customData: string;
  }): Promise<RewardedAdServerVerification | undefined>;
  completeRewardedAd(
    input: RewardedAdCompletionInput,
    dailyScanLimit?: number,
  ): Promise<RewardedAdCreditResult>;
  registerPushToken(input: PushTokenRegistrationInput): Promise<PushTokenRegistrationResult>;
  createMeal(input: CreateMealInput): Promise<MealSummary>;
  attachMealImage(mealId: string, input: AttachMealImageInput): Promise<MealSummary | undefined>;
  learnFoodsFromConfirmedScan(input: LearnFoodsFromConfirmedScanInput): Promise<void>;
  updateMeal(mealId: string, input: UpdateMealInput): Promise<MealSummary | undefined>;
  listMeals(input?: ListMealsInput): Promise<MealSummary[]>;
  summarizeMealsByDate(input?: ListMealsInput): Promise<DailyMealAggregate[]>;
  listMealDates(): Promise<string[]>;
  getMeal(mealId: string): Promise<MealSummary | undefined>;
  getMealDeletionPlan(mealId: string): Promise<MealDeletionPlan | undefined>;
  deleteMeal(mealId: string): Promise<boolean>;
  prepareScan(profileId?: string): Promise<ScanSession>;
  getScan(scanId: string): Promise<ScanSession | undefined>;
  updateScan(scan: ScanSession): Promise<void>;
  findScanAnalysisCache(input: {
    profileId: string;
    imageHash: string;
    hashAlgorithm: "sha256:v1";
  }): Promise<ScanAnalysisCacheRecord | undefined>;
  upsertScanAnalysisCache(input: UpsertScanAnalysisCacheInput): Promise<ScanAnalysisCacheRecord>;
  countNoFoodScanAttemptsSince(sinceIso: string): Promise<number>;
  getIdempotent(key: string): Promise<IdempotencyRecord | undefined>;
  setIdempotent(key: string, record: Omit<IdempotencyRecord, "createdAt">): Promise<void>;
  getAiPrompt(key: string): Promise<string | undefined>;

  // Chat
  countChatSessionsToday(profileId: string): Promise<number>;
  createChatSession(input: {
    profileId: string;
    maxTurns: number;
    contextSnapshot: unknown;
  }): Promise<{ id: string; sessionDate: string; createdAt: string }>;
  closeChatSession(sessionId: string, turnCount: number): Promise<void>;
  appendChatMessage(input: {
    sessionId: string;
    role: "system" | "user" | "assistant";
    content: string;
    turnNumber: number;
    inputTokens?: number;
    outputTokens?: number;
    latencyMs?: number;
  }): Promise<void>;
  getChatHistory(sessionId: string): Promise<
    | {
        messages: Array<{ role: string; content: string; createdAt: string }>;
        turnCount: number;
        maxTurns: number;
        createdAt: string;
      }
    | undefined
  >;
  listChatSessions(
    profileId: string,
    limit?: number,
  ): Promise<
    Array<{
      id: string;
      turnCount: number;
      createdAt: string;
      closedAt?: string;
    }>
  >;
}
