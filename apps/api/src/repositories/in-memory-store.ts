import { randomUUID } from "node:crypto";
import {
  calculateRewardedAdState,
  createMealSummary,
  findFoodById,
  rewardedAdsPerScan,
  rewardedDailyScanLimit,
  searchFoods,
  seedFoods,
  sumTotals,
  type FoodRecord,
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
  OAuthAccountInput,
  Profile,
  ProfileDeletionPlan,
  ProfileHealthTarget,
  PushTokenRegistrationInput,
  PushTokenRegistrationResult,
  RecordSubscriptionEventInput,
  RewardedAdCompletionInput,
  RewardedAdCreditResult,
  RewardedAdProgressState,
  RewardedAdServerVerification,
  RewardedAdServerVerificationInput,
  ScanAnalysisCacheRecord,
  ScanSession,
  SubscriptionStatusState,
  UpdateMealInput,
  LearnFoodsFromConfirmedScanInput,
  UpsertSubscriptionEntitlementInput,
  UpsertScanAnalysisCacheInput,
  UpsertProfileHealthTargetInput,
} from "./app-repository.js";
import { currentRequestIdentity } from "../request-context.js";
import { AccountAuthError as AuthError } from "./app-repository.js";
import { buildConfirmedScanLearnedFoodCandidates } from "../services/food-learning.js";
import { config } from "../config.js";

type ProfileLifecycleEventType = "deactivated" | "deleted";

const emptySubscriptionUsage = (
  monthlyLimit: number,
  dailyLimit: number,
): SubscriptionStatusState["usage"] => ({
  monthlyLimit,
  dailyLimit,
  usedThisPeriod: 0,
  usedToday: 0,
  remainingThisPeriod: 0,
  remainingToday: 0,
  premiumRemaining: 0,
});

const subscriptionUsage = (
  monthlyLimit: number,
  dailyLimit: number,
  usedThisPeriod: number,
  usedToday: number,
): SubscriptionStatusState["usage"] => {
  const remainingThisPeriod = Math.max(0, monthlyLimit - usedThisPeriod);
  const remainingToday = Math.max(0, dailyLimit - usedToday);
  return {
    monthlyLimit,
    dailyLimit,
    usedThisPeriod,
    usedToday,
    remainingThisPeriod,
    remainingToday,
    premiumRemaining: Math.min(remainingThisPeriod, remainingToday),
  };
};

const subscriptionEntitlementIsActive = (
  entitlement: UpsertSubscriptionEntitlementInput,
): boolean => {
  if (!["active", "cancelled", "billing_issue"].includes(entitlement.status)) return false;
  if (!entitlement.currentPeriodEnd) return true;
  return Date.parse(entitlement.currentPeriodEnd) > Date.now();
};

const subscriptionPeriod = (
  entitlement: UpsertSubscriptionEntitlementInput | undefined,
): { periodStart: string; periodEnd: string } => {
  const now = new Date();
  const start = entitlement?.currentPeriodStart
    ? new Date(entitlement.currentPeriodStart)
    : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = entitlement?.currentPeriodEnd
    ? new Date(entitlement.currentPeriodEnd)
    : new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));
  return {
    periodStart: start.toISOString().slice(0, 10),
    periodEnd: end.toISOString().slice(0, 10),
  };
};

const localDateForTimezone = (timezone: string): string => {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date());
    const year = parts.find((part) => part.type === "year")?.value;
    const month = parts.find((part) => part.type === "month")?.value;
    const day = parts.find((part) => part.type === "day")?.value;
    if (year && month && day) return `${year}-${month}-${day}`;
  } catch {
    // Fall through to UTC when the device sends an invalid timezone.
  }
  return new Date().toISOString().slice(0, 10);
};

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
  private readonly passwordResetCodes = new Map<
    string,
    {
      profileId: string;
      code: string;
      expiresAt: string;
      consumed: boolean;
      attempts: number;
    }
  >();
  private readonly oauthIdentities = new Map<
    string,
    {
      profileId: string;
      email?: string;
      emailVerified?: boolean;
      displayName?: string;
    }
  >();
  private readonly sessions = new Map<string, string>();
  private readonly healthTargets = new Map<string, ProfileHealthTarget>();
  private readonly meals = new Map<string, MealSummary>();
  private readonly foods: FoodRecord[] = seedFoods.map((food) => ({
    ...food,
    aliases: [...food.aliases],
    portions: food.portions.map((portion) => ({ ...portion })),
  }));
  private readonly mealProfiles = new Map<string, string>();
  private readonly mealScanSessions = new Map<string, string>();
  private readonly scans = new Map<string, ScanSession>();
  private readonly scanAnalysisCache = new Map<string, ScanAnalysisCacheRecord>();
  private readonly idempotency = new Map<string, IdempotencyRecord>();
  private readonly quotas = new Map<string, ScanCreditState>();
  private readonly subscriptionEntitlements = new Map<string, UpsertSubscriptionEntitlementInput>();
  private readonly subscriptionEvents = new Set<string>();
  private readonly premiumScanUsage = new Map<string, number>();
  private readonly rewardedAdProgress = new Map<
    string,
    { completedAds: number; grantedScans: number }
  >();
  private readonly rewardedAdServerVerifications = new Map<string, RewardedAdServerVerification>();
  private readonly rewardedAdTransactions = new Set<string>();
  private readonly pushTokens = new Map<string, PushTokenRegistrationResult>();
  private readonly profileLifecycleEvents: Array<{
    profileId: string;
    eventType: ProfileLifecycleEventType;
    actor: string;
    authMethod: Profile["authMethod"];
    email?: string;
    displayName?: string;
    installId?: string;
    platform?: string;
    scanCount: number;
    mealCount: number;
    createdAt: string;
  }> = [];

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
    this.oauthIdentities.set(identityKey("email", email), {
      profileId: linkedProfile.id,
      email,
      emailVerified: true,
    });
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

  async requestPasswordReset(input: { email: string }) {
    const email = normalizeEmail(input.email);
    const profile = [...this.profiles.values()].find(
      (candidate) =>
        candidate.email === email &&
        candidate.authMethod !== "anonymous" &&
        !this.deactivatedProfiles.has(candidate.id),
    );
    if (!profile) return undefined;

    const code = randomPasswordResetCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    this.passwordResetCodes.set(email, {
      profileId: profile.id,
      code,
      expiresAt,
      consumed: false,
      attempts: 0,
    });
    return { email, code, expiresAt };
  }

  async resetPasswordWithCode(input: {
    email: string;
    code: string;
    password: string;
  }): Promise<AccountSession> {
    const email = normalizeEmail(input.email);
    const reset = this.passwordResetCodes.get(email);

    if (
      !reset ||
      reset.consumed ||
      reset.attempts >= 5 ||
      reset.expiresAt <= new Date().toISOString() ||
      input.code.trim() !== reset.code
    ) {
      if (reset) reset.attempts += 1;
      throw new AuthError(
        "invalid_password_reset_code",
        "Password reset code is invalid or expired.",
        400,
      );
    }

    if (input.password.length < 6 || input.password.length > 128) {
      throw new AuthError(
        "invalid_password",
        "Password must be between 6 and 128 characters.",
        400,
      );
    }

    const profile = this.profiles.get(reset.profileId);
    if (!profile || this.deactivatedProfiles.has(profile.id)) {
      throw new AuthError(
        "invalid_password_reset_code",
        "Password reset code is invalid or expired.",
        400,
      );
    }

    reset.consumed = true;
    reset.attempts += 1;
    const linkedProfile = {
      ...profile,
      authMethod: "email" as const,
      email,
      linkedAt: profile.linkedAt ?? new Date().toISOString(),
    };
    this.profiles.set(linkedProfile.id, linkedProfile);
    this.credentials.set(email, { profileId: linkedProfile.id, password: input.password });
    this.oauthIdentities.set(identityKey("email", email), {
      profileId: linkedProfile.id,
      email,
      emailVerified: true,
    });
    for (const [token, profileId] of this.sessions) {
      if (profileId === linkedProfile.id) this.sessions.delete(token);
    }
    this.bindInstall(currentRequestIdentity().installId, linkedProfile.id);
    this.transferCurrentInstallQuotaToProfile(linkedProfile.id);
    return this.createSession(linkedProfile);
  }

  async signInWithOAuth(input: OAuthAccountInput): Promise<AccountSession> {
    const providerSubject = input.providerSubject.trim();
    if (!providerSubject) {
      throw new AuthError("invalid_oauth_identity", "OAuth provider subject is required.");
    }

    const key = identityKey(input.provider, providerSubject);
    const email = input.email ? normalizeEmail(input.email) : undefined;
    const existingIdentity = this.oauthIdentities.get(key);
    const currentProfile = await this.getProfile();

    if (existingIdentity) {
      const accountProfile = this.profiles.get(existingIdentity.profileId);
      if (!accountProfile) throw new AuthError("account_not_found", "User does not exist.", 404);
      if (this.deactivatedProfiles.has(accountProfile.id)) {
        throw new AuthError(
          "account_deactivated",
          "This profile is deactivated. Contact support to reactivate it.",
          403,
        );
      }
      if (currentProfile.authMethod !== "anonymous" && currentProfile.id !== accountProfile.id) {
        throw new AuthError(
          "provider_already_linked",
          "This sign-in provider is already linked to another account.",
          409,
        );
      }
      if (currentProfile.authMethod === "anonymous" && currentProfile.id !== accountProfile.id) {
        this.mergeProfiles(currentProfile.id, accountProfile.id);
      }

      this.oauthIdentities.set(key, {
        ...existingIdentity,
        email: email ?? existingIdentity.email,
        emailVerified: input.emailVerified ?? existingIdentity.emailVerified,
        displayName: input.displayName ?? existingIdentity.displayName,
      });
      this.bindInstall(currentRequestIdentity().installId, accountProfile.id);
      this.transferCurrentInstallQuotaToProfile(accountProfile.id);
      return this.createSession(accountProfile);
    }

    if (email && currentProfile.authMethod === "anonymous") {
      for (const profile of this.profiles.values()) {
        if (profile.email === email && profile.id !== currentProfile.id) {
          throw new AuthError(
            "email_already_registered",
            "Email already registered. Log in first to link this provider.",
            409,
          );
        }
      }
    }

    if (currentProfile.authMethod !== "anonymous") {
      for (const [candidateKey, identity] of this.oauthIdentities) {
        if (!candidateKey.startsWith(`${input.provider}:`)) continue;
        if (identity?.profileId === currentProfile.id) {
          throw new AuthError(
            "provider_already_linked",
            `This account is already linked to a ${input.provider} identity.`,
            409,
          );
        }
      }
    }

    const linkedProfile =
      currentProfile.authMethod === "anonymous"
        ? {
            ...currentProfile,
            authMethod: input.provider,
            email: currentProfile.email ?? email,
            linkedAt: new Date().toISOString(),
          }
        : currentProfile;

    this.profiles.set(linkedProfile.id, linkedProfile);
    this.oauthIdentities.set(key, {
      profileId: linkedProfile.id,
      email,
      emailVerified: input.emailVerified,
      displayName: input.displayName,
    });
    this.bindInstall(currentRequestIdentity().installId, linkedProfile.id);
    this.transferCurrentInstallQuotaToProfile(linkedProfile.id);
    return this.createSession(linkedProfile);
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
    this.recordProfileLifecycleEvent(profile, "deactivated");
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
    this.recordProfileLifecycleEvent(profile, "deleted");
    for (const [email, credential] of this.credentials) {
      if (credential.profileId === profile.id) this.credentials.delete(email);
    }
    for (const [key, identity] of this.oauthIdentities) {
      if (identity.profileId === profile.id) this.oauthIdentities.delete(key);
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
    for (const scan of this.scans.values()) {
      if (scan.profileId === profile.id) this.unlinkScanFromProfile(scan);
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

  private recordProfileLifecycleEvent(
    profile: Profile,
    eventType: ProfileLifecycleEventType,
  ): void {
    const identity = currentRequestIdentity();
    const oauthIdentity = [...this.oauthIdentities.values()].find(
      (candidate) => candidate.profileId === profile.id,
    );
    const scanCount = [...this.scans.values()].filter(
      (scan) => scan.profileId === profile.id,
    ).length;
    const mealCount = [...this.mealProfiles.values()].filter(
      (profileId) => profileId === profile.id,
    ).length;

    this.profileLifecycleEvents.push({
      profileId: profile.id,
      eventType,
      actor: oauthIdentity?.email ?? profile.email ?? oauthIdentity?.displayName ?? profile.id,
      authMethod: profile.authMethod,
      email: oauthIdentity?.email ?? profile.email,
      displayName: oauthIdentity?.displayName,
      installId: identity.installId,
      platform: identity.platform,
      scanCount,
      mealCount,
      createdAt: new Date().toISOString(),
    });
  }

  async searchFoods(query: string) {
    return searchFoods(query, this.foods);
  }

  async getFood(foodId: string) {
    return findFoodById(foodId, this.foods);
  }

  async getQuota() {
    const profile = await this.getProfile();
    const quota = this.quotaFor(profile);
    return {
      ...quota,
      premiumRemaining:
        quota.premiumRemaining + this.subscriptionStatusFor(profile).usage.premiumRemaining,
    };
  }

  async getSubscriptionStatus(): Promise<SubscriptionStatusState> {
    return this.subscriptionStatusFor(await this.getProfile());
  }

  async upsertSubscriptionEntitlement(
    input: UpsertSubscriptionEntitlementInput,
  ): Promise<SubscriptionStatusState> {
    const profile = this.profiles.get(input.appUserId);
    if (!profile) {
      throw new AuthError("profile_not_found", "Subscription profile was not found.", 404);
    }

    this.subscriptionEntitlements.set(profile.id, { ...input });
    return this.subscriptionStatusFor(profile);
  }

  async recordSubscriptionEvent(input: RecordSubscriptionEventInput): Promise<boolean> {
    if (this.subscriptionEvents.has(input.eventId)) return false;
    this.subscriptionEvents.add(input.eventId);
    return true;
  }

  async getRewardedAdProgress(
    dailyScanLimit = rewardedDailyScanLimit,
  ): Promise<RewardedAdProgressState> {
    const profile = await this.getProfile();
    const today = new Date().toISOString().slice(0, 10);
    const progressKey = `${this.quotaKey(profile)}:${today}`;
    const progress = this.rewardedAdProgress.get(progressKey) ?? {
      completedAds: 0,
      grantedScans: 0,
    };
    const state = calculateRewardedAdState({ ...progress, dailyScanLimit });

    return {
      adsWatchedToday: progress.completedAds,
      adsNeededForNextScan: state.adsNeededForNextScan,
      scansGrantedToday: progress.grantedScans,
      dailyScanLimit,
      adsPerScan: rewardedAdsPerScan,
    };
  }

  async consumeCredit(reason: "free" | "rewarded" | "premium") {
    const profile = await this.getProfile();
    const quota = this.quotaFor(profile);
    if (reason === "free" && quota.freeRemaining > 0) quota.freeRemaining -= 1;
    else if (reason === "rewarded" && quota.rewardedRemaining > 0) quota.rewardedRemaining -= 1;
    else if (reason === "premium" && this.consumeSubscriptionPremiumScan(profile)) {
      return this.getQuota();
    } else if (reason === "premium" && quota.premiumRemaining > 0) quota.premiumRemaining -= 1;
    else throw new Error(`No ${reason} scan credit remaining`);

    return this.getQuota();
  }

  async recordRewardedAdServerVerification(
    input: RewardedAdServerVerificationInput,
  ): Promise<RewardedAdServerVerification> {
    const verification = {
      transactionId: input.transactionId,
      profileId: input.profileId,
      adUnitId: input.adUnitId,
      customData: input.customData,
      rewardType: input.rewardType,
      rewardAmount: input.rewardAmount,
    };
    this.rewardedAdServerVerifications.set(input.transactionId, verification);
    return verification;
  }

  async findRewardedAdServerVerification(input: {
    profileId: string;
    customData: string;
  }): Promise<RewardedAdServerVerification | undefined> {
    return [...this.rewardedAdServerVerifications.values()].find(
      (verification) =>
        verification.profileId === input.profileId && verification.customData === input.customData,
    );
  }

  async completeRewardedAd(
    input: RewardedAdCompletionInput,
    dailyScanLimit = rewardedDailyScanLimit,
  ): Promise<RewardedAdCreditResult> {
    const profile = await this.getProfile();
    const quota = this.quotaFor(profile);
    const today = new Date().toISOString().slice(0, 10);
    const progressKey = `${this.quotaKey(profile)}:${today}`;
    const progress = this.rewardedAdProgress.get(progressKey) ?? {
      completedAds: 0,
      grantedScans: 0,
    };

    const alreadyCompleted =
      input.transactionId != null && this.rewardedAdTransactions.has(input.transactionId);
    if (!alreadyCompleted) {
      if (input.transactionId) this.rewardedAdTransactions.add(input.transactionId);
      progress.completedAds += 1;
    }

    const state = calculateRewardedAdState({ ...progress, dailyScanLimit });
    const grantableScans = alreadyCompleted ? 0 : Math.min(state.grantableScans, 1);
    if (grantableScans > 0) {
      progress.grantedScans += grantableScans;
      quota.rewardedRemaining += grantableScans;
    }

    this.rewardedAdProgress.set(progressKey, progress);

    return {
      grantedScan: grantableScans > 0,
      ...(await this.getRewardedAdProgress(dailyScanLimit)),
      quota: { ...quota },
    };
  }

  async registerPushToken(input: PushTokenRegistrationInput): Promise<PushTokenRegistrationResult> {
    const profile = await this.getProfile();
    const identity = currentRequestIdentity();
    const installId = identity.installId;
    if (!installId) {
      throw new AuthError(
        "install_required",
        "Device install identity is required to register push notifications.",
        400,
      );
    }

    const registered: PushTokenRegistrationResult = {
      profileId: profile.id,
      installId,
      provider: input.provider,
      platform: input.platform ?? identity.platform ?? "ios",
      registeredAt: new Date().toISOString(),
    };
    this.pushTokens.set(input.token, registered);
    return registered;
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

  async learnFoodsFromConfirmedScan(input: LearnFoodsFromConfirmedScanInput): Promise<void> {
    const candidates = buildConfirmedScanLearnedFoodCandidates(input);
    for (const candidate of candidates) {
      const existing = searchFoods(candidate.canonicalName, this.foods).find(
        (food) => food.score >= 100,
      );

      if (existing) {
        const food = this.foods.find((storedFood) => storedFood.id === existing.id);
        if (!food) continue;

        for (const alias of candidate.aliases) {
          if (
            !food.aliases.some(
              (existingAlias) => existingAlias.toLowerCase() === alias.toLowerCase(),
            )
          ) {
            food.aliases.push(alias);
          }
        }

        const matchingPortion = food.portions.find(
          (portion) =>
            portion.unit === candidate.portion.unit &&
            Math.abs(portion.grams - candidate.portion.grams) <= 5,
        );
        if (!matchingPortion) food.portions.push(candidate.portion);
        continue;
      }

      this.foods.push({
        id: `food_learned_${randomUUID()}`,
        canonicalName: candidate.canonicalName,
        region: candidate.region,
        aliases: candidate.aliases,
        source: "logmyplate_learned",
        nutritionPer100g: candidate.nutritionPer100g,
        portions: [candidate.portion],
      });
    }
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
      storedObjects: meal.image
        ? [{ bucket: meal.image.bucket, objectKey: meal.image.objectKey }]
        : [],
      scanSessionId: this.mealScanSessions.get(mealId),
    };
  }

  async deleteMeal(mealId: string) {
    const profile = await this.getProfile();
    if (this.mealProfiles.get(mealId) !== profile.id) return false;
    const scanSessionId = this.mealScanSessions.get(mealId);
    const scan = scanSessionId ? this.scans.get(scanSessionId) : undefined;
    this.mealProfiles.delete(mealId);
    this.mealScanSessions.delete(mealId);
    if (scan?.profileId === profile.id) this.unlinkScanFromProfile(scan);
    return this.meals.delete(mealId);
  }

  async prepareScan(profileId?: string) {
    const profile = await this.getProfile();
    const identity = currentRequestIdentity();
    const scan: ScanSession = {
      id: randomUUID(),
      profileId: profileId ?? profile.id,
      installId: identity.installId,
      platform: identity.platform,
      appVersion: identity.appVersion,
      appBuild: identity.appBuild,
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

  async findScanAnalysisCache(input: {
    profileId: string;
    imageHash: string;
    hashAlgorithm: "sha256:v1";
  }) {
    const cached = this.scanAnalysisCache.get(
      this.scanAnalysisCacheKey(input.profileId, input.hashAlgorithm, input.imageHash),
    );
    return cached ? { ...cached } : undefined;
  }

  async upsertScanAnalysisCache(input: UpsertScanAnalysisCacheInput) {
    const key = this.scanAnalysisCacheKey(input.profileId, input.hashAlgorithm, input.imageHash);
    const existing = this.scanAnalysisCache.get(key);
    const now = new Date().toISOString();
    const cached: ScanAnalysisCacheRecord = {
      ...input,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    this.scanAnalysisCache.set(key, cached);
    return { ...cached };
  }

  async countNoFoodScanAttemptsSince(sinceIso: string) {
    const profile = await this.getProfile();
    const sinceTime = Date.parse(sinceIso);
    let count = 0;

    for (const scan of this.scans.values()) {
      if (scan.profileId !== profile.id) continue;
      if (Date.parse(scan.createdAt) < sinceTime) continue;
      if (scanHasNoFoodAnalysis(scan)) count += 1;
    }

    return count;
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

  private subscriptionStatusFor(profile: Profile): SubscriptionStatusState {
    const entitlement = this.subscriptionEntitlements.get(profile.id);
    const active = entitlement ? subscriptionEntitlementIsActive(entitlement) : false;
    const usage = this.subscriptionUsageFor(profile, entitlement, active);
    return {
      appUserId: profile.id,
      entitlementId: entitlement?.entitlementId ?? config.revenueCat.entitlementId,
      active,
      status: entitlement?.status ?? "inactive",
      store: entitlement?.store,
      productId: entitlement?.productId,
      currentPeriodStart: entitlement?.currentPeriodStart,
      currentPeriodEnd: entitlement?.currentPeriodEnd,
      willRenew: entitlement?.willRenew,
      usage,
    };
  }

  private subscriptionUsageFor(
    profile: Profile,
    entitlement: UpsertSubscriptionEntitlementInput | undefined,
    active: boolean,
  ): SubscriptionStatusState["usage"] {
    const monthlyLimit = config.revenueCat.premiumMonthlyScanLimit;
    const dailyLimit = config.revenueCat.premiumDailyScanLimit;
    if (!active) {
      return emptySubscriptionUsage(monthlyLimit, dailyLimit);
    }

    const { periodStart } = subscriptionPeriod(entitlement);
    const today = localDateForTimezone(profile.timezone);
    let usedThisPeriod = 0;
    for (const [key, used] of this.premiumScanUsage.entries()) {
      if (key.startsWith(`${profile.id}:${periodStart}:`)) usedThisPeriod += used;
    }
    const usedToday = this.premiumScanUsage.get(`${profile.id}:${periodStart}:${today}`) ?? 0;
    return subscriptionUsage(monthlyLimit, dailyLimit, usedThisPeriod, usedToday);
  }

  private consumeSubscriptionPremiumScan(profile: Profile): boolean {
    const entitlement = this.subscriptionEntitlements.get(profile.id);
    if (!entitlement || !subscriptionEntitlementIsActive(entitlement)) return false;
    const status = this.subscriptionStatusFor(profile);
    if (status.usage.premiumRemaining <= 0) return false;

    const { periodStart } = subscriptionPeriod(entitlement);
    const today = localDateForTimezone(profile.timezone);
    const key = `${profile.id}:${periodStart}:${today}`;
    this.premiumScanUsage.set(key, (this.premiumScanUsage.get(key) ?? 0) + 1);
    return true;
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

  private unlinkScanFromProfile(scan: ScanSession): void {
    scan.profileId = `deleted:${scan.profileId}`;
    scan.creditReason = undefined;
    scan.userHint = undefined;
    scan.imageMimeType = undefined;
    scan.imageByteSize = undefined;
    scan.imageBucket = undefined;
    scan.imageObjectKey = undefined;
    scan.imageHash = undefined;
    scan.imageHashAlgorithm = undefined;
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

  private scanAnalysisCacheKey(
    profileId: string,
    hashAlgorithm: ScanAnalysisCacheRecord["hashAlgorithm"],
    imageHash: string,
  ): string {
    return `${profileId}:${hashAlgorithm}:${imageHash}`;
  }
}

const scanHasNoFoodAnalysis = (scan: ScanSession) => {
  const response = scan.analyzedResponse as { items?: unknown } | undefined;
  return Array.isArray(response?.items) && response.items.length === 0;
};

export const store = new InMemoryStore();

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

const identityKey = (provider: OAuthAccountInput["provider"] | "email", subject: string): string =>
  `${provider}:${subject}`;

const randomPasswordResetCode = (): string =>
  Math.floor(Math.random() * 1_000_000)
    .toString()
    .padStart(6, "0");
