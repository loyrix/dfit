import { randomUUID } from "node:crypto";
import {
  createMealSummary,
  findFoodById,
  searchFoods,
  type MealSummary,
  type ScanCreditState,
} from "@dfit/domain";
import type {
  AccountSession,
  AccountAuthError,
  AppRepository,
  CreateMealInput,
  IdempotencyRecord,
  ListMealsInput,
  Profile,
  ScanSession,
} from "./app-repository.js";
import { currentRequestIdentity } from "../request-context.js";
import { AccountAuthError as AuthError } from "./app-repository.js";

export class InMemoryStore implements AppRepository {
  readonly defaultProfile: Profile = {
    id: "profile_demo",
    authMethod: "anonymous",
    timezone: "Asia/Kolkata",
    createdAt: new Date().toISOString(),
  };

  private readonly profiles = new Map<string, Profile>([
    [this.defaultProfile.id, this.defaultProfile],
  ]);
  private readonly installProfiles = new Map<string, string>();
  private readonly credentials = new Map<string, { profileId: string; password: string }>();
  private readonly sessions = new Map<string, string>();
  private readonly meals = new Map<string, MealSummary>();
  private readonly mealProfiles = new Map<string, string>();
  private readonly scans = new Map<string, ScanSession>();
  private readonly idempotency = new Map<string, IdempotencyRecord>();
  private readonly quotas = new Map<string, ScanCreditState>();

  async getProfile(): Promise<Profile> {
    const identity = currentRequestIdentity();
    if (identity.sessionToken) {
      const profileId = this.sessions.get(identity.sessionToken);
      const profile = profileId ? this.profiles.get(profileId) : undefined;
      if (profile) {
        this.bindInstall(identity.installId, profile.id);
        return profile;
      }
    }

    if (identity.installId) {
      const profileId = this.installProfiles.get(identity.installId);
      if (profileId) return this.profiles.get(profileId) ?? this.defaultProfile;

      const profile = this.createAnonymousProfile();
      this.installProfiles.set(identity.installId, profile.id);
      return profile;
    }

    return this.defaultProfile;
  }

  async signUpWithEmail(input: { email: string; password: string }): Promise<AccountSession> {
    const email = normalizeEmail(input.email);
    if (this.credentials.has(email)) {
      throw new AuthError("email_already_registered", "Email already registered.", 409);
    }

    const profile = await this.getProfile();
    const linkedProfile =
      profile.authMethod === "anonymous"
        ? {
            ...profile,
            authMethod: "email" as const,
            email,
            linkedAt: new Date().toISOString(),
          }
        : this.createAccountProfile(email);

    this.profiles.set(linkedProfile.id, linkedProfile);
    this.credentials.set(email, { profileId: linkedProfile.id, password: input.password });
    return this.createSession(linkedProfile);
  }

  async loginWithEmail(input: { email: string; password: string }): Promise<AccountSession> {
    const email = normalizeEmail(input.email);
    const credential = this.credentials.get(email);
    if (!credential || credential.password !== input.password) {
      throw new AuthError("invalid_credentials", "Invalid credentials.", 401);
    }

    const accountProfile = this.profiles.get(credential.profileId);
    if (!accountProfile) throw new AuthError("invalid_credentials", "Invalid credentials.", 401);

    const currentProfile = await this.getProfile();
    if (currentProfile.authMethod === "anonymous" && currentProfile.id !== accountProfile.id) {
      this.mergeProfiles(currentProfile.id, accountProfile.id);
    }

    this.bindInstall(currentRequestIdentity().installId, accountProfile.id);
    return this.createSession(accountProfile);
  }

  async revokeSession(token: string): Promise<void> {
    this.sessions.delete(token);
    const installId = currentRequestIdentity().installId;
    if (installId) {
      const profile = this.createAnonymousProfile();
      this.installProfiles.set(installId, profile.id);
    }
  }

  async searchFoods(query: string) {
    return searchFoods(query);
  }

  async getFood(foodId: string) {
    return findFoodById(foodId);
  }

  async getQuota() {
    return { ...this.quotaFor((await this.getProfile()).id) };
  }

  async consumeCredit(reason: "free" | "rewarded" | "premium") {
    const quota = this.quotaFor((await this.getProfile()).id);
    if (reason === "free" && quota.freeRemaining > 0) quota.freeRemaining -= 1;
    else if (reason === "rewarded" && quota.rewardedRemaining > 0) quota.rewardedRemaining -= 1;
    else if (reason === "premium" && quota.premiumRemaining > 0) quota.premiumRemaining -= 1;
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
    this.mealProfiles.set(meal.mealId, input.profileId ?? (await this.getProfile()).id);
    return meal;
  }

  async listMeals(input: ListMealsInput = {}) {
    const profile = await this.getProfile();
    return [...this.meals.values()]
      .filter((meal) => {
        if (this.mealProfiles.get(meal.mealId) !== profile.id) return false;
        const localDate = meal.loggedAt.slice(0, 10);
        if (input.fromDate && localDate < input.fromDate) return false;
        if (input.toDate && localDate > input.toDate) return false;
        return true;
      })
      .sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime())
      .slice(0, input.limit ?? 100);
  }

  async listMealDates() {
    const profile = await this.getProfile();
    return [...new Set(
      [...this.meals.values()]
        .filter((meal) => this.mealProfiles.get(meal.mealId) === profile.id)
        .map((meal) => meal.loggedAt.slice(0, 10)),
    )].sort((a, b) => b.localeCompare(a));
  }

  async getMeal(mealId: string) {
    const profile = await this.getProfile();
    if (this.mealProfiles.get(mealId) !== profile.id) return undefined;
    return this.meals.get(mealId);
  }

  async deleteMeal(mealId: string) {
    const profile = await this.getProfile();
    if (this.mealProfiles.get(mealId) !== profile.id) return false;
    return this.meals.delete(mealId);
  }

  async prepareScan(profileId?: string) {
    const profile = await this.getProfile();
    const scan: ScanSession = {
      id: randomUUID(),
      profileId: profileId ?? profile.id,
      status: "prepared",
      createdAt: new Date().toISOString(),
    };
    this.scans.set(scan.id, scan);
    return scan;
  }

  async getScan(scanId: string) {
    const profile = await this.getProfile();
    const scan = this.scans.get(scanId);
    return scan?.profileId === profile.id ? scan : undefined;
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

  private quotaFor(profileId: string): ScanCreditState {
    const existing = this.quotas.get(profileId);
    if (existing) return existing;
    const created = {
      freeRemaining: 1,
      rewardedRemaining: 2,
      premiumRemaining: 0,
    };
    this.quotas.set(profileId, created);
    return created;
  }

  private createAnonymousProfile(): Profile {
    const profile = {
      id: `profile_${randomUUID()}`,
      authMethod: "anonymous" as const,
      timezone: currentRequestIdentity().timezone ?? "Asia/Kolkata",
      createdAt: new Date().toISOString(),
    };
    this.profiles.set(profile.id, profile);
    return profile;
  }

  private createAccountProfile(email: string): Profile {
    const profile = {
      id: `profile_${randomUUID()}`,
      authMethod: "email" as const,
      email,
      timezone: currentRequestIdentity().timezone ?? "Asia/Kolkata",
      linkedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    this.profiles.set(profile.id, profile);
    return profile;
  }

  private createSession(profile: Profile): AccountSession {
    const accessToken = `test_${randomUUID()}`;
    this.sessions.set(accessToken, profile.id);
    return {
      profile,
      accessToken,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };
  }

  private bindInstall(installId: string | undefined, profileId: string): void {
    if (!installId) return;
    this.installProfiles.set(installId, profileId);
  }

  private mergeProfiles(sourceProfileId: string, targetProfileId: string): void {
    for (const [mealId, profileId] of this.mealProfiles) {
      if (profileId === sourceProfileId) this.mealProfiles.set(mealId, targetProfileId);
    }
    for (const scan of this.scans.values()) {
      if (scan.profileId === sourceProfileId) scan.profileId = targetProfileId;
    }
    const sourceQuota = this.quotas.get(sourceProfileId);
    if (sourceQuota) {
      const targetQuota = this.quotaFor(targetProfileId);
      targetQuota.freeRemaining = Math.max(targetQuota.freeRemaining, sourceQuota.freeRemaining);
      targetQuota.rewardedRemaining = Math.max(
        targetQuota.rewardedRemaining,
        sourceQuota.rewardedRemaining,
      );
      targetQuota.premiumRemaining = Math.max(
        targetQuota.premiumRemaining,
        sourceQuota.premiumRemaining,
      );
    }
    for (const [installId, profileId] of this.installProfiles) {
      if (profileId === sourceProfileId) this.installProfiles.set(installId, targetProfileId);
    }
  }
}

export const store = new InMemoryStore();

const normalizeEmail = (email: string): string => email.trim().toLowerCase();
