import { randomUUID } from "node:crypto";
import {
  calculateRewardedAdState,
  createMealSummary,
  findFoodById,
  rewardedAdsPerScan,
  rewardedDailyScanLimit,
  searchFoods,
  sumTotals,
  type MealSummary,
  type ScanCreditState,
} from "@logmyplate/domain";
import type {
  AccountSession,
  AccountAuthError,
  AppRepository,
  AttachMealImageInput,
  CreateMealInput,
  IdempotencyRecord,
  ListMealsInput,
  MealDeletionPlan,
  Profile,
  ProfileDeletionPlan,
  ProfileHealthTarget,
  RewardedAdCompletionInput,
  RewardedAdCreditResult,
  RewardedAdProgressState,
  ScanSession,
  UpdateMealInput,
  UpsertProfileHealthTargetInput,
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
  private readonly deactivatedProfiles = new Set<string>();
  private readonly installProfiles = new Map<string, string>();
  private readonly credentials = new Map<string, { profileId: string; password: string }>();
  private readonly sessions = new Map<string, string>();
  private readonly healthTargets = new Map<string, ProfileHealthTarget>();
  private readonly meals = new Map<string, MealSummary>();
  private readonly mealProfiles = new Map<string, string>();
  private readonly mealScanSessions = new Map<string, string>();
  private readonly scans = new Map<string, ScanSession>();
  private readonly idempotency = new Map<string, IdempotencyRecord>();
  private readonly quotas = new Map<string, ScanCreditState>();
  private readonly rewardedAdProgress = new Map<
    string,
    { completedAds: number; grantedScans: number }
  >();

  async getProfile(): Promise<Profile> {
    const identity = currentRequestIdentity();
    if (identity.sessionToken) {
      const profileId = this.sessions.get(identity.sessionToken);
      const profile = profileId ? this.profiles.get(profileId) : undefined;
      if (profile && !this.deactivatedProfiles.has(profile.id)) {
        this.bindInstall(identity.installId, profile.id);
        return profile;
      }
    }

    if (identity.installId) {
      const profileId = this.installProfiles.get(identity.installId);
      const profile = profileId ? this.profiles.get(profileId) : undefined;
      if (profile?.authMethod === "anonymous" && !this.deactivatedProfiles.has(profile.id)) {
        return profile;
      }

      const anonymousProfile = this.createAnonymousProfile();
      this.installProfiles.set(identity.installId, anonymousProfile.id);
      this.resetInstallQuotaForAnonymous(identity.installId);
      return anonymousProfile;
    }

    return this.defaultProfile;
  }

  async getHealthTarget(profileId?: string): Promise<ProfileHealthTarget | undefined> {
    const owner = profileId ?? (await this.getProfile()).id;
    const target = this.healthTargets.get(owner);
    return target ? { ...target } : undefined;
  }

  async upsertHealthTarget(input: UpsertProfileHealthTargetInput): Promise<ProfileHealthTarget> {
    const profile = await this.getProfile();
    if (profile.authMethod === "anonymous") {
      throw new AuthError("account_required", "Create an account to save a daily target.", 401);
    }

    const now = new Date().toISOString();
    const existing = this.healthTargets.get(profile.id);
    const target: ProfileHealthTarget = {
      profileId: profile.id,
      ...input,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    this.healthTargets.set(profile.id, target);
    return { ...target };
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
    this.transferCurrentInstallQuotaToProfile(linkedProfile.id);
    return this.createSession(linkedProfile);
  }

  async loginWithEmail(input: { email: string; password: string }): Promise<AccountSession> {
    const email = normalizeEmail(input.email);
    const credential = this.credentials.get(email);
    if (!credential) {
      throw new AuthError("account_not_found", "User does not exist.", 404);
    }
    if (credential.password !== input.password) {
      throw new AuthError("invalid_credentials", "Invalid credentials.", 401);
    }

    const accountProfile = this.profiles.get(credential.profileId);
    if (!accountProfile) throw new AuthError("account_not_found", "User does not exist.", 404);
    if (this.deactivatedProfiles.has(accountProfile.id)) {
      throw new AuthError(
        "account_deactivated",
        "This profile is deactivated. Contact support to reactivate it.",
        403,
      );
    }

    const currentProfile = await this.getProfile();
    if (currentProfile.authMethod === "anonymous" && currentProfile.id !== accountProfile.id) {
      this.mergeProfiles(currentProfile.id, accountProfile.id);
    }

    this.bindInstall(currentRequestIdentity().installId, accountProfile.id);
    this.transferCurrentInstallQuotaToProfile(accountProfile.id);
    return this.createSession(accountProfile);
  }

  async revokeSession(token: string): Promise<void> {
    this.sessions.delete(token);
    const installId = currentRequestIdentity().installId;
    if (installId) {
      const profile = this.createAnonymousProfile();
      this.installProfiles.set(installId, profile.id);
      this.resetInstallQuotaForAnonymous(installId);
    }
  }

  async deactivateProfile(): Promise<boolean> {
    const profile = await this.requireActiveAccountProfile();
    this.deactivatedProfiles.add(profile.id);
    for (const [token, profileId] of this.sessions) {
      if (profileId === profile.id) this.sessions.delete(token);
    }
    for (const [installId, profileId] of this.installProfiles) {
      if (profileId === profile.id) this.resetInstallToAnonymous(installId);
    }
    this.resetCurrentInstallToAnonymous();
    return true;
  }

  async getProfileDeletionPlan(): Promise<ProfileDeletionPlan> {
    const profile = await this.requireActiveAccountProfile();
    const storedObjects = new Map<string, { bucket: string; objectKey: string }>();

    for (const [mealId, profileId] of this.mealProfiles) {
      if (profileId !== profile.id) continue;
      const image = this.meals.get(mealId)?.image;
      if (image) storedObjects.set(`${image.bucket}\0${image.objectKey}`, image);
    }

    for (const scan of this.scans.values()) {
      if (scan.profileId !== profile.id || !scan.imageBucket || !scan.imageObjectKey) continue;
      storedObjects.set(`${scan.imageBucket}\0${scan.imageObjectKey}`, {
        bucket: scan.imageBucket,
        objectKey: scan.imageObjectKey,
      });
    }

    return {
      profileId: profile.id,
      storedObjects: [...storedObjects.values()],
    };
  }

  async deleteProfile(): Promise<boolean> {
    const profile = await this.requireActiveAccountProfile();
    for (const [email, credential] of this.credentials) {
      if (credential.profileId === profile.id) this.credentials.delete(email);
    }
    for (const [token, profileId] of this.sessions) {
      if (profileId === profile.id) this.sessions.delete(token);
    }
    for (const [mealId, profileId] of this.mealProfiles) {
      if (profileId !== profile.id) continue;
      this.meals.delete(mealId);
      this.mealProfiles.delete(mealId);
      this.mealScanSessions.delete(mealId);
    }
    for (const [scanId, scan] of this.scans) {
      if (scan.profileId === profile.id) this.scans.delete(scanId);
    }
    for (const [installId, profileId] of this.installProfiles) {
      if (profileId === profile.id) this.resetInstallToAnonymous(installId);
    }
    this.healthTargets.delete(profile.id);
    this.quotas.delete(this.profileQuotaKey(profile.id));
    this.profiles.delete(profile.id);
    this.deactivatedProfiles.delete(profile.id);
    this.resetCurrentInstallToAnonymous();
    return true;
  }

  async searchFoods(query: string) {
    return searchFoods(query);
  }

  async getFood(foodId: string) {
    return findFoodById(foodId);
  }

  async getQuota() {
    return { ...this.quotaFor(await this.getProfile()) };
  }

  async getRewardedAdProgress(): Promise<RewardedAdProgressState> {
    const profile = await this.getProfile();
    const today = new Date().toISOString().slice(0, 10);
    const progressKey = `${this.quotaKey(profile)}:${today}`;
    const progress = this.rewardedAdProgress.get(progressKey) ?? {
      completedAds: 0,
      grantedScans: 0,
    };
    const state = calculateRewardedAdState(progress);

    return {
      adsWatchedToday: progress.completedAds,
      adsNeededForNextScan: state.adsNeededForNextScan,
      scansGrantedToday: progress.grantedScans,
      dailyScanLimit: rewardedDailyScanLimit,
      adsPerScan: rewardedAdsPerScan,
    };
  }

  async consumeCredit(reason: "free" | "rewarded" | "premium") {
    const quota = this.quotaFor(await this.getProfile());
    if (reason === "free" && quota.freeRemaining > 0) quota.freeRemaining -= 1;
    else if (reason === "rewarded" && quota.rewardedRemaining > 0) quota.rewardedRemaining -= 1;
    else if (reason === "premium" && quota.premiumRemaining > 0) quota.premiumRemaining -= 1;
    else throw new Error(`No ${reason} scan credit remaining`);

    return this.getQuota();
  }

  async completeRewardedAd(_input: RewardedAdCompletionInput): Promise<RewardedAdCreditResult> {
    const profile = await this.getProfile();
    const quota = this.quotaFor(profile);
    const today = new Date().toISOString().slice(0, 10);
    const progressKey = `${this.quotaKey(profile)}:${today}`;
    const progress = this.rewardedAdProgress.get(progressKey) ?? {
      completedAds: 0,
      grantedScans: 0,
    };

    progress.completedAds += 1;
    const state = calculateRewardedAdState(progress);
    const grantableScans = Math.min(state.grantableScans, 1);
    if (grantableScans > 0) {
      progress.grantedScans += grantableScans;
      quota.rewardedRemaining += grantableScans;
    }

    this.rewardedAdProgress.set(progressKey, progress);

    return {
      grantedScan: grantableScans > 0,
      ...(await this.getRewardedAdProgress()),
      quota: { ...quota },
    };
  }

  async createMeal(input: CreateMealInput) {
    const meal = createMealSummary({
      mealId: randomUUID(),
      mealType: input.mealType,
      title: input.title,
      loggedAt: input.loggedAt ?? new Date().toISOString(),
      items: input.items.map((item) => ({
        ...item,
      })),
    });

    this.meals.set(meal.mealId, meal);
    this.mealProfiles.set(meal.mealId, input.profileId ?? (await this.getProfile()).id);
    if (input.scanSessionId) this.mealScanSessions.set(meal.mealId, input.scanSessionId);
    return meal;
  }

  async attachMealImage(mealId: string, input: AttachMealImageInput) {
    const existing = await this.getMeal(mealId);
    if (!existing) return undefined;

    const meal = {
      ...existing,
      image: {
        imageId: randomUUID(),
        ...input,
        createdAt: new Date().toISOString(),
      },
    };
    this.meals.set(mealId, meal);
    return meal;
  }

  async updateMeal(mealId: string, input: UpdateMealInput) {
    const existing = await this.getMeal(mealId);
    if (!existing) return undefined;

    const meal = createMealSummary({
      mealId: existing.mealId,
      mealType: input.mealType,
      title: input.title,
      loggedAt: existing.loggedAt,
      items: input.items.map((item) => ({
        ...item,
      })),
      image: existing.image,
    });

    this.meals.set(mealId, meal);
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

  async summarizeMealsByDate(input: ListMealsInput = {}) {
    const meals = await this.listMeals(input);
    const mealsByDate = new Map<string, MealSummary[]>();
    for (const meal of meals) {
      const date = meal.loggedAt.slice(0, 10);
      mealsByDate.set(date, [...(mealsByDate.get(date) ?? []), meal]);
    }

    return [...mealsByDate.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([date, dayMeals]) => ({
        date,
        mealCount: dayMeals.length,
        totals: sumTotals(dayMeals.map((meal) => meal.totals)),
      }));
  }

  async listMealDates() {
    const profile = await this.getProfile();
    return [
      ...new Set(
        [...this.meals.values()]
          .filter((meal) => this.mealProfiles.get(meal.mealId) === profile.id)
          .map((meal) => meal.loggedAt.slice(0, 10)),
      ),
    ].sort((a, b) => b.localeCompare(a));
  }

  async getMeal(mealId: string) {
    const profile = await this.getProfile();
    if (this.mealProfiles.get(mealId) !== profile.id) return undefined;
    return this.meals.get(mealId);
  }

  async getMealDeletionPlan(mealId: string): Promise<MealDeletionPlan | undefined> {
    const meal = await this.getMeal(mealId);
    if (!meal) return undefined;
    return {
      mealId,
      image: meal.image,
      scanSessionId: this.mealScanSessions.get(mealId),
    };
  }

  async deleteMeal(mealId: string) {
    const profile = await this.getProfile();
    if (this.mealProfiles.get(mealId) !== profile.id) return false;
    const scanSessionId = this.mealScanSessions.get(mealId);
    this.mealProfiles.delete(mealId);
    this.mealScanSessions.delete(mealId);
    if (scanSessionId) this.scans.delete(scanSessionId);
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

  private quotaFor(profile: Profile): ScanCreditState {
    const key = this.quotaKey(profile);
    const existing = this.quotas.get(key);
    if (existing) return existing;
    const created = {
      freeRemaining: 3,
      rewardedRemaining: 0,
      premiumRemaining: 0,
    };
    this.quotas.set(key, created);
    return created;
  }

  private quotaKey(profile: Profile): string {
    const installId = currentRequestIdentity().installId;
    return profile.authMethod === "anonymous" && installId
      ? this.installQuotaKey(installId)
      : this.profileQuotaKey(profile.id);
  }

  private installQuotaKey(installId: string): string {
    return `install:${installId}`;
  }

  private profileQuotaKey(profileId: string): string {
    return `profile:${profileId}`;
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

  private async requireActiveAccountProfile(): Promise<Profile> {
    const token = currentRequestIdentity().sessionToken;
    const profileId = token ? this.sessions.get(token) : undefined;
    const profile = profileId ? this.profiles.get(profileId) : undefined;
    if (
      !profile ||
      profile.authMethod === "anonymous" ||
      this.deactivatedProfiles.has(profile.id)
    ) {
      throw new AuthError("account_required", "Log in to manage your profile.", 401);
    }
    return profile;
  }

  private resetCurrentInstallToAnonymous(): void {
    const installId = currentRequestIdentity().installId;
    if (installId) this.resetInstallToAnonymous(installId);
  }

  private resetInstallToAnonymous(installId: string): void {
    const profile = this.createAnonymousProfile();
    this.installProfiles.set(installId, profile.id);
    this.resetInstallQuotaForAnonymous(installId);
  }

  private mergeProfiles(sourceProfileId: string, targetProfileId: string): void {
    for (const [mealId, profileId] of this.mealProfiles) {
      if (profileId === sourceProfileId) this.mealProfiles.set(mealId, targetProfileId);
    }
    for (const scan of this.scans.values()) {
      if (scan.profileId === sourceProfileId) scan.profileId = targetProfileId;
    }
    const sourceQuota = this.quotas.get(this.profileQuotaKey(sourceProfileId));
    if (sourceQuota) {
      const targetProfile = this.profiles.get(targetProfileId);
      if (!targetProfile) return;
      const targetQuota = this.quotaFor(targetProfile);
      targetQuota.freeRemaining = Math.min(targetQuota.freeRemaining, sourceQuota.freeRemaining);
      targetQuota.rewardedRemaining = Math.min(
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

  private transferCurrentInstallQuotaToProfile(profileId: string): void {
    const installId = currentRequestIdentity().installId;
    if (!installId) return;

    const installKey = this.installQuotaKey(installId);
    const installQuota = this.quotas.get(installKey);
    if (!installQuota) {
      if (!this.quotas.has(this.profileQuotaKey(profileId))) {
        this.quotas.set(this.profileQuotaKey(profileId), {
          freeRemaining: 3,
          rewardedRemaining: 0,
          premiumRemaining: 0,
        });
      }
      return;
    }

    const profile = this.profiles.get(profileId);
    if (!profile) return;
    const profileQuota = this.quotaFor(profile);
    profileQuota.freeRemaining = Math.min(profileQuota.freeRemaining, installQuota.freeRemaining);
    profileQuota.rewardedRemaining += installQuota.rewardedRemaining;
    profileQuota.premiumRemaining = Math.max(
      profileQuota.premiumRemaining,
      installQuota.premiumRemaining,
    );

    installQuota.freeRemaining = 0;
    installQuota.rewardedRemaining = 0;
    installQuota.premiumRemaining = 0;
  }

  private resetInstallQuotaForAnonymous(installId: string): void {
    const key = this.installQuotaKey(installId);
    const quota =
      this.quotas.get(key) ??
      ({
        freeRemaining: 3,
        rewardedRemaining: 0,
        premiumRemaining: 0,
      } satisfies ScanCreditState);
    quota.rewardedRemaining = 0;
    quota.premiumRemaining = 0;
    this.quotas.set(key, quota);
  }
}

export const store = new InMemoryStore();

const normalizeEmail = (email: string): string => email.trim().toLowerCase();
