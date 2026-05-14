import type {
  FoodRecord,
  FoodSearchResult,
  MealItemNutrition,
  MealSummary,
  ScanCreditState,
} from "@dfit/domain";
import type { AiProviderRunMetadata } from "../services/ai-provider.js";

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

export type ListMealsInput = {
  fromDate?: string;
  toDate?: string;
  limit?: number;
};

export interface AppRepository {
  getProfile(): Promise<Profile>;
  signUpWithEmail(input: { email: string; password: string }): Promise<AccountSession>;
  loginWithEmail(input: { email: string; password: string }): Promise<AccountSession>;
  revokeSession(token: string): Promise<void>;
  searchFoods(query: string): Promise<FoodSearchResult[]>;
  getFood(foodId: string): Promise<FoodRecord | undefined>;
  getQuota(): Promise<ScanCreditState>;
  consumeCredit(reason: "free" | "rewarded" | "premium"): Promise<ScanCreditState>;
  createMeal(input: CreateMealInput): Promise<MealSummary>;
  listMeals(input?: ListMealsInput): Promise<MealSummary[]>;
  getMeal(mealId: string): Promise<MealSummary | undefined>;
  deleteMeal(mealId: string): Promise<boolean>;
  prepareScan(profileId?: string): Promise<ScanSession>;
  getScan(scanId: string): Promise<ScanSession | undefined>;
  updateScan(scan: ScanSession): Promise<void>;
  getIdempotent(key: string): Promise<IdempotencyRecord | undefined>;
  setIdempotent(key: string, record: Omit<IdempotencyRecord, "createdAt">): Promise<void>;
}
