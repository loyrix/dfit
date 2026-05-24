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
  status: "prepared" | "analyzing" | "ready_for_review" | "confirmed" | "cancelled" | "failed";
  creditReason?: "free" | "rewarded" | "premium";
  analyzedResponse?: unknown;
  aiProviderRun?: AiProviderRunMetadata;
  userHint?: string;
  imageMimeType?: string;
  imageByteSize?: number;
  imageBucket?: string;
  imageObjectKey?: string;
  createdAt: string;
};

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

export type AttachMealImageInput = Omit<MealImageSummary, "imageId" | "createdAt">;

export type MealDeletionPlan = {
  mealId: string;
  image?: MealImageSummary;
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
  revokeSession(token: string): Promise<void>;
  searchFoods(query: string): Promise<FoodSearchResult[]>;
  getFood(foodId: string): Promise<FoodRecord | undefined>;
  getQuota(): Promise<ScanCreditState>;
  getRewardedAdProgress(): Promise<RewardedAdProgressState>;
  consumeCredit(reason: "free" | "rewarded" | "premium"): Promise<ScanCreditState>;
  completeRewardedAd(input: RewardedAdCompletionInput): Promise<RewardedAdCreditResult>;
  createMeal(input: CreateMealInput): Promise<MealSummary>;
  attachMealImage(mealId: string, input: AttachMealImageInput): Promise<MealSummary | undefined>;
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
  countNoFoodScanAttemptsSince(sinceIso: string): Promise<number>;
  getIdempotent(key: string): Promise<IdempotencyRecord | undefined>;
  setIdempotent(key: string, record: Omit<IdempotencyRecord, "createdAt">): Promise<void>;
}
