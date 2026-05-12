import { randomUUID } from "node:crypto";
import {
  createMealSummary,
  findFoodById,
  searchFoods,
  type MealSummary,
  type ScanCreditState,
} from "@dfit/domain";
import type {
  AppRepository,
  CreateMealInput,
  IdempotencyRecord,
  ListMealsInput,
  Profile,
  ScanSession,
} from "./app-repository.js";

export class InMemoryStore implements AppRepository {
  readonly defaultProfile: Profile = {
    id: "profile_demo",
    authMethod: "anonymous",
    timezone: "Asia/Kolkata",
    createdAt: new Date().toISOString(),
  };

  private readonly meals = new Map<string, MealSummary>();
  private readonly scans = new Map<string, ScanSession>();
  private readonly idempotency = new Map<string, IdempotencyRecord>();
  private quota: ScanCreditState = {
    freeRemaining: 1,
    rewardedRemaining: 2,
    premiumRemaining: 0,
  };

  async getProfile(): Promise<Profile> {
    return this.defaultProfile;
  }

  async searchFoods(query: string) {
    return searchFoods(query);
  }

  async getFood(foodId: string) {
    return findFoodById(foodId);
  }

  async getQuota() {
    return { ...this.quota };
  }

  async consumeCredit(reason: "free" | "rewarded" | "premium") {
    if (reason === "free" && this.quota.freeRemaining > 0) this.quota.freeRemaining -= 1;
    else if (reason === "rewarded" && this.quota.rewardedRemaining > 0)
      this.quota.rewardedRemaining -= 1;
    else if (reason === "premium" && this.quota.premiumRemaining > 0)
      this.quota.premiumRemaining -= 1;
    else throw new Error(`No ${reason} scan credit remaining`);

    return this.getQuota();
  }

  async createMeal(input: CreateMealInput) {
    const meal = createMealSummary({
      mealId: randomUUID(),
      mealType: input.mealType,
      title: input.title,
      loggedAt: input.loggedAt ?? new Date().toISOString(),
      items: input.items.map((item) => ({
        ...item,
        foodId: item.foodId ?? randomUUID(),
      })),
    });

    this.meals.set(meal.mealId, meal);
    return meal;
  }

  async listMeals(input: ListMealsInput = {}) {
    return [...this.meals.values()]
      .filter((meal) => {
        const localDate = meal.loggedAt.slice(0, 10);
        if (input.fromDate && localDate < input.fromDate) return false;
        if (input.toDate && localDate > input.toDate) return false;
        return true;
      })
      .sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime())
      .slice(0, input.limit ?? 100);
  }

  async getMeal(mealId: string) {
    return this.meals.get(mealId);
  }

  async deleteMeal(mealId: string) {
    return this.meals.delete(mealId);
  }

  async prepareScan(profileId = this.defaultProfile.id) {
    const scan: ScanSession = {
      id: randomUUID(),
      profileId,
      status: "prepared",
      createdAt: new Date().toISOString(),
    };
    this.scans.set(scan.id, scan);
    return scan;
  }

  async getScan(scanId: string) {
    return this.scans.get(scanId);
  }

  async updateScan(scan: ScanSession) {
    this.scans.set(scan.id, scan);
  }

  async getIdempotent(key: string) {
    return this.idempotency.get(key);
  }

  async setIdempotent(key: string, record: Omit<IdempotencyRecord, "createdAt">) {
    this.idempotency.set(key, {
      ...record,
      createdAt: Date.now(),
    });
  }
}

export const store = new InMemoryStore();
