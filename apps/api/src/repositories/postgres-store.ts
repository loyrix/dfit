import {
  createHash,
  randomBytes,
  randomInt,
  randomUUID,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import {
  calculateRewardedAdState,
  buildLearnedFoodCandidate,
  createMealSummary,
  normalizeFoodText,
  sumTotals,
  rewardedAdsPerScan,
  rewardedDailyScanLimit,
  type FoodRecord,
  type LearnedFoodCandidate,
  type MealSummary,
  type PortionUnit,
  type ScanCreditState,
} from "@logmyplate/domain";
import type postgres from "postgres";
import type { SqlClient } from "../db/client.js";
import { currentRequestIdentity } from "../request-context.js";
import { loadEngagementPolicy } from "../services/engagement-policy.js";
import type {
  AccountSession,
  AppRepository,
  AttachMealImageInput,
  CreateMealInput,
  IdempotencyRecord,
  ListMealsInput,
  LearnFoodsFromConfirmedScanInput,
  MealDeletionPlan,
  OAuthAccountInput,
  PasswordResetRequest,
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
  UpsertProfileHealthTargetInput,
  UpsertScanAnalysisCacheInput,
  UpsertSubscriptionEntitlementInput,
} from "./app-repository.js";
import { AccountAuthError } from "./app-repository.js";
import { buildConfirmedScanLearnedFoodCandidates } from "../services/food-learning.js";
import { config } from "../config.js";

type FoodRow = {
  id: string;
  canonical_name: string;
  region: "IN" | "GLOBAL";
  source_name: string | null;
  calories_per_100g: string;
  protein_g_per_100g: string;
  carbs_g_per_100g: string;
  fat_g_per_100g: string;
  fiber_g_per_100g: string | null;
  sugar_g_per_100g: string | null;
  sodium_mg_per_100g: string | null;
};

type HistoricalConfirmedFoodRow = {
  display_name: string;
  aliases: string[];
  quantity: string;
  unit: PortionUnit;
  grams: string;
  confidence: string;
  calories: string;
  protein_g: string;
  carbs_g: string;
  fat_g: string;
  fiber_g: string | null;
  sugar_g: string | null;
  sodium_mg: string | null;
};

type MealRow = {
  id: string;
  meal_type: MealSummary["mealType"];
  title: string;
  logged_at: Date | string;
};

type MealItemRow = {
  meal_id: string;
  food_id: string | null;
  display_name: string;
  quantity: string;
  unit: string;
  grams: string;
  calories: string | null;
  protein_g: string | null;
  carbs_g: string | null;
  fat_g: string | null;
  fiber_g: string | null;
  sugar_g: string | null;
  sodium_mg: string | null;
};

type MealImageRow = {
  id: string;
  bucket: string;
  object_key: string;
  mime_type: "image/jpeg" | "image/png" | "image/webp";
  byte_size: number;
  width: number | null;
  height: number | null;
  created_at: string;
};

type DailyMealAggregateRow = {
  local_date: string;
  meal_count: number;
  calories: string | null;
  protein_g: string | null;
  carbs_g: string | null;
  fat_g: string | null;
  fiber_g: string | null;
  sugar_g: string | null;
  sodium_mg: string | null;
};

type ScanRow = {
  id: string;
  profile_id: string;
  install_id: string | null;
  platform: ScanSession["platform"] | null;
  app_version: string | null;
  app_build: number | null;
  status: ScanSession["status"];
  consumed_credit_reason: ScanSession["creditReason"] | null;
  user_hint: string | null;
  image_mime_type: string | null;
  image_byte_size: number | null;
  image_bucket: string | null;
  image_object_key: string | null;
  image_hash: string | null;
  image_hash_algorithm: ScanSession["imageHashAlgorithm"] | null;
  created_at: string;
  analyzed_response: unknown | null;
};

type ScanAnalysisCacheRow = {
  profile_id: string;
  image_hash: string;
  hash_algorithm: ScanAnalysisCacheRecord["hashAlgorithm"];
  image_mime_type: string | null;
  image_byte_size: number | null;
  analyzed_response: unknown;
  created_at: string;
  updated_at: string;
};

const toJsonValue = (value: unknown): postgres.JSONValue =>
  JSON.parse(JSON.stringify(value ?? null)) as postgres.JSONValue;

const scrypt = promisify(scryptCallback);
const sessionDurationMs = 30 * 24 * 60 * 60 * 1000;
const passwordResetDurationMs = 15 * 60 * 1000;
const maxPasswordResetAttempts = 5;
const lifetimeFreeScanAllowance = 3;
const lifetimeQuotaDate = "1970-01-01";
const adSuspensionDailyCreditReason = "ad_suspension_daily_free";

type QuotaRow = {
  free_remaining: number;
  rewarded_remaining: number;
  premium_remaining: number;
};

type RewardedAdProgressRow = {
  completed_ads: number;
  granted_scans: number;
};

type RewardedAdCallbackRow = {
  transaction_id: string;
  profile_id: string | null;
  raw_query: Record<string, string>;
};

type SubscriptionEntitlementRow = {
  profile_id: string;
  app_user_id: string;
  entitlement_id: string;
  status: SubscriptionStatusState["status"];
  store: SubscriptionStatusState["store"] | null;
  product_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  will_renew: boolean | null;
};

type PremiumUsageRow = {
  used_this_period: number;
  used_today: number;
};

type HealthTargetRow = {
  profile_id: string;
  height_cm: string;
  weight_kg: string;
  age_years: number;
  sex: ProfileHealthTarget["sex"];
  activity_level: ProfileHealthTarget["activityLevel"];
  goal: ProfileHealthTarget["goal"];
  bmi: string;
  bmi_category: ProfileHealthTarget["bmiCategory"];
  bmr_calories: number;
  daily_calorie_target: number;
  formula: string;
  created_at: string;
  updated_at: string;
};

const quotaFromRow = (row: QuotaRow): ScanCreditState => ({
  freeRemaining: row.free_remaining,
  rewardedRemaining: row.rewarded_remaining,
  premiumRemaining: row.premium_remaining,
});

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

const subscriptionUsageFromCounts = (
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
  entitlement: SubscriptionEntitlementRow | UpsertSubscriptionEntitlementInput,
): boolean => {
  if (!["active", "cancelled", "billing_issue"].includes(entitlement.status)) return false;
  const currentPeriodEnd =
    "current_period_end" in entitlement
      ? entitlement.current_period_end
      : entitlement.currentPeriodEnd;
  if (!currentPeriodEnd) return true;
  return Date.parse(currentPeriodEnd) > Date.now();
};

const subscriptionPeriod = (
  entitlement: SubscriptionEntitlementRow | UpsertSubscriptionEntitlementInput | undefined,
): { periodStart: string; periodEnd: string } => {
  const now = new Date();
  const currentPeriodStart =
    entitlement && "current_period_start" in entitlement
      ? entitlement.current_period_start
      : entitlement?.currentPeriodStart;
  const currentPeriodEnd =
    entitlement && "current_period_end" in entitlement
      ? entitlement.current_period_end
      : entitlement?.currentPeriodEnd;
  const start = currentPeriodStart
    ? new Date(currentPeriodStart)
    : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = currentPeriodEnd
    ? new Date(currentPeriodEnd)
    : new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));
  return {
    periodStart: start.toISOString().slice(0, 10),
    periodEnd: end.toISOString().slice(0, 10),
  };
};

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
type AppPlatform = NonNullable<ScanSession["platform"]>;
type ProfileLifecycleEventType = "deactivated" | "deleted";
type SqlExecutor = postgres.Sql | postgres.TransactionSql;

const rewardedVerificationFromRow = (row: RewardedAdCallbackRow): RewardedAdServerVerification => {
  const rawQuery = row.raw_query ?? {};
  return {
    transactionId: row.transaction_id,
    profileId: row.profile_id ?? undefined,
    adUnitId: rawQuery.ad_unit,
    customData: rawQuery.custom_data,
    rewardType: rawQuery.reward_item,
    rewardAmount: parseInteger(rawQuery.reward_amount),
  };
};

const parseInteger = (value: string | undefined): number | undefined => {
  if (!value || !/^\d+$/.test(value)) return undefined;
  return Number(value);
};

const isoTimestamp = (value: string | null | undefined): string | undefined => {
  if (!value) return undefined;
  const time = Date.parse(value);
  if (!Number.isFinite(time)) return undefined;
  return new Date(time).toISOString();
};

const metricAppVersion = (value: string | null | undefined): string => {
  const version = value?.trim();
  return version ? version.slice(0, 32) : "unknown";
};

const metricAppBuild = (value: number | null | undefined): number =>
  typeof value === "number" && Number.isSafeInteger(value) && value >= 0 ? value : 0;

const healthTargetFromRow = (row: HealthTargetRow): ProfileHealthTarget => ({
  profileId: row.profile_id,
  heightCm: Number(row.height_cm),
  weightKg: Number(row.weight_kg),
  ageYears: row.age_years,
  sex: row.sex,
  activityLevel: row.activity_level,
  goal: row.goal,
  bmi: Number(row.bmi),
  bmiCategory: row.bmi_category,
  bmrCalories: row.bmr_calories,
  dailyCalorieTarget: row.daily_calorie_target,
  formula: row.formula,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export class PostgresStore implements AppRepository {
  constructor(private readonly sql: SqlClient) {}

  private async recordInstallPlatformActivity(
    sql: SqlExecutor,
    input: {
      installId?: string;
      platform?: AppPlatform | null;
      appVersion?: string | null;
      appBuild?: number | null;
      isNewInstall?: boolean;
    },
  ): Promise<void> {
    if (!input.installId || !input.platform) return;
    const appVersion = metricAppVersion(input.appVersion);
    const appBuild = metricAppBuild(input.appBuild);

    await sql`
      insert into platform_daily_active_installs (
        local_date,
        platform,
        install_id,
        app_version,
        app_build
      )
      values (
        (now() at time zone 'Asia/Kolkata')::date,
        ${input.platform},
        ${input.installId},
        ${appVersion},
        ${appBuild}
      )
      on conflict (local_date, platform, install_id) do update
      set
        app_version = excluded.app_version,
        app_build = excluded.app_build,
        last_seen_at = now()
    `;

    if (input.isNewInstall) {
      await this.incrementPlatformDailyMetrics(sql, {
        platform: input.platform,
        appVersion,
        appBuild,
        installs: 1,
      });
    }
  }

  private async incrementPlatformDailyMetrics(
    sql: SqlExecutor,
    input: {
      platform?: AppPlatform | null;
      appVersion?: string | null;
      appBuild?: number | null;
      localDate?: string | null;
      sourceTimestamp?: string | null;
      installs?: number;
      scansPrepared?: number;
      scansReadyForReview?: number;
      scansConfirmed?: number;
      scansFailed?: number;
      aiRuns?: number;
      aiSuccess?: number;
      aiFailed?: number;
      inputTokens?: number;
      outputTokens?: number;
      estimatedCostUsd?: number;
    },
  ): Promise<void> {
    if (!input.platform) return;
    await sql`
      insert into platform_daily_metrics (
        local_date,
        platform,
        app_version,
        app_build,
        installs,
        scans_prepared,
        scans_ready_for_review,
        scans_confirmed,
        scans_failed,
        ai_runs,
        ai_success,
        ai_failed,
        input_tokens,
        output_tokens,
        estimated_cost_usd
      )
      values (
        coalesce(
          ${input.localDate ?? null}::date,
          (${input.sourceTimestamp ?? null}::timestamptz at time zone 'Asia/Kolkata')::date,
          (now() at time zone 'Asia/Kolkata')::date
        ),
        ${input.platform},
        ${metricAppVersion(input.appVersion)},
        ${metricAppBuild(input.appBuild)},
        ${input.installs ?? 0},
        ${input.scansPrepared ?? 0},
        ${input.scansReadyForReview ?? 0},
        ${input.scansConfirmed ?? 0},
        ${input.scansFailed ?? 0},
        ${input.aiRuns ?? 0},
        ${input.aiSuccess ?? 0},
        ${input.aiFailed ?? 0},
        ${input.inputTokens ?? 0},
        ${input.outputTokens ?? 0},
        ${input.estimatedCostUsd ?? 0}
      )
      on conflict (local_date, platform, app_version, app_build) do update
      set
        installs = platform_daily_metrics.installs + excluded.installs,
        scans_prepared = platform_daily_metrics.scans_prepared + excluded.scans_prepared,
        scans_ready_for_review =
          platform_daily_metrics.scans_ready_for_review + excluded.scans_ready_for_review,
        scans_confirmed = platform_daily_metrics.scans_confirmed + excluded.scans_confirmed,
        scans_failed = platform_daily_metrics.scans_failed + excluded.scans_failed,
        ai_runs = platform_daily_metrics.ai_runs + excluded.ai_runs,
        ai_success = platform_daily_metrics.ai_success + excluded.ai_success,
        ai_failed = platform_daily_metrics.ai_failed + excluded.ai_failed,
        input_tokens = platform_daily_metrics.input_tokens + excluded.input_tokens,
        output_tokens = platform_daily_metrics.output_tokens + excluded.output_tokens,
        estimated_cost_usd =
          platform_daily_metrics.estimated_cost_usd + excluded.estimated_cost_usd,
        updated_at = now()
    `;
  }

  async getProfile(): Promise<Profile> {
    const identity = currentRequestIdentity();
    if (identity.sessionToken) {
      const sessionProfile = await this.getProfileForSession(identity.sessionToken);
      if (sessionProfile) {
        await this.attachInstallToProfile(sessionProfile.id);
        return sessionProfile;
      }
    }

    if (identity.installId) return this.getOrCreateProfileForInstall(identity.installId);

    const [existing] = await this.sql<Profile[]>`
      select
        id::text,
        auth_method as "authMethod",
        email,
        timezone,
        linked_at::text as "linkedAt",
        created_at::text as "createdAt"
      from profiles
      where auth_method = 'anonymous'
        and provider_subject = 'dev_anonymous_profile'
      limit 1
    `;

    if (existing) return existing;

    const [profile] = await this.sql<Profile[]>`
      insert into profiles (timezone, provider_subject)
      values ('Asia/Kolkata', 'dev_anonymous_profile')
      returning
        id::text,
        auth_method as "authMethod",
        email,
        timezone,
        linked_at::text as "linkedAt",
        created_at::text as "createdAt"
    `;

    return profile;
  }

  async deactivateProfile(): Promise<boolean> {
    const profile = await this.requireActiveAccountProfile();

    const deactivated = await this.sql.begin(async (tx) => {
      const [updated] = await tx<{ id: string }[]>`
        update profiles
        set
          deactivated_at = coalesce(deactivated_at, now()),
          updated_at = now()
        where id = ${profile.id}
          and auth_method <> 'anonymous'
          and deactivated_at is null
        returning id::text
      `;

      if (!updated) return false;

      await this.recordProfileLifecycleEvent(
        tx,
        profile.id,
        "deactivated",
        "User deactivated account from app",
      );

      await tx`
        update account_sessions
        set revoked_at = now()
        where profile_id = ${profile.id}
          and revoked_at is null
      `;

      await tx`
        update install_scan_credits
        set profile_id = null, updated_at = now()
        where profile_id = ${profile.id}
      `;

      return true;
    });

    await this.resetCurrentInstallToAnonymousProfile();
    return deactivated;
  }

  async getProfileDeletionPlan(): Promise<ProfileDeletionPlan> {
    const profile = await this.requireActiveAccountProfile();
    const storedObjects = await this.sql<{ bucket: string; object_key: string }[]>`
      select distinct bucket, object_key
      from (
        select bucket, object_key
        from meal_images
        where profile_id = ${profile.id}

        union all

        select image_bucket as bucket, image_object_key as object_key
        from scan_sessions
        where profile_id = ${profile.id}
          and image_bucket is not null
          and image_object_key is not null
      ) profile_objects
      where bucket is not null
        and object_key is not null
    `;

    return {
      profileId: profile.id,
      storedObjects: storedObjects.map((object) => ({
        bucket: object.bucket,
        objectKey: object.object_key,
      })),
    };
  }

  async deleteProfile(): Promise<boolean> {
    const profile = await this.requireActiveAccountProfile();
    const deleted = await this.sql.begin(async (tx) => {
      const recorded = await this.recordProfileLifecycleEvent(
        tx,
        profile.id,
        "deleted",
        "User deleted account from app",
      );
      if (!recorded) return false;

      await tx`
        update install_scan_credits
        set profile_id = null, updated_at = now()
        where profile_id = ${profile.id}
      `;

      await tx`
        update scan_sessions
        set
          profile_id = null,
          consumed_credit_reason = null,
          user_hint = null,
          image_width = null,
          image_height = null,
          image_mime_type = null,
          image_byte_size = null,
          image_bucket = null,
          image_object_key = null,
          image_hash = null,
          image_hash_algorithm = null,
          updated_at = now()
        where profile_id = ${profile.id}
      `;

      const [deletedProfile] = await tx<{ id: string }[]>`
        delete from profiles
        where id = ${profile.id}
          and auth_method <> 'anonymous'
        returning id::text
      `;

      if (!deletedProfile) {
        throw new Error("Profile deletion lost the profile row after lifecycle event capture.");
      }

      return true;
    });

    await this.resetCurrentInstallToAnonymousProfile();
    return deleted;
  }

  private async recordProfileLifecycleEvent(
    sql: SqlExecutor,
    profileId: string,
    eventType: ProfileLifecycleEventType,
    reason: string,
  ): Promise<boolean> {
    const requestIdentity = currentRequestIdentity();
    const [row] = await sql<{ id: string }[]>`
      insert into profile_lifecycle_events (
        profile_id,
        event_type,
        actor_type,
        actor,
        reason,
        auth_method,
        email,
        display_name,
        identity_provider,
        provider_subject,
        profile_timezone,
        profile_created_at,
        profile_updated_at,
        install_id,
        platform,
        app_version,
        app_build,
        device_timezone,
        device_region,
        device_locale,
        scan_count,
        failed_scan_count,
        meal_count
      )
      select
        profiles.id,
        ${eventType},
        'user',
        coalesce(identity.email, profiles.email, identity.display_name, profiles.id::text),
        ${reason},
        profiles.auth_method::text,
        coalesce(identity.email, profiles.email),
        identity.display_name,
        identity.provider,
        profiles.provider_subject,
        profiles.timezone,
        profiles.created_at,
        profiles.updated_at,
        latest_device.install_id,
        latest_device.platform,
        latest_device.app_version,
        latest_device.app_build,
        latest_device.timezone,
        latest_device.region,
        latest_device.locale,
        coalesce(scan_counts.scan_count, 0)::int,
        coalesce(scan_counts.failed_scan_count, 0)::int,
        coalesce(meal_counts.meal_count, 0)::int
      from profiles
      left join lateral (
        select
          account_identities.email,
          account_identities.display_name,
          account_identities.provider::text as provider
        from account_identities
        where account_identities.profile_id = profiles.id
        order by account_identities.updated_at desc, account_identities.created_at desc
        limit 1
      ) identity on true
      left join lateral (
        select
          devices.install_id,
          devices.platform,
          devices.app_version,
          devices.app_build,
          devices.timezone,
          devices.region,
          devices.locale
        from devices
        where devices.profile_id = profiles.id
        order by
          (devices.install_id = ${requestIdentity.installId ?? ""}) desc,
          devices.last_seen_at desc
        limit 1
      ) latest_device on true
      left join lateral (
        select
          count(*)::int as scan_count,
          count(*) filter (where scan_sessions.status = 'failed')::int as failed_scan_count
        from scan_sessions
        where scan_sessions.profile_id = profiles.id
      ) scan_counts on true
      left join lateral (
        select count(*)::int as meal_count
        from meals
        where meals.profile_id = profiles.id
      ) meal_counts on true
      where profiles.id = ${profileId}
        and profiles.auth_method <> 'anonymous'
      returning id::text
    `;

    return Boolean(row);
  }

  async getHealthTarget(profileId?: string): Promise<ProfileHealthTarget | undefined> {
    const owner = profileId ?? (await this.getProfile()).id;
    const [target] = await this.sql<HealthTargetRow[]>`
      select
        profile_id::text,
        height_cm,
        weight_kg,
        age_years,
        sex,
        activity_level,
        goal,
        bmi,
        bmi_category,
        bmr_calories,
        daily_calorie_target,
        formula,
        created_at::text,
        updated_at::text
      from profile_health_targets
      where profile_id = ${owner}
      limit 1
    `;

    return target ? healthTargetFromRow(target) : undefined;
  }

  async upsertHealthTarget(input: UpsertProfileHealthTargetInput): Promise<ProfileHealthTarget> {
    const profile = await this.getProfile();
    if (profile.authMethod === "anonymous") {
      throw new AccountAuthError(
        "account_required",
        "Create an account to save a daily target.",
        401,
      );
    }

    const [target] = await this.sql<HealthTargetRow[]>`
      insert into profile_health_targets (
        profile_id,
        height_cm,
        weight_kg,
        age_years,
        sex,
        activity_level,
        goal,
        bmi,
        bmi_category,
        bmr_calories,
        daily_calorie_target,
        formula
      )
      values (
        ${profile.id},
        ${input.heightCm},
        ${input.weightKg},
        ${input.ageYears},
        ${input.sex},
        ${input.activityLevel},
        ${input.goal},
        ${input.bmi},
        ${input.bmiCategory},
        ${input.bmrCalories},
        ${input.dailyCalorieTarget},
        ${input.formula}
      )
      on conflict (profile_id) do update
      set
        height_cm = excluded.height_cm,
        weight_kg = excluded.weight_kg,
        age_years = excluded.age_years,
        sex = excluded.sex,
        activity_level = excluded.activity_level,
        goal = excluded.goal,
        bmi = excluded.bmi,
        bmi_category = excluded.bmi_category,
        bmr_calories = excluded.bmr_calories,
        daily_calorie_target = excluded.daily_calorie_target,
        formula = excluded.formula,
        updated_at = now()
      returning
        profile_id::text,
        height_cm,
        weight_kg,
        age_years,
        sex,
        activity_level,
        goal,
        bmi,
        bmi_category,
        bmr_calories,
        daily_calorie_target,
        formula,
        created_at::text,
        updated_at::text
    `;

    return healthTargetFromRow(target);
  }

  async signUpWithEmail(input: { email: string; password: string }): Promise<AccountSession> {
    const email = normalizeEmail(input.email);
    validatePassword(input.password);

    const existing = await this.findCredentialByEmail(email);
    if (existing) {
      throw new AccountAuthError("email_already_registered", "Email already registered.", 409);
    }

    const currentProfile = await this.getProfile();
    const profile = await this.sql.begin(async (tx) => {
      let linkedProfile: Profile;

      if (currentProfile.authMethod === "anonymous") {
        const [updated] = await tx<Profile[]>`
          update profiles
          set
            auth_method = 'email',
            email = ${email},
            provider_subject = ${`email:${email}`},
            linked_at = now(),
            updated_at = now()
          where id = ${currentProfile.id}
          returning
            id::text,
            auth_method as "authMethod",
            email,
            timezone,
            linked_at::text as "linkedAt",
            created_at::text as "createdAt"
        `;
        linkedProfile = updated;

        await tx`
          insert into identity_link_events (profile_id, from_auth_method, to_auth_method, meals_count)
          values (
            ${linkedProfile.id},
            'anonymous',
            'email',
            (select count(*)::int from meals where profile_id = ${linkedProfile.id})
          )
        `;
      } else {
        const [created] = await tx<Profile[]>`
          insert into profiles (auth_method, email, provider_subject, timezone, linked_at)
          values ('email', ${email}, ${`email:${email}`}, ${currentProfile.timezone}, now())
          returning
            id::text,
            auth_method as "authMethod",
            email,
            timezone,
            linked_at::text as "linkedAt",
            created_at::text as "createdAt"
        `;
        linkedProfile = created;
      }

      const passwordHash = await hashPassword(input.password);
      await tx`
        insert into account_password_credentials (
          profile_id,
          email,
          password_salt,
          password_hash,
          password_params
        )
        values (
          ${linkedProfile.id},
          ${email},
          ${passwordHash.salt},
          ${passwordHash.hash},
          ${tx.json({ algorithm: "scrypt", keyLength: 64 })}
        )
      `;

      await tx`
        insert into account_identities (
          profile_id,
          provider,
          provider_subject,
          email,
          email_verified,
          display_name
        )
        values (
          ${linkedProfile.id},
          'email',
          ${email},
          ${email},
          true,
          null
        )
        on conflict (provider, provider_subject) do nothing
      `;

      return linkedProfile;
    });

    await this.attachInstallToProfile(profile.id);
    await this.transferCurrentInstallQuotaToProfile(profile.id);
    return this.createSession(profile.id);
  }

  async loginWithEmail(input: { email: string; password: string }): Promise<AccountSession> {
    const email = normalizeEmail(input.email);
    const credential = await this.findCredentialByEmail(email);
    if (!credential) {
      throw new AccountAuthError("account_not_found", "User does not exist.", 404);
    }

    const passwordMatches = await verifyPassword(
      input.password,
      credential.password_salt,
      credential.password_hash,
    );
    if (!passwordMatches) {
      throw new AccountAuthError("invalid_credentials", "Invalid email or password.", 401);
    }
    if (credential.deactivated_at) {
      throw new AccountAuthError(
        "account_deactivated",
        "This profile is deactivated. Contact support to reactivate it.",
        403,
      );
    }

    const currentProfile = await this.getAnonymousProfileForCurrentInstall();
    if (
      currentProfile &&
      currentProfile.authMethod === "anonymous" &&
      currentProfile.id !== credential.profile_id
    ) {
      await this.mergeProfiles(currentProfile.id, credential.profile_id, "email");
    }

    await this.attachInstallToProfile(credential.profile_id);
    await this.transferCurrentInstallQuotaToProfile(credential.profile_id);
    return this.createSession(credential.profile_id);
  }

  async requestPasswordReset(input: { email: string }): Promise<PasswordResetRequest | undefined> {
    const email = normalizeEmail(input.email);
    const profile = await this.findPasswordResetProfileByEmail(email);
    if (!profile) return undefined;

    const code = randomPasswordResetCode();
    const codeHash = await hashPassword(code);
    const expiresAt = new Date(Date.now() + passwordResetDurationMs).toISOString();

    await this.sql.begin(async (tx) => {
      await tx`
        update account_password_reset_codes
        set consumed_at = now()
        where lower(email) = lower(${email})
          and consumed_at is null
      `;

      await tx`
        insert into account_password_reset_codes (
          profile_id,
          email,
          code_salt,
          code_hash,
          expires_at
        )
        values (
          ${profile.id},
          ${email},
          ${codeHash.salt},
          ${codeHash.hash},
          ${expiresAt}
        )
      `;
    });

    return { email, code, expiresAt };
  }

  async resetPasswordWithCode(input: {
    email: string;
    code: string;
    password: string;
  }): Promise<AccountSession> {
    const email = normalizeEmail(input.email);
    const code = input.code.trim();
    validatePassword(input.password);

    if (!/^\d{6}$/.test(code)) {
      throw new AccountAuthError(
        "invalid_password_reset_code",
        "Password reset code is invalid or expired.",
        400,
      );
    }

    const reset = await this.findOpenPasswordResetCode(email);
    if (!reset || reset.attempt_count >= maxPasswordResetAttempts) {
      throw new AccountAuthError(
        "invalid_password_reset_code",
        "Password reset code is invalid or expired.",
        400,
      );
    }

    const matches = await verifyPassword(code, reset.code_salt, reset.code_hash);
    if (!matches) {
      await this.sql`
        update account_password_reset_codes
        set attempt_count = attempt_count + 1
        where id = ${reset.id}
      `;
      throw new AccountAuthError(
        "invalid_password_reset_code",
        "Password reset code is invalid or expired.",
        400,
      );
    }

    const passwordHash = await hashPassword(input.password);

    await this.sql.begin(async (tx) => {
      await tx`
        update account_password_reset_codes
        set
          consumed_at = now(),
          attempt_count = attempt_count + 1
        where id = ${reset.id}
          and consumed_at is null
      `;

      await tx`
        update profiles
        set
          auth_method = 'email',
          email = ${email},
          provider_subject = ${`email:${email}`},
          linked_at = coalesce(linked_at, now()),
          updated_at = now()
        where id = ${reset.profile_id}
      `;

      await tx`
        insert into account_password_credentials (
          profile_id,
          email,
          password_salt,
          password_hash,
          password_params
        )
        values (
          ${reset.profile_id},
          ${email},
          ${passwordHash.salt},
          ${passwordHash.hash},
          ${tx.json({ algorithm: "scrypt", keyLength: 64 })}
        )
        on conflict (profile_id) do update
        set
          email = excluded.email,
          password_salt = excluded.password_salt,
          password_hash = excluded.password_hash,
          password_params = excluded.password_params,
          updated_at = now()
      `;

      await tx`
        insert into account_identities (
          profile_id,
          provider,
          provider_subject,
          email,
          email_verified,
          display_name
        )
        values (
          ${reset.profile_id},
          'email',
          ${email},
          ${email},
          true,
          null
        )
        on conflict (profile_id, provider) do update
        set
          provider_subject = excluded.provider_subject,
          email = excluded.email,
          email_verified = true,
          updated_at = now()
      `;

      await tx`
        update account_sessions
        set revoked_at = now()
        where profile_id = ${reset.profile_id}
          and revoked_at is null
      `;
    });

    await this.attachInstallToProfile(reset.profile_id);
    await this.transferCurrentInstallQuotaToProfile(reset.profile_id);
    return this.createSession(reset.profile_id);
  }

  async signInWithOAuth(input: OAuthAccountInput): Promise<AccountSession> {
    const provider = input.provider;
    const providerSubject = input.providerSubject.trim();
    const email = input.email ? normalizeEmail(input.email) : undefined;

    if (!providerSubject) {
      throw new AccountAuthError("invalid_oauth_identity", "OAuth provider subject is required.");
    }

    const currentProfile = await this.getProfile();
    const existingIdentity = await this.findOAuthIdentity(provider, providerSubject);

    if (existingIdentity) {
      if (existingIdentity.deactivated_at) {
        throw new AccountAuthError(
          "account_deactivated",
          "This profile is deactivated. Contact support to reactivate it.",
          403,
        );
      }

      if (
        currentProfile.authMethod !== "anonymous" &&
        currentProfile.id !== existingIdentity.profile_id
      ) {
        throw new AccountAuthError(
          "provider_already_linked",
          "This sign-in provider is already linked to another account.",
          409,
        );
      }

      if (
        currentProfile.authMethod === "anonymous" &&
        currentProfile.id !== existingIdentity.profile_id
      ) {
        await this.mergeProfiles(currentProfile.id, existingIdentity.profile_id, provider);
      }

      await this.updateOAuthIdentitySnapshot(existingIdentity.id, {
        email,
        emailVerified: input.emailVerified,
        displayName: input.displayName,
      });
      await this.attachInstallToProfile(existingIdentity.profile_id);
      await this.transferCurrentInstallQuotaToProfile(existingIdentity.profile_id);
      return this.createSession(existingIdentity.profile_id);
    }

    if (email && currentProfile.authMethod === "anonymous") {
      const emailOwner = await this.findProfileByEmail(email);
      if (emailOwner && emailOwner.id !== currentProfile.id) {
        throw new AccountAuthError(
          "email_already_registered",
          "Email already registered. Log in first to link this provider.",
          409,
        );
      }
    }

    if (currentProfile.authMethod !== "anonymous") {
      const existingProfileIdentity = await this.findOAuthIdentityForProfile(
        currentProfile.id,
        provider,
      );
      if (existingProfileIdentity) {
        throw new AccountAuthError(
          "provider_already_linked",
          `This account is already linked to a ${provider} identity.`,
          409,
        );
      }
    }

    const profile = await this.sql.begin(async (tx) => {
      let linkedProfile: Profile;

      if (currentProfile.authMethod === "anonymous") {
        const [updated] = await tx<Profile[]>`
          update profiles
          set
            auth_method = ${provider},
            email = coalesce(email, ${email ?? null}),
            provider_subject = ${`${provider}:${providerSubject}`},
            linked_at = now(),
            updated_at = now()
          where id = ${currentProfile.id}
          returning
            id::text,
            auth_method as "authMethod",
            email,
            timezone,
            linked_at::text as "linkedAt",
            created_at::text as "createdAt"
        `;
        linkedProfile = updated;

        await tx`
          insert into identity_link_events (profile_id, from_auth_method, to_auth_method, meals_count)
          values (
            ${linkedProfile.id},
            'anonymous',
            ${provider},
            (select count(*)::int from meals where profile_id = ${linkedProfile.id})
          )
        `;
      } else {
        linkedProfile = currentProfile;
      }

      await tx`
        insert into account_identities (
          profile_id,
          provider,
          provider_subject,
          email,
          email_verified,
          display_name
        )
        values (
          ${linkedProfile.id},
          ${provider},
          ${providerSubject},
          ${email ?? null},
          ${input.emailVerified ?? false},
          ${input.displayName ?? null}
        )
      `;

      return linkedProfile;
    });

    await this.attachInstallToProfile(profile.id);
    await this.transferCurrentInstallQuotaToProfile(profile.id);
    return this.createSession(profile.id);
  }

  async revokeSession(token: string): Promise<void> {
    await this.sql`
      update account_sessions
      set revoked_at = now()
      where token_hash = ${hashToken(token)}
    `;
    await this.resetCurrentInstallToAnonymousProfile();
  }

  async searchFoods(query: string) {
    const normalized = query.trim();
    if (!normalized) return [];

    await this.learnHistoricalConfirmedFoodsForQuery(normalized);

    const rows = await this.sql<
      (FoodRow & { aliases: string[]; matched_alias: string | null; score: number })[]
    >`
      with matched as (
        select
          foods.*,
          food_sources.name as source_name,
          array_remove(array_agg(distinct food_aliases.alias), null) as aliases,
          max(
            case
              when lower(foods.canonical_name) = lower(${normalized}) then 100
              when lower(foods.canonical_name) like lower(${normalized + "%"}) then 80
              when lower(foods.canonical_name) like lower(${"%" + normalized + "%"}) then 60
              when lower(food_aliases.alias) = lower(${normalized}) then 95
              when lower(food_aliases.alias) like lower(${normalized + "%"}) then 78
              when lower(food_aliases.alias) like lower(${"%" + normalized + "%"}) then 58
              else 0
            end
          ) as score,
          max(
            case
              when lower(food_aliases.alias) like lower(${"%" + normalized + "%"}) then food_aliases.alias
              else null
            end
          ) as matched_alias
        from foods
        left join food_sources on food_sources.id = foods.source_id
        left join food_aliases on food_aliases.food_id = foods.id
        group by foods.id, food_sources.name
      )
      select *
      from matched
      where score > 0
      order by score desc, canonical_name asc
      limit 20
    `;

    return Promise.all(
      rows.map(async (row) => ({
        ...(await this.foodFromRow(row)),
        matchedAlias: row.matched_alias ?? undefined,
        score: Number(row.score),
      })),
    );
  }

  async getFood(foodId: string): Promise<FoodRecord | undefined> {
    const [row] = await this.sql<(FoodRow & { aliases: string[] })[]>`
      select
        foods.*,
        food_sources.name as source_name,
        array_remove(array_agg(distinct food_aliases.alias), null) as aliases
      from foods
      left join food_sources on food_sources.id = foods.source_id
      left join food_aliases on food_aliases.food_id = foods.id
      where foods.id = ${foodId}
      group by foods.id, food_sources.name
      limit 1
    `;

    if (!row) return undefined;
    return this.foodFromRow(row);
  }

  private async getOrCreateQuota(profile: Profile): Promise<QuotaRow> {
    const installId = currentRequestIdentity().installId;
    if (this.usesInstallQuota(profile)) {
      if (!installId) throw new Error("install quota requires an install id");
      const [row] = await this.sql<QuotaRow[]>`
        insert into install_scan_credits (
          install_id,
          profile_id,
          free_remaining,
          rewarded_remaining,
          premium_remaining
        )
        values (${installId}, ${profile.id}, ${lifetimeFreeScanAllowance}, 0, 0)
        on conflict (install_id) do update
        set
          profile_id = excluded.profile_id,
          last_seen_at = now(),
          updated_at = now()
        returning free_remaining, rewarded_remaining, premium_remaining
      `;
      return row;
    }

    const [row] = await this.sql<QuotaRow[]>`
      insert into scan_credits (
        profile_id,
        local_date,
        free_remaining,
        rewarded_remaining,
        premium_remaining
      )
      select
        ${profile.id},
        ${lifetimeQuotaDate},
        greatest(
          0,
          ${lifetimeFreeScanAllowance} - count(quota_events.id) filter (
            where quota_events.event_type = 'consume'
              and quota_events.reason = 'free'
          )::integer
        ),
        0,
        0
      from profiles
      left join quota_events on quota_events.profile_id = profiles.id
      where profiles.id = ${profile.id}
      on conflict (profile_id, local_date) do update
        set updated_at = scan_credits.updated_at
      returning free_remaining, rewarded_remaining, premium_remaining
    `;
    return row;
  }

  async getQuota() {
    const profile = await this.getProfile();
    await this.applyAdSuspensionDailyCredits(profile);
    const quota = quotaFromRow(await this.getOrCreateQuota(profile));
    const subscription = await this.getSubscriptionStatusForProfile(profile);
    return {
      ...quota,
      premiumRemaining: quota.premiumRemaining + subscription.usage.premiumRemaining,
    };
  }

  async getSubscriptionStatus(): Promise<SubscriptionStatusState> {
    return this.getSubscriptionStatusForProfile(await this.getProfile());
  }

  async upsertSubscriptionEntitlement(
    input: UpsertSubscriptionEntitlementInput,
  ): Promise<SubscriptionStatusState> {
    if (!uuidPattern.test(input.appUserId)) {
      throw new AccountAuthError("profile_not_found", "Subscription profile was not found.", 404);
    }

    const [profile] = await this.sql<Profile[]>`
      select
        id::text,
        auth_method as "authMethod",
        email,
        timezone,
        linked_at::text as "linkedAt",
        created_at::text as "createdAt"
      from profiles
      where id = ${input.appUserId}
        and deactivated_at is null
      limit 1
    `;
    if (!profile) {
      throw new AccountAuthError("profile_not_found", "Subscription profile was not found.", 404);
    }

    await this.sql`
      insert into profile_subscription_entitlements (
        profile_id,
        provider,
        app_user_id,
        entitlement_id,
        status,
        store,
        product_id,
        current_period_start,
        current_period_end,
        will_renew,
        environment,
        latest_event_id,
        raw_payload
      )
      values (
        ${profile.id},
        'revenuecat',
        ${input.appUserId},
        ${input.entitlementId},
        ${input.status},
        ${input.store ?? null},
        ${input.productId ?? null},
        ${input.currentPeriodStart ?? null},
        ${input.currentPeriodEnd ?? null},
        ${input.willRenew ?? null},
        ${input.environment ?? null},
        ${input.latestEventId ?? null},
        ${this.sql.json(toJsonValue(input.rawPayload ?? {}))}
      )
      on conflict (profile_id) do update
        set
          provider = excluded.provider,
          app_user_id = excluded.app_user_id,
          entitlement_id = excluded.entitlement_id,
          status = excluded.status,
          store = excluded.store,
          product_id = excluded.product_id,
          current_period_start = excluded.current_period_start,
          current_period_end = excluded.current_period_end,
          will_renew = excluded.will_renew,
          environment = excluded.environment,
          latest_event_id = excluded.latest_event_id,
          raw_payload = excluded.raw_payload,
          updated_at = now()
    `;

    return this.getSubscriptionStatusForProfile(profile);
  }

  async recordSubscriptionEvent(input: RecordSubscriptionEventInput): Promise<boolean> {
    const [row] = await this.sql<{ id: string }[]>`
      insert into subscription_events (
        event_id,
        profile_id,
        provider,
        app_user_id,
        entitlement_id,
        event_type,
        product_id,
        store,
        environment,
        purchased_at,
        expiration_at,
        raw_payload
      )
      values (
        ${input.eventId},
        ${uuidPattern.test(input.appUserId) ? input.appUserId : null},
        'revenuecat',
        ${input.appUserId},
        ${input.entitlementId ?? null},
        ${input.eventType},
        ${input.productId ?? null},
        ${input.store ?? null},
        ${input.environment ?? null},
        ${input.purchasedAt ?? null},
        ${input.expirationAt ?? null},
        ${this.sql.json(toJsonValue(input.rawPayload))}
      )
      on conflict (event_id) do nothing
      returning event_id as id
    `;
    return Boolean(row);
  }

  async getRewardedAdProgress(
    dailyScanLimit = rewardedDailyScanLimit,
  ): Promise<RewardedAdProgressState> {
    const profile = await this.getProfile();
    const today = localDate();
    const ownerKey = this.quotaOwnerKey(profile);
    const [progress] = await this.sql<RewardedAdProgressRow[]>`
      select completed_ads, granted_scans
      from rewarded_ad_progress
      where quota_owner_key = ${ownerKey}
        and local_date = ${today}
      limit 1
    `;
    const completedAds = progress?.completed_ads ?? 0;
    const grantedScans = progress?.granted_scans ?? 0;
    const rewardState = calculateRewardedAdState({
      completedAds,
      grantedScans,
      dailyScanLimit,
    });

    return {
      adsWatchedToday: completedAds,
      adsNeededForNextScan: rewardState.adsNeededForNextScan,
      scansGrantedToday: grantedScans,
      dailyScanLimit,
      adsPerScan: rewardedAdsPerScan,
    };
  }

  async consumeCredit(reason: "free" | "rewarded" | "premium") {
    const profile = await this.getProfile();
    if (reason === "premium" && (await this.consumeSubscriptionPremiumCredit(profile))) {
      await this.sql`
        insert into quota_events (profile_id, event_type, reason, delta, local_date, install_id)
        values (
          ${profile.id},
          'consume',
          'premium_subscription',
          -1,
          ${localDateForTimezone(profile.timezone)},
          ${currentRequestIdentity().installId ?? null}
        )
      `;
      return this.getQuota();
    }

    const column =
      reason === "free"
        ? "free_remaining"
        : reason === "rewarded"
          ? "rewarded_remaining"
          : "premium_remaining";
    const identity = currentRequestIdentity();
    const today = localDate();
    const useInstallQuota = this.usesInstallQuota(profile);
    await this.getOrCreateQuota(profile);

    let rows: QuotaRow[];
    if (useInstallQuota) {
      if (!identity.installId) throw new Error("install quota requires an install id");
      rows = await this.sql<QuotaRow[]>`
          update install_scan_credits
          set
            profile_id = ${profile.id},
            ${this.sql(column)} = ${this.sql(column)} - 1,
            last_seen_at = now(),
            updated_at = now()
          where install_id = ${identity.installId}
            and ${this.sql(column)} > 0
          returning free_remaining, rewarded_remaining, premium_remaining
        `;
    } else {
      rows = await this.sql<QuotaRow[]>`
          update scan_credits
          set
            ${this.sql(column)} = ${this.sql(column)} - 1,
            updated_at = now()
          where profile_id = ${profile.id}
            and local_date = ${lifetimeQuotaDate}
            and ${this.sql(column)} > 0
          returning free_remaining, rewarded_remaining, premium_remaining
        `;
    }

    if (!rows[0]) throw new Error(`No ${reason} scan credit remaining`);

    await this.sql`
      insert into quota_events (profile_id, event_type, reason, delta, local_date, install_id)
      values (${profile.id}, 'consume', ${reason}, -1, ${today}, ${identity.installId ?? null})
    `;

    return quotaFromRow(rows[0]);
  }

  async recordRewardedAdServerVerification(
    input: RewardedAdServerVerificationInput,
  ): Promise<RewardedAdServerVerification> {
    const profileId = input.profileId && uuidPattern.test(input.profileId) ? input.profileId : null;
    const [row] = await this.sql<RewardedAdCallbackRow[]>`
      insert into rewarded_ad_callbacks (
        transaction_id,
        profile_id,
        raw_query,
        signature_key_id,
        verified_at
      )
      values (
        ${input.transactionId},
        ${profileId},
        ${this.sql.json(input.rawQuery)},
        ${input.signatureKeyId ?? null},
        now()
      )
      on conflict (transaction_id) do update
      set
        profile_id = coalesce(rewarded_ad_callbacks.profile_id, excluded.profile_id),
        raw_query = excluded.raw_query,
        signature_key_id = excluded.signature_key_id,
        verified_at = coalesce(rewarded_ad_callbacks.verified_at, excluded.verified_at)
      returning transaction_id, profile_id::text, raw_query
    `;

    return rewardedVerificationFromRow(row);
  }

  async findRewardedAdServerVerification(input: {
    profileId: string;
    customData: string;
  }): Promise<RewardedAdServerVerification | undefined> {
    const [row] = await this.sql<RewardedAdCallbackRow[]>`
      select transaction_id, profile_id::text, raw_query
      from rewarded_ad_callbacks
      where profile_id = ${input.profileId}
        and raw_query ->> 'custom_data' = ${input.customData}
        and verified_at is not null
      order by created_at desc
      limit 1
    `;

    return row ? rewardedVerificationFromRow(row) : undefined;
  }

  async completeRewardedAd(
    input: RewardedAdCompletionInput,
    dailyScanLimit = rewardedDailyScanLimit,
  ): Promise<RewardedAdCreditResult> {
    const profile = await this.getProfile();
    const identity = currentRequestIdentity();
    const today = localDate();
    const ownerKey = this.quotaOwnerKey(profile);
    const useInstallQuota = this.usesInstallQuota(profile);
    await this.getOrCreateQuota(profile);

    return this.sql.begin(async (tx) => {
      const eventRows = await tx<{ id: string }[]>`
        insert into rewarded_ad_events (
          profile_id,
          install_id,
          quota_owner_key,
          local_date,
          provider,
          placement,
          ad_unit_id,
          transaction_id,
          raw_payload
        )
        values (
          ${profile.id},
          ${identity.installId ?? null},
          ${ownerKey},
          ${today},
          ${input.provider},
          ${input.placement},
          ${input.adUnitId ?? null},
          ${input.transactionId ?? null},
          ${tx.json({
            rewardType: input.rewardType ?? null,
            rewardAmount: input.rewardAmount ?? null,
          })}
        )
        on conflict (provider, transaction_id) do nothing
        returning id::text
      `;

      let [progress] = eventRows[0]
        ? await tx<RewardedAdProgressRow[]>`
            insert into rewarded_ad_progress (
              quota_owner_key,
              profile_id,
              install_id,
              local_date,
              completed_ads,
              granted_scans
            )
            values (${ownerKey}, ${profile.id}, ${identity.installId ?? null}, ${today}, 1, 0)
            on conflict (quota_owner_key, local_date) do update
            set
              profile_id = excluded.profile_id,
              install_id = excluded.install_id,
              completed_ads = rewarded_ad_progress.completed_ads + 1,
              updated_at = now()
            returning completed_ads, granted_scans
          `
        : await tx<RewardedAdProgressRow[]>`
            select completed_ads, granted_scans
            from rewarded_ad_progress
            where quota_owner_key = ${ownerKey}
              and local_date = ${today}
            limit 1
          `;

      if (!progress) {
        [progress] = await tx<RewardedAdProgressRow[]>`
          insert into rewarded_ad_progress (
            quota_owner_key,
            profile_id,
            install_id,
            local_date,
            completed_ads,
            granted_scans
          )
          values (${ownerKey}, ${profile.id}, ${identity.installId ?? null}, ${today}, 0, 0)
          returning completed_ads, granted_scans
        `;
      }

      const currentRewardState = calculateRewardedAdState({
        completedAds: progress.completed_ads,
        grantedScans: progress.granted_scans,
        dailyScanLimit,
      });
      const scanGrant = Math.min(currentRewardState.grantableScans, 1);

      let quotaRow: QuotaRow;
      if (scanGrant > 0) {
        [progress] = await tx<RewardedAdProgressRow[]>`
          update rewarded_ad_progress
          set
            granted_scans = granted_scans + ${scanGrant},
            updated_at = now()
          where quota_owner_key = ${ownerKey}
            and local_date = ${today}
          returning completed_ads, granted_scans
        `;

        let quotaRows: QuotaRow[];
        if (useInstallQuota) {
          if (!identity.installId) throw new Error("install quota requires an install id");
          quotaRows = await tx<QuotaRow[]>`
              update install_scan_credits
              set
                profile_id = ${profile.id},
                rewarded_remaining = rewarded_remaining + ${scanGrant},
                last_seen_at = now(),
                updated_at = now()
              where install_id = ${identity.installId}
              returning free_remaining, rewarded_remaining, premium_remaining
            `;
        } else {
          quotaRows = await tx<QuotaRow[]>`
              update scan_credits
              set
                rewarded_remaining = rewarded_remaining + ${scanGrant},
                updated_at = now()
              where profile_id = ${profile.id}
                and local_date = ${lifetimeQuotaDate}
              returning free_remaining, rewarded_remaining, premium_remaining
            `;
        }
        quotaRow = quotaRows[0];

        await tx`
          insert into quota_events (profile_id, event_type, reason, delta, local_date, install_id)
          values (${profile.id}, 'grant', 'rewarded', ${scanGrant}, ${today}, ${identity.installId ?? null})
        `;
      } else {
        let quotaRows: QuotaRow[];
        if (useInstallQuota) {
          if (!identity.installId) throw new Error("install quota requires an install id");
          quotaRows = await tx<QuotaRow[]>`
              select free_remaining, rewarded_remaining, premium_remaining
              from install_scan_credits
              where install_id = ${identity.installId}
              limit 1
            `;
        } else {
          quotaRows = await tx<QuotaRow[]>`
              select free_remaining, rewarded_remaining, premium_remaining
              from scan_credits
              where profile_id = ${profile.id}
                and local_date = ${lifetimeQuotaDate}
              limit 1
            `;
        }
        quotaRow = quotaRows[0];
      }

      const rewardState = calculateRewardedAdState({
        completedAds: progress.completed_ads,
        grantedScans: progress.granted_scans,
        dailyScanLimit,
      });

      return {
        grantedScan: scanGrant > 0,
        adsWatchedToday: progress.completed_ads,
        adsNeededForNextScan: rewardState.adsNeededForNextScan,
        scansGrantedToday: progress.granted_scans,
        dailyScanLimit,
        adsPerScan: rewardedAdsPerScan,
        quota: quotaFromRow(quotaRow),
      };
    });
  }

  async registerPushToken(input: PushTokenRegistrationInput): Promise<PushTokenRegistrationResult> {
    const profile = await this.getProfile();
    const identity = currentRequestIdentity();
    const installId = identity.installId;
    if (!installId) {
      throw new AccountAuthError(
        "install_required",
        "Device install identity is required to register push notifications.",
        400,
      );
    }

    const platform = input.platform ?? identity.platform ?? "ios";
    const [row] = await this.sql<
      {
        profile_id: string;
        install_id: string;
        provider: "fcm" | "apns";
        platform: "ios" | "android";
        registered_at: string;
      }[]
    >`
      insert into push_notification_tokens (
        profile_id,
        install_id,
        provider,
        platform,
        token,
        token_hash,
        permission_status,
        locale,
        region,
        timezone,
        app_version,
        app_build,
        apns_sandbox
      )
      values (
        ${profile.id},
        ${installId},
        ${input.provider},
        ${platform},
        ${input.token},
        ${hashToken(input.token)},
        ${input.permissionStatus ?? "unknown"},
        ${identity.locale ?? null},
        ${identity.region ?? null},
        ${identity.timezone ?? null},
        ${identity.appVersion ?? null},
        ${identity.appBuild ?? null},
        ${input.apnsSandbox ?? null}
      )
      on conflict (provider, token_hash) do update
      set
        profile_id = excluded.profile_id,
        install_id = excluded.install_id,
        platform = excluded.platform,
        token = excluded.token,
        permission_status = excluded.permission_status,
        locale = excluded.locale,
        region = excluded.region,
        timezone = excluded.timezone,
        app_version = coalesce(excluded.app_version, push_notification_tokens.app_version),
        app_build = coalesce(excluded.app_build, push_notification_tokens.app_build),
        apns_sandbox = excluded.apns_sandbox,
        enabled = true,
        disabled_at = null,
        last_registered_at = now(),
        last_seen_at = now(),
        updated_at = now()
      returning
        profile_id::text,
        install_id,
        provider,
        platform,
        last_registered_at::text as registered_at
    `;

    return {
      profileId: row.profile_id,
      installId: row.install_id,
      provider: row.provider,
      platform: row.platform,
      registeredAt: row.registered_at,
    };
  }

  async createMeal(input: CreateMealInput) {
    const profile = await this.getProfile();
    const loggedAt = input.loggedAt ?? new Date().toISOString();
    const localDay = loggedAt.slice(0, 10);

    const meal = await this.sql.begin(async (tx) => {
      const [mealRow] = await tx<MealRow[]>`
        insert into meals (profile_id, meal_type, title, logged_at, local_date, source, scan_session_id)
        values (
          ${input.profileId ?? profile.id},
          ${input.mealType},
          ${input.title},
          ${loggedAt},
          ${localDay},
          ${input.source ?? "manual"},
          ${input.scanSessionId ?? null}
        )
        returning id::text, meal_type, title, logged_at
      `;

      for (const item of input.items) {
        const [itemRow] = await tx<{ id: string }[]>`
          insert into meal_items (meal_id, food_id, display_name, quantity, unit, grams, user_edited)
          values (
            ${mealRow.id},
            ${item.foodId ?? null},
            ${item.displayName},
            ${item.portion.quantity},
            ${item.portion.unit},
            ${item.portion.grams},
            true
          )
          returning id::text
        `;

        await tx`
          insert into nutrition_results (
            meal_item_id,
            meal_id,
            calories,
            protein_g,
            carbs_g,
            fat_g,
            fiber_g,
            sugar_g,
            sodium_mg
          )
          values (
            ${itemRow.id},
            ${mealRow.id},
            ${item.nutrition.calories},
            ${item.nutrition.proteinG},
            ${item.nutrition.carbsG},
            ${item.nutrition.fatG},
            ${item.nutrition.fiberG ?? null},
            ${item.nutrition.sugarG ?? null},
            ${item.nutrition.sodiumMg ?? null}
          )
        `;
      }

      return mealRow;
    });

    const created = await this.getMeal(meal.id);
    if (!created) throw new Error("Created meal could not be loaded");
    return created;
  }

  async updateMeal(mealId: string, input: UpdateMealInput) {
    const profile = await this.getProfile();

    const updated = await this.sql.begin(async (tx) => {
      const [mealRow] = await tx<MealRow[]>`
        update meals
        set
          meal_type = ${input.mealType},
          title = ${input.title},
          updated_at = now()
        where id = ${mealId}
          and profile_id = ${profile.id}
        returning id::text, meal_type, title, logged_at
      `;
      if (!mealRow) return undefined;

      await tx`
        delete from meal_items
        where meal_id = ${mealId}
      `;

      for (const item of input.items) {
        const [itemRow] = await tx<{ id: string }[]>`
          insert into meal_items (meal_id, food_id, display_name, quantity, unit, grams, user_edited)
          values (
            ${mealId},
            ${item.foodId ?? null},
            ${item.displayName},
            ${item.portion.quantity},
            ${item.portion.unit},
            ${item.portion.grams},
            true
          )
          returning id::text
        `;

        await tx`
          insert into nutrition_results (
            meal_item_id,
            meal_id,
            calories,
            protein_g,
            carbs_g,
            fat_g,
            fiber_g,
            sugar_g,
            sodium_mg
          )
          values (
            ${itemRow.id},
            ${mealId},
            ${item.nutrition.calories},
            ${item.nutrition.proteinG},
            ${item.nutrition.carbsG},
            ${item.nutrition.fatG},
            ${item.nutrition.fiberG ?? null},
            ${item.nutrition.sugarG ?? null},
            ${item.nutrition.sodiumMg ?? null}
          )
        `;
      }

      return mealRow;
    });

    if (!updated) return undefined;
    return this.mealFromRow(updated);
  }

  async attachMealImage(mealId: string, input: AttachMealImageInput) {
    const profile = await this.getProfile();
    const [meal] = await this.sql<MealRow[]>`
      select id::text, meal_type, title, logged_at
      from meals
      where id = ${mealId}
        and profile_id = ${profile.id}
      limit 1
    `;
    if (!meal) return undefined;

    await this.sql`
      insert into meal_images (
        meal_id,
        profile_id,
        bucket,
        object_key,
        mime_type,
        byte_size,
        width,
        height
      )
      values (
        ${mealId},
        ${profile.id},
        ${input.bucket},
        ${input.objectKey},
        ${input.mimeType},
        ${input.byteSize},
        ${input.width ?? null},
        ${input.height ?? null}
      )
      on conflict (meal_id) do update
      set
        bucket = excluded.bucket,
        object_key = excluded.object_key,
        mime_type = excluded.mime_type,
        byte_size = excluded.byte_size,
        width = excluded.width,
        height = excluded.height,
        updated_at = now()
    `;

    return this.mealFromRow(meal);
  }

  async learnFoodsFromConfirmedScan(input: LearnFoodsFromConfirmedScanInput): Promise<void> {
    const candidates = buildConfirmedScanLearnedFoodCandidates(input);
    if (candidates.length === 0) return;

    await this.sql.begin(async (tx) => {
      for (const candidate of candidates) {
        await this.upsertLearnedFoodCandidate(tx, candidate);
      }
    });
  }

  private async learnHistoricalConfirmedFoodsForQuery(query: string): Promise<void> {
    const normalizedQuery = normalizeFoodText(query);
    if (normalizedQuery.length < 2) return;

    const rows = await this.sql<HistoricalConfirmedFoodRow[]>`
      with base as (
        select
          meal_items.display_name,
          array_remove(
            array_append(coalesce(ai_predicted_items.aliases, '{}'::text[]), ai_predicted_items.name),
            null
          ) as aliases,
          meal_items.quantity,
          meal_items.unit,
          meal_items.grams,
          ai_predicted_items.confidence,
          nutrition_results.calories,
          nutrition_results.protein_g,
          nutrition_results.carbs_g,
          nutrition_results.fat_g,
          nutrition_results.fiber_g,
          nutrition_results.sugar_g,
          nutrition_results.sodium_mg,
          meal_items.created_at,
          btrim(regexp_replace(lower(meal_items.display_name), '[^a-z0-9]+', ' ', 'g')) as normalized_display_name,
          btrim(regexp_replace(lower(ai_predicted_items.name), '[^a-z0-9]+', ' ', 'g')) as normalized_ai_name
        from meals
        join meal_items on meal_items.meal_id = meals.id
        join nutrition_results on nutrition_results.meal_item_id = meal_items.id
        join ai_predictions on ai_predictions.scan_session_id = meals.scan_session_id
        join ai_predicted_items on ai_predicted_items.ai_prediction_id = ai_predictions.id
        left join ai_provider_runs on ai_provider_runs.id = ai_predictions.provider_run_id
        where meals.source = 'ai_scan'
          and meals.scan_session_id is not null
          and ai_predicted_items.confidence >= 0.9
          and coalesce(ai_provider_runs.provider, '') <> 'mock'
          and meal_items.grams >= 5
          and meal_items.grams <= 2000
          and nutrition_results.calories > 0
      )
      select
        display_name,
        aliases,
        quantity,
        unit,
        grams,
        confidence,
        calories,
        protein_g,
        carbs_g,
        fat_g,
        fiber_g,
        sugar_g,
        sodium_mg
      from base
      where (
          normalized_display_name = normalized_ai_name
          or normalized_display_name like '%' || normalized_ai_name || '%'
          or normalized_ai_name like '%' || normalized_display_name || '%'
        )
        and (
          normalized_display_name = ${normalizedQuery}
          or normalized_ai_name = ${normalizedQuery}
          or normalized_display_name like ${`${normalizedQuery}%`}
          or normalized_ai_name like ${`${normalizedQuery}%`}
          or normalized_display_name like ${`%${normalizedQuery}%`}
          or normalized_ai_name like ${`%${normalizedQuery}%`}
          or exists (
            select 1
            from unnest(aliases) as alias
            where btrim(regexp_replace(lower(alias), '[^a-z0-9]+', ' ', 'g')) = ${normalizedQuery}
               or btrim(regexp_replace(lower(alias), '[^a-z0-9]+', ' ', 'g')) like ${`${normalizedQuery}%`}
               or btrim(regexp_replace(lower(alias), '[^a-z0-9]+', ' ', 'g')) like ${`%${normalizedQuery}%`}
          )
        )
      order by
        case
          when normalized_display_name = ${normalizedQuery} then 94
          when normalized_ai_name = ${normalizedQuery} then 92
          when normalized_display_name like ${`${normalizedQuery}%`} then 76
          when normalized_ai_name like ${`${normalizedQuery}%`} then 74
          else 54
        end desc,
        confidence desc,
        created_at desc
      limit 40
    `;

    const candidates = new Map<string, LearnedFoodCandidate>();
    for (const row of rows) {
      const candidate = buildLearnedFoodCandidate({
        name: row.display_name,
        aliases: row.aliases,
        region: currentRequestIdentity().region,
        quantity: Number(row.quantity),
        unit: row.unit,
        grams: Number(row.grams),
        confidence: Number(row.confidence),
        nutrition: {
          calories: Number(row.calories),
          proteinG: Number(row.protein_g),
          carbsG: Number(row.carbs_g),
          fatG: Number(row.fat_g),
          fiberG: row.fiber_g === null ? undefined : Number(row.fiber_g),
          sugarG: row.sugar_g === null ? undefined : Number(row.sugar_g),
          sodiumMg: row.sodium_mg === null ? undefined : Number(row.sodium_mg),
        },
      });
      if (!candidate) continue;

      const key = normalizeFoodText(candidate.canonicalName);
      const existing = candidates.get(key);
      if (!existing || candidate.portion.confidence > existing.portion.confidence) {
        candidates.set(key, candidate);
      }
    }

    if (candidates.size === 0) return;

    await this.sql.begin(async (tx) => {
      for (const candidate of candidates.values()) {
        await this.upsertLearnedFoodCandidate(tx, candidate);
      }
    });
  }

  private async getOrCreateLearnedFoodSource(tx: SqlExecutor): Promise<string> {
    const [existingSource] = await tx<{ id: string }[]>`
      select id::text
      from food_sources
      where name = 'LogMyPlate learned'
      limit 1
    `;
    const sourceId =
      existingSource?.id ??
      (
        await tx<{ id: string }[]>`
          insert into food_sources (name, source_kind, license_note, url)
          values (
            'LogMyPlate learned',
            'ai_confirmed',
            'High-confidence AI food predictions confirmed by LogMyPlate users.',
            'https://logmyplate.app'
          )
          returning id::text
        `
      )[0]?.id;

    if (!sourceId) throw new Error("learned food source could not be created");
    return sourceId;
  }

  private async upsertLearnedFoodCandidate(
    tx: SqlExecutor,
    candidate: LearnedFoodCandidate,
  ): Promise<void> {
    const sourceId = await this.getOrCreateLearnedFoodSource(tx);
    const normalizedName = normalizeFoodText(candidate.canonicalName);
    const [existingFood] = await tx<{ id: string }[]>`
      select foods.id::text as id
      from foods
      left join food_sources on food_sources.id = foods.source_id
      left join food_aliases on food_aliases.food_id = foods.id
      where
        btrim(regexp_replace(lower(foods.canonical_name), '[^a-z0-9]+', ' ', 'g')) = ${normalizedName}
        or btrim(regexp_replace(lower(coalesce(food_aliases.alias, '')), '[^a-z0-9]+', ' ', 'g')) = ${normalizedName}
      order by
        case
          when food_sources.name = 'LogMyPlate seed' then 0
          when food_sources.name = 'LogMyPlate learned' then 1
          else 2
        end,
        foods.created_at asc
      limit 1
    `;

    const foodId =
      existingFood?.id ??
      (
        await tx<{ id: string }[]>`
          insert into foods (
            canonical_name,
            region,
            source_id,
            source_food_id,
            calories_per_100g,
            protein_g_per_100g,
            carbs_g_per_100g,
            fat_g_per_100g,
            fiber_g_per_100g,
            sugar_g_per_100g,
            sodium_mg_per_100g
          )
          values (
            ${candidate.canonicalName},
            ${candidate.region},
            ${sourceId},
            ${`learned:${normalizedName}`},
            ${candidate.nutritionPer100g.calories},
            ${candidate.nutritionPer100g.proteinG},
            ${candidate.nutritionPer100g.carbsG},
            ${candidate.nutritionPer100g.fatG},
            ${candidate.nutritionPer100g.fiberG ?? null},
            ${candidate.nutritionPer100g.sugarG ?? null},
            ${candidate.nutritionPer100g.sodiumMg ?? null}
          )
          returning id::text
        `
      )[0]?.id;

    if (!foodId) return;

    for (const alias of candidate.aliases) {
      await tx`
        insert into food_aliases (food_id, alias, locale)
        values (${foodId}, ${alias}, 'ai-confirmed')
        on conflict (food_id, alias, locale) do nothing
      `;
    }

    await tx`
      insert into portion_conversions (food_id, unit, grams, source, confidence)
      select
        ${foodId},
        ${candidate.portion.unit}::portion_unit,
        ${candidate.portion.grams},
        'logmyplate_learned',
        ${candidate.portion.confidence}
      where not exists (
        select 1
        from portion_conversions
        where food_id = ${foodId}
          and unit = ${candidate.portion.unit}::portion_unit
          and abs(grams - ${candidate.portion.grams}) <= 5
      )
    `;
  }

  async listMeals(input: ListMealsInput = {}) {
    const profile = await this.getProfile();
    const fromDate = input.fromDate ?? null;
    const toDate = input.toDate ?? null;
    const limit = input.limit ?? 100;
    const rows = await this.sql<MealRow[]>`
      select id::text, meal_type, title, logged_at
      from meals
      where profile_id = ${profile.id}
        and (${fromDate}::date is null or local_date >= ${fromDate})
        and (${toDate}::date is null or local_date <= ${toDate})
      order by logged_at desc
      limit ${limit}
    `;

    const meals = await Promise.all(rows.map((row) => this.mealFromRow(row)));
    return meals;
  }

  async summarizeMealsByDate(input: ListMealsInput = {}) {
    const profile = await this.getProfile();
    const fromDate = input.fromDate ?? null;
    const toDate = input.toDate ?? null;
    const rows = await this.sql<DailyMealAggregateRow[]>`
      select
        meals.local_date::text,
        count(distinct meals.id)::int as meal_count,
        coalesce(sum(nutrition_results.calories), 0)::text as calories,
        coalesce(sum(nutrition_results.protein_g), 0)::text as protein_g,
        coalesce(sum(nutrition_results.carbs_g), 0)::text as carbs_g,
        coalesce(sum(nutrition_results.fat_g), 0)::text as fat_g,
        coalesce(sum(nutrition_results.fiber_g), 0)::text as fiber_g,
        coalesce(sum(nutrition_results.sugar_g), 0)::text as sugar_g,
        coalesce(sum(nutrition_results.sodium_mg), 0)::text as sodium_mg
      from meals
      left join meal_items on meal_items.meal_id = meals.id
      left join nutrition_results on nutrition_results.meal_item_id = meal_items.id
      where meals.profile_id = ${profile.id}
        and (${fromDate}::date is null or meals.local_date >= ${fromDate})
        and (${toDate}::date is null or meals.local_date <= ${toDate})
      group by meals.local_date
      order by meals.local_date asc
    `;

    return rows.map((row) => ({
      date: row.local_date,
      mealCount: row.meal_count,
      totals: {
        calories: Math.round(Number(row.calories ?? 0)),
        proteinG: Number(row.protein_g ?? 0),
        carbsG: Number(row.carbs_g ?? 0),
        fatG: Number(row.fat_g ?? 0),
        fiberG: Number(row.fiber_g ?? 0),
        sugarG: Number(row.sugar_g ?? 0),
        sodiumMg: Math.round(Number(row.sodium_mg ?? 0)),
      },
    }));
  }

  async listMealDates() {
    const profile = await this.getProfile();
    const rows = await this.sql<{ date: string }[]>`
      select distinct local_date::text as date
      from meals
      where profile_id = ${profile.id}
      order by date desc
    `;
    return rows.map((row) => row.date);
  }

  async getMeal(mealId: string) {
    const profile = await this.getProfile();
    const [meal] = await this.sql<MealRow[]>`
      select id::text, meal_type, title, logged_at
      from meals
      where id = ${mealId}
        and profile_id = ${profile.id}
      limit 1
    `;

    if (!meal) return undefined;
    return this.mealFromRow(meal);
  }

  async getMealDeletionPlan(mealId: string): Promise<MealDeletionPlan | undefined> {
    const profile = await this.getProfile();
    const [row] = await this.sql<
      {
        meal_id: string;
        scan_session_id: string | null;
      }[]
    >`
      select
        meals.id::text as meal_id,
        meals.scan_session_id::text
      from meals
      where meals.id = ${mealId}
        and meals.profile_id = ${profile.id}
      limit 1
    `;
    if (!row) return undefined;

    const storedObjects = await this.sql<{ bucket: string; object_key: string }[]>`
      select distinct bucket, object_key
      from (
        select meal_images.bucket, meal_images.object_key
        from meal_images
        where meal_images.meal_id = ${row.meal_id}
          and meal_images.profile_id = ${profile.id}

        union all

        select scan_sessions.image_bucket as bucket, scan_sessions.image_object_key as object_key
        from scan_sessions
        where scan_sessions.id = ${row.scan_session_id}::uuid
          and scan_sessions.profile_id = ${profile.id}
          and scan_sessions.image_bucket is not null
          and scan_sessions.image_object_key is not null
      ) meal_objects
      where bucket is not null
        and object_key is not null
    `;

    return {
      mealId: row.meal_id,
      scanSessionId: row.scan_session_id ?? undefined,
      storedObjects: storedObjects.map((object) => ({
        bucket: object.bucket,
        objectKey: object.object_key,
      })),
    };
  }

  async deleteMeal(mealId: string) {
    const profile = await this.getProfile();
    return this.sql.begin(async (tx) => {
      const [deleted] = await tx<{ scan_session_id: string | null }[]>`
        delete from meals
        where id = ${mealId}
          and profile_id = ${profile.id}
        returning scan_session_id::text
      `;
      if (!deleted) return false;

      if (deleted.scan_session_id) {
        await tx`
          update scan_sessions
          set
            profile_id = null,
            consumed_credit_reason = null,
            user_hint = null,
            image_width = null,
            image_height = null,
            image_mime_type = null,
            image_byte_size = null,
            image_bucket = null,
            image_object_key = null,
            image_hash = null,
            image_hash_algorithm = null,
            updated_at = now()
          where id = ${deleted.scan_session_id}
            and profile_id = ${profile.id}
        `;
      }

      return true;
    });
  }

  async prepareScan(profileId?: string) {
    const profile = await this.getProfile();
    const identity = currentRequestIdentity();
    const [scan] = await this.sql<ScanSession[]>`
      insert into scan_sessions (
        profile_id,
        install_id,
        platform,
        app_version,
        app_build,
        status
      )
      values (
        ${profileId ?? profile.id},
        ${identity.installId ?? null},
        ${identity.platform ?? null},
        ${identity.appVersion ?? null},
        ${identity.appBuild ?? null},
        'prepared'
      )
      returning
        id::text,
        profile_id::text as "profileId",
        install_id as "installId",
        platform,
        app_version as "appVersion",
        app_build as "appBuild",
        status,
        consumed_credit_reason as "creditReason",
        created_at::text as "createdAt"
    `;
    await this.incrementPlatformDailyMetrics(this.sql, {
      platform: identity.platform,
      appVersion: identity.appVersion,
      appBuild: identity.appBuild,
      scansPrepared: 1,
    });
    return scan;
  }

  async getScan(scanId: string) {
    const profile = await this.getProfile();
    const [scan] = await this.sql<ScanRow[]>`
      select
        scan_sessions.id::text,
        scan_sessions.profile_id::text,
        scan_sessions.install_id,
        scan_sessions.platform,
        scan_sessions.app_version,
        scan_sessions.app_build,
        scan_sessions.status,
        scan_sessions.consumed_credit_reason,
        scan_sessions.user_hint,
        scan_sessions.image_mime_type,
        scan_sessions.image_byte_size,
        scan_sessions.image_bucket,
        scan_sessions.image_object_key,
        scan_sessions.image_hash,
        scan_sessions.image_hash_algorithm,
        scan_sessions.created_at::text,
        case
          when ai_predictions.raw_ai_json ? 'analysis'
            then ai_predictions.raw_ai_json -> 'analysis'
          else ai_predictions.raw_ai_json
        end as analyzed_response
      from scan_sessions
      left join lateral (
        select raw_ai_json
        from ai_predictions
        where ai_predictions.scan_session_id = scan_sessions.id
        order by ai_predictions.created_at desc
        limit 1
      ) ai_predictions on true
      where scan_sessions.id = ${scanId}
        and scan_sessions.profile_id = ${profile.id}
      limit 1
    `;
    return scan ? this.scanFromRow(scan) : undefined;
  }

  async updateScan(scan: ScanSession) {
    await this.sql.begin(async (tx) => {
      const [existing] = await tx<
        {
          status: ScanSession["status"];
          install_id: string | null;
          platform: AppPlatform | null;
          app_version: string | null;
          app_build: number | null;
          created_at: string;
        }[]
      >`
        select
          status,
          install_id,
          platform,
          app_version,
          app_build,
          created_at::text
        from scan_sessions
        where id = ${scan.id}
        for update
      `;
      if (!existing) return;

      const scanPlatform = scan.platform ?? existing.platform;
      const scanAppVersion = scan.appVersion ?? existing.app_version;
      const scanAppBuild = scan.appBuild ?? existing.app_build;

      await tx`
        update scan_sessions
        set
          status = ${scan.status},
          install_id = coalesce(${scan.installId ?? null}, install_id),
          platform = coalesce(${scanPlatform ?? null}, platform),
          app_version = coalesce(${scanAppVersion ?? null}, app_version),
          app_build = coalesce(${scanAppBuild ?? null}, app_build),
          consumed_credit_reason = ${scan.creditReason ?? null},
          user_hint = coalesce(${scan.userHint ?? null}, user_hint),
          image_mime_type = coalesce(${scan.imageMimeType ?? null}, image_mime_type),
          image_byte_size = coalesce(${scan.imageByteSize ?? null}, image_byte_size),
          image_bucket = coalesce(${scan.imageBucket ?? null}, image_bucket),
          image_object_key = coalesce(${scan.imageObjectKey ?? null}, image_object_key),
          image_hash = coalesce(${scan.imageHash ?? null}, image_hash),
          image_hash_algorithm = coalesce(${scan.imageHashAlgorithm ?? null}, image_hash_algorithm),
          updated_at = now()
        where id = ${scan.id}
      `;

      let shouldPersistPrediction = false;
      if (scan.analyzedResponse && scan.aiProviderRun) {
        shouldPersistPrediction = true;
      } else if (scan.analyzedResponse) {
        const [existingPrediction] = await tx<{ exists: boolean }[]>`
          select true as exists
          from ai_predictions
          where scan_session_id = ${scan.id}
          limit 1
        `;
        shouldPersistPrediction = !existingPrediction;
      }

      if (scan.analyzedResponse && shouldPersistPrediction) {
        await tx`
          delete from ai_predictions
          where scan_session_id = ${scan.id}
        `;

        const providerRun = scan.aiProviderRun;
        const [run] = providerRun
          ? await tx<{ id: string | null }[]>`
              insert into ai_provider_runs (
                scan_session_id,
                install_id,
                platform,
                app_version,
                app_build,
                local_date,
                provider,
                model,
                prompt_version,
                schema_version,
                input_token_estimate,
                output_token_estimate,
                estimated_cost_usd,
                latency_ms,
                success
              )
              values (
                ${scan.id},
                ${scan.installId ?? existing.install_id},
                ${scanPlatform ?? null},
                ${scanAppVersion ?? null},
                ${scanAppBuild ?? null},
                (now() at time zone 'Asia/Kolkata')::date,
                ${providerRun.provider},
                ${providerRun.model},
                ${providerRun.promptVersion},
                ${providerRun.schemaVersion},
                ${providerRun.inputTokenEstimate ?? null},
                ${providerRun.outputTokenEstimate ?? null},
                ${providerRun.estimatedCostUsd ?? null},
                ${providerRun.latencyMs ?? null},
                true
              )
              returning id::text
            `
          : [{ id: null }];

        if (providerRun) {
          await this.incrementPlatformDailyMetrics(tx, {
            platform: scanPlatform,
            appVersion: scanAppVersion,
            appBuild: scanAppBuild,
            aiRuns: 1,
            aiSuccess: 1,
            inputTokens: providerRun.inputTokenEstimate ?? 0,
            outputTokens: providerRun.outputTokenEstimate ?? 0,
            estimatedCostUsd: providerRun.estimatedCostUsd ?? 0,
          });
        }

        const response = scan.analyzedResponse as {
          detectedLanguage?: string;
          items?: Array<{
            name: string;
            aliases?: string[];
            quantity: number;
            unit: PortionUnit;
            estimatedGrams: number;
            confidence: number;
          }>;
        };
        const rawAiJson = providerRun?.rawResponse
          ? {
              analysis: scan.analyzedResponse,
              providerResponse: providerRun.rawResponse,
            }
          : scan.analyzedResponse;
        const items = response.items ?? [];
        const totalConfidence =
          items.length === 0
            ? null
            : items.reduce((total, item) => total + item.confidence, 0) / items.length;

        const [prediction] = await tx<{ id: string }[]>`
          insert into ai_predictions (
            scan_session_id,
            provider_run_id,
            detected_language,
            raw_ai_json,
            total_confidence
          )
          values (
            ${scan.id},
            ${run.id},
            ${response.detectedLanguage ?? null},
            ${tx.json(toJsonValue(rawAiJson))},
            ${totalConfidence}
          )
          returning id::text
        `;

        for (const item of items) {
          await tx`
            insert into ai_predicted_items (
              ai_prediction_id,
              name,
              aliases,
              quantity,
              unit,
              estimated_grams,
              confidence
            )
            values (
              ${prediction.id},
              ${item.name},
              ${item.aliases ?? []},
              ${item.quantity},
              ${item.unit},
              ${item.estimatedGrams},
              ${item.confidence}
            )
          `;
        }
      }

      if (existing.status !== scan.status) {
        await this.incrementPlatformDailyMetrics(tx, {
          platform: scanPlatform,
          appVersion: scanAppVersion,
          appBuild: scanAppBuild,
          sourceTimestamp: existing.created_at,
          scansReadyForReview: scan.status === "ready_for_review" ? 1 : 0,
          scansConfirmed: scan.status === "confirmed" ? 1 : 0,
          scansFailed: scan.status === "failed" ? 1 : 0,
        });
      }
    });
  }

  async findScanAnalysisCache(input: {
    profileId: string;
    imageHash: string;
    hashAlgorithm: ScanAnalysisCacheRecord["hashAlgorithm"];
  }) {
    const [cached] = await this.sql<ScanAnalysisCacheRow[]>`
      select
        profile_id::text,
        image_hash,
        hash_algorithm,
        image_mime_type,
        image_byte_size,
        analyzed_response,
        created_at::text,
        updated_at::text
      from scan_analysis_cache
      where profile_id = ${input.profileId}
        and hash_algorithm = ${input.hashAlgorithm}
        and image_hash = ${input.imageHash}
      limit 1
    `;
    return cached ? this.scanAnalysisCacheFromRow(cached) : undefined;
  }

  async upsertScanAnalysisCache(input: UpsertScanAnalysisCacheInput) {
    const [cached] = await this.sql<ScanAnalysisCacheRow[]>`
      insert into scan_analysis_cache (
        profile_id,
        image_hash,
        hash_algorithm,
        image_mime_type,
        image_byte_size,
        analyzed_response
      )
      values (
        ${input.profileId},
        ${input.imageHash},
        ${input.hashAlgorithm},
        ${input.imageMimeType ?? null},
        ${input.imageByteSize ?? null},
        ${this.sql.json(toJsonValue(input.analyzedResponse))}
      )
      on conflict (profile_id, hash_algorithm, image_hash) do update
      set
        image_mime_type = excluded.image_mime_type,
        image_byte_size = excluded.image_byte_size,
        analyzed_response = excluded.analyzed_response,
        updated_at = now()
      returning
        profile_id::text,
        image_hash,
        hash_algorithm,
        image_mime_type,
        image_byte_size,
        analyzed_response,
        created_at::text,
        updated_at::text
    `;
    return this.scanAnalysisCacheFromRow(cached);
  }

  async countNoFoodScanAttemptsSince(sinceIso: string) {
    const profile = await this.getProfile();
    const [row] = await this.sql<{ count: number | string }[]>`
      with latest_reset as (
        select reset_at
        from no_food_scan_limit_resets
        where profile_id = ${profile.id}
        order by reset_at desc
        limit 1
      )
      select count(*)::integer as count
      from scan_sessions
      inner join lateral (
        select raw_ai_json
        from ai_predictions
        where ai_predictions.scan_session_id = scan_sessions.id
        order by ai_predictions.created_at desc
        limit 1
      ) ai_predictions on true
      where scan_sessions.profile_id = ${profile.id}
        and scan_sessions.created_at >= greatest(
          ${sinceIso}::timestamptz,
          coalesce((select reset_at from latest_reset), ${sinceIso}::timestamptz)
        )
        and jsonb_array_length(
          case
            when jsonb_typeof(ai_predictions.raw_ai_json -> 'analysis' -> 'items') = 'array'
              then ai_predictions.raw_ai_json -> 'analysis' -> 'items'
            when jsonb_typeof(ai_predictions.raw_ai_json -> 'items') = 'array'
              then ai_predictions.raw_ai_json -> 'items'
            else '[]'::jsonb
          end
        ) = 0
    `;

    return Number(row?.count ?? 0);
  }

  async getIdempotent(key: string): Promise<IdempotencyRecord | undefined> {
    const profile = await this.getProfile();
    const [row] = await this.sql<
      { response_status: number; response_body: unknown; created_at: string }[]
    >`
      select response_status, response_body, created_at::text
      from idempotency_keys
      where profile_id = ${profile.id}
        and idempotency_key = ${key}
        and created_at > now() - interval '24 hours'
      limit 1
    `;

    if (!row) return undefined;

    return {
      responseStatus: row.response_status,
      responseBody: row.response_body,
      createdAt: new Date(row.created_at).getTime(),
    };
  }

  async setIdempotent(key: string, record: Omit<IdempotencyRecord, "createdAt">): Promise<void> {
    await this.sql`
      insert into idempotency_keys (
        idempotency_key,
        response_status,
        response_body
      )
      values (
        ${key},
        ${record.responseStatus},
        ${this.sql.json(toJsonValue(record.responseBody) ?? {})}
      )
      on conflict (idempotency_key) do nothing
    `;
  }

  async getAiPrompt(key: string): Promise<string | undefined> {
    const [row] = await this.sql<{ body: string }[]>`
      select body
      from ai_prompt_versions
      where key = ${key}
        and is_active = true
      order by created_at desc
      limit 1
    `;
    return row?.body;
  }

  private async findCredentialByEmail(email: string) {
    const [credential] = await this.sql<
      {
        profile_id: string;
        email: string;
        password_salt: string;
        password_hash: string;
        deactivated_at: string | null;
      }[]
    >`
      select
        account_password_credentials.profile_id::text,
        account_password_credentials.email,
        account_password_credentials.password_salt,
        account_password_credentials.password_hash,
        profiles.deactivated_at::text
      from account_password_credentials
      inner join profiles on profiles.id = account_password_credentials.profile_id
      where account_password_credentials.email = ${email}
      limit 1
    `;
    return credential;
  }

  private async findOAuthIdentity(
    provider: OAuthAccountInput["provider"],
    providerSubject: string,
  ) {
    const [identity] = await this.sql<
      {
        id: string;
        profile_id: string;
        deactivated_at: string | null;
      }[]
    >`
      select
        account_identities.id::text,
        account_identities.profile_id::text,
        profiles.deactivated_at::text
      from account_identities
      inner join profiles on profiles.id = account_identities.profile_id
      where account_identities.provider = ${provider}
        and account_identities.provider_subject = ${providerSubject}
      limit 1
    `;
    return identity;
  }

  private async findOAuthIdentityForProfile(
    profileId: string,
    provider: OAuthAccountInput["provider"],
  ) {
    const [identity] = await this.sql<{ id: string }[]>`
      select id::text
      from account_identities
      where profile_id = ${profileId}
        and provider = ${provider}
      limit 1
    `;
    return identity;
  }

  private async findProfileByEmail(email: string): Promise<Profile | undefined> {
    const [profile] = await this.sql<Profile[]>`
      select
        id::text,
        auth_method as "authMethod",
        email,
        timezone,
        linked_at::text as "linkedAt",
        created_at::text as "createdAt"
      from profiles
      where lower(email) = lower(${email})
      limit 1
    `;
    return profile;
  }

  private async findPasswordResetProfileByEmail(email: string) {
    const [profile] = await this.sql<{ id: string; email: string }[]>`
      select id::text, email
      from profiles
      where lower(email) = lower(${email})
        and auth_method <> 'anonymous'
        and deactivated_at is null
      limit 1
    `;
    return profile;
  }

  private async findOpenPasswordResetCode(email: string) {
    const [reset] = await this.sql<
      {
        id: string;
        profile_id: string;
        code_salt: string;
        code_hash: string;
        attempt_count: number;
      }[]
    >`
      select
        account_password_reset_codes.id::text,
        account_password_reset_codes.profile_id::text,
        account_password_reset_codes.code_salt,
        account_password_reset_codes.code_hash,
        account_password_reset_codes.attempt_count
      from account_password_reset_codes
      inner join profiles on profiles.id = account_password_reset_codes.profile_id
      where lower(account_password_reset_codes.email) = lower(${email})
        and account_password_reset_codes.consumed_at is null
        and account_password_reset_codes.expires_at > now()
        and profiles.deactivated_at is null
      order by account_password_reset_codes.created_at desc
      limit 1
    `;
    return reset;
  }

  private async updateOAuthIdentitySnapshot(
    identityId: string,
    input: Pick<OAuthAccountInput, "displayName" | "email" | "emailVerified">,
  ): Promise<void> {
    await this.sql`
      update account_identities
      set
        email = coalesce(${input.email ?? null}, email),
        email_verified = case
          when ${input.emailVerified ?? null}::boolean is null then email_verified
          else ${input.emailVerified ?? false}
        end,
        display_name = coalesce(${input.displayName ?? null}, display_name),
        updated_at = now()
      where id = ${identityId}
    `;
  }

  private async requireActiveAccountProfile(): Promise<Profile> {
    const identity = currentRequestIdentity();
    if (!identity.sessionToken) {
      throw new AccountAuthError("account_required", "Log in to manage your profile.", 401);
    }

    const profile = await this.getProfileForSession(identity.sessionToken);
    if (!profile || profile.authMethod === "anonymous") {
      throw new AccountAuthError("account_required", "Log in to manage your profile.", 401);
    }

    return profile;
  }

  private async createSession(profileId: string): Promise<AccountSession> {
    const accessToken = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + sessionDurationMs).toISOString();

    const [session] = await this.sql<(Profile & { accessToken: string; expiresAt: string })[]>`
      with created_session as (
        insert into account_sessions (profile_id, token_hash, expires_at)
        values (${profileId}, ${hashToken(accessToken)}, ${expiresAt})
        returning profile_id, expires_at::text as "expiresAt"
      )
      select
        profiles.id::text,
        profiles.auth_method as "authMethod",
        profiles.email,
        profiles.timezone,
        profiles.linked_at::text as "linkedAt",
        profiles.created_at::text as "createdAt",
        ${accessToken} as "accessToken",
        created_session."expiresAt"
      from created_session
      inner join profiles on profiles.id = created_session.profile_id
      limit 1
    `;

    return {
      profile: {
        id: session.id,
        authMethod: session.authMethod,
        email: session.email,
        timezone: session.timezone,
        linkedAt: session.linkedAt,
        createdAt: session.createdAt,
      },
      accessToken,
      expiresAt: session.expiresAt,
    };
  }

  private async getProfileForSession(token: string): Promise<Profile | undefined> {
    const [profile] = await this.sql<Profile[]>`
      select
        profiles.id::text,
        profiles.auth_method as "authMethod",
        profiles.email,
        profiles.timezone,
        profiles.linked_at::text as "linkedAt",
        profiles.created_at::text as "createdAt"
      from account_sessions
      inner join profiles on profiles.id = account_sessions.profile_id
      where account_sessions.token_hash = ${hashToken(token)}
        and account_sessions.revoked_at is null
        and account_sessions.expires_at > now()
        and profiles.deactivated_at is null
      limit 1
    `;
    return profile;
  }

  private async getAnonymousProfileForCurrentInstall(): Promise<Profile | undefined> {
    const installId = currentRequestIdentity().installId;
    if (!installId) return undefined;

    const profile = await this.getProfileForInstall(installId);
    return profile?.authMethod === "anonymous" ? profile : undefined;
  }

  private async getProfileForInstall(installId: string): Promise<Profile | undefined> {
    const [profile] = await this.sql<Profile[]>`
      select
        profiles.id::text,
        profiles.auth_method as "authMethod",
        profiles.email,
        profiles.timezone,
        profiles.linked_at::text as "linkedAt",
        profiles.created_at::text as "createdAt"
      from devices
      inner join profiles on profiles.id = devices.profile_id
      where devices.install_id = ${installId}
      limit 1
    `;
    return profile;
  }

  private usesInstallQuota(profile: Profile): boolean {
    return profile.authMethod === "anonymous" && Boolean(currentRequestIdentity().installId);
  }

  private quotaOwnerKey(profile: Profile): string {
    const installId = currentRequestIdentity().installId;
    return this.usesInstallQuota(profile) ? `install:${installId}` : `profile:${profile.id}`;
  }

  private async getSubscriptionStatusForProfile(
    profile: Profile,
  ): Promise<SubscriptionStatusState> {
    const [entitlement] = await this.sql<SubscriptionEntitlementRow[]>`
      select
        profile_id::text,
        app_user_id,
        entitlement_id,
        status,
        store,
        product_id,
        current_period_start::text,
        current_period_end::text,
        will_renew
      from profile_subscription_entitlements
      where profile_id = ${profile.id}
        and entitlement_id = ${config.revenueCat.entitlementId}
      limit 1
    `;

    const active = entitlement ? subscriptionEntitlementIsActive(entitlement) : false;
    const usage = active
      ? await this.getPremiumSubscriptionUsage(profile, entitlement)
      : emptySubscriptionUsage(
          config.revenueCat.premiumMonthlyScanLimit,
          config.revenueCat.premiumDailyScanLimit,
        );

    return {
      appUserId: entitlement?.app_user_id ?? profile.id,
      entitlementId: entitlement?.entitlement_id ?? config.revenueCat.entitlementId,
      active,
      status: entitlement?.status ?? "inactive",
      store: entitlement?.store ?? undefined,
      productId: entitlement?.product_id ?? undefined,
      currentPeriodStart: isoTimestamp(entitlement?.current_period_start),
      currentPeriodEnd: isoTimestamp(entitlement?.current_period_end),
      willRenew: entitlement?.will_renew ?? undefined,
      usage,
    };
  }

  private async getPremiumSubscriptionUsage(
    profile: Profile,
    entitlement: SubscriptionEntitlementRow,
  ): Promise<SubscriptionStatusState["usage"]> {
    const monthlyLimit = config.revenueCat.premiumMonthlyScanLimit;
    const dailyLimit = config.revenueCat.premiumDailyScanLimit;
    const { periodStart, periodEnd } = subscriptionPeriod(entitlement);
    const today = localDateForTimezone(profile.timezone);
    const [usage] = await this.sql<PremiumUsageRow[]>`
      select
        coalesce(sum(used), 0)::int as used_this_period,
        coalesce(sum(used) filter (where local_date = ${today}), 0)::int as used_today
      from premium_scan_usage
      where profile_id = ${profile.id}
        and period_start = ${periodStart}
        and period_end = ${periodEnd}
    `;

    return subscriptionUsageFromCounts(
      monthlyLimit,
      dailyLimit,
      usage?.used_this_period ?? 0,
      usage?.used_today ?? 0,
    );
  }

  private async consumeSubscriptionPremiumCredit(profile: Profile): Promise<boolean> {
    const status = await this.getSubscriptionStatusForProfile(profile);
    if (!status.active || status.usage.premiumRemaining <= 0) return false;

    const { periodStart, periodEnd } = subscriptionPeriod({
      appUserId: status.appUserId,
      entitlementId: status.entitlementId,
      status: status.status,
      currentPeriodStart: status.currentPeriodStart,
      currentPeriodEnd: status.currentPeriodEnd,
    });
    const today = localDateForTimezone(profile.timezone);
    await this.sql`
      insert into premium_scan_usage (profile_id, period_start, period_end, local_date, used)
      values (${profile.id}, ${periodStart}, ${periodEnd}, ${today}, 1)
      on conflict (profile_id, period_start, local_date) do update
        set
          used = premium_scan_usage.used + 1,
          period_end = excluded.period_end,
          updated_at = now()
    `;

    return true;
  }

  private async applyAdSuspensionDailyCredits(profile: Profile): Promise<void> {
    const policy = await loadEngagementPolicy(this.sql);
    const creditsPolicy = policy.rewardedAds.adSuspensionDailyCredits;
    if (!creditsPolicy.enabled) return;

    const nowMs = Date.now();
    if (creditsPolicy.startsAt && Date.parse(creditsPolicy.startsAt) > nowMs) return;
    if (creditsPolicy.endsAt && Date.parse(creditsPolicy.endsAt) < nowMs) return;

    const platform = await this.currentQuotaPlatform(profile);
    const targetFreeBalance =
      creditsPolicy.platformFreeScansPerDay[platform] ?? creditsPolicy.freeScansPerDay;
    if (targetFreeBalance <= 0) return;

    const identity = currentRequestIdentity();
    const useInstallQuota = this.usesInstallQuota(profile);
    const installId = useInstallQuota ? identity.installId : undefined;
    if (useInstallQuota && !installId) return;

    await this.getOrCreateQuota(profile);
    const today = localDateForTimezone(profile.timezone);
    await this.sql.begin(async (tx) => {
      const existing = await tx<{ id: string }[]>`
        select id::text
        from quota_events
        where profile_id = ${profile.id}
          and event_type = 'grant'
          and reason = ${adSuspensionDailyCreditReason}
          and local_date = ${today}
          and install_id is not distinct from ${installId ?? null}
        limit 1
      `;
      if (existing[0]) return;

      let quota: QuotaRow | undefined;
      if (useInstallQuota) {
        if (!installId) return;
        const rows = await tx<QuotaRow[]>`
          select free_remaining, rewarded_remaining, premium_remaining
          from install_scan_credits
          where install_id = ${installId}
          for update
        `;
        quota = rows[0];
      } else {
        const rows = await tx<QuotaRow[]>`
          select free_remaining, rewarded_remaining, premium_remaining
          from scan_credits
          where profile_id = ${profile.id}
            and local_date = ${lifetimeQuotaDate}
          for update
        `;
        quota = rows[0];
      }
      if (!quota) return;

      const creditDelta = targetFreeBalance - quota.free_remaining;
      if (creditDelta !== 0) {
        if (useInstallQuota) {
          if (!installId) return;
          await tx`
            update install_scan_credits
            set
              free_remaining = ${targetFreeBalance},
              last_seen_at = now(),
              updated_at = now()
            where install_id = ${installId}
          `;
        } else {
          await tx`
            update scan_credits
            set
              free_remaining = ${targetFreeBalance},
              updated_at = now()
            where profile_id = ${profile.id}
              and local_date = ${lifetimeQuotaDate}
          `;
        }
      }

      await tx`
        insert into quota_events (profile_id, event_type, reason, delta, local_date, install_id)
        values (
          ${profile.id},
          'grant',
          ${adSuspensionDailyCreditReason},
          ${creditDelta},
          ${today},
          ${installId ?? null}
        )
      `;
    });
  }

  private async currentQuotaPlatform(profile: Profile): Promise<AppPlatform> {
    const identity = currentRequestIdentity();
    if (identity.platform) return identity.platform;

    if (identity.installId) {
      const [device] = await this.sql<{ platform: AppPlatform | null }[]>`
        select platform
        from devices
        where install_id = ${identity.installId}
        limit 1
      `;
      if (device?.platform === "ios" || device?.platform === "android") return device.platform;
    }

    const [latestDevice] = await this.sql<{ platform: AppPlatform | null }[]>`
      select platform
      from devices
      where profile_id = ${profile.id}
        and platform in ('ios', 'android')
      order by last_seen_at desc
      limit 1
    `;
    if (latestDevice?.platform === "ios" || latestDevice?.platform === "android") {
      return latestDevice.platform;
    }

    return "android";
  }

  private async attachInstallToProfile(profileId: string): Promise<void> {
    const identity = currentRequestIdentity();
    if (!identity.installId) return;

    const [device] = await this.sql<
      {
        platform: AppPlatform;
        app_version: string | null;
        app_build: number | null;
        is_new_install: boolean;
      }[]
    >`
      with existing as (
        select install_id
        from devices
        where install_id = ${identity.installId}
      ),
      upserted as (
        insert into devices (
          profile_id,
          install_id,
          platform,
          locale,
          region,
          timezone,
          app_version,
          app_build
        )
        values (
          ${profileId},
          ${identity.installId},
          ${identity.platform ?? "ios"},
          ${identity.locale ?? null},
          ${identity.region ?? null},
          ${identity.timezone ?? null},
          ${identity.appVersion ?? null},
          ${identity.appBuild ?? null}
        )
        on conflict (install_id) do update
        set
          profile_id = excluded.profile_id,
          platform = excluded.platform,
          locale = excluded.locale,
          region = excluded.region,
          timezone = excluded.timezone,
          app_version = coalesce(excluded.app_version, devices.app_version),
          app_build = coalesce(excluded.app_build, devices.app_build),
          last_seen_at = now()
        returning platform, app_version, app_build
      )
      select
        upserted.platform,
        upserted.app_version,
        upserted.app_build,
        not exists (select 1 from existing) as is_new_install
      from upserted
    `;

    await this.recordInstallPlatformActivity(this.sql, {
      installId: identity.installId,
      platform: device?.platform,
      appVersion: device?.app_version,
      appBuild: device?.app_build,
      isNewInstall: device?.is_new_install,
    });
  }

  private async resetCurrentInstallToAnonymousProfile(): Promise<Profile | undefined> {
    const identity = currentRequestIdentity();
    const installId = identity.installId;
    if (!installId) return undefined;

    return this.sql.begin(async (tx) => {
      const [profile] = await tx<Profile[]>`
        insert into profiles (timezone, provider_subject)
        values (
          ${identity.timezone ?? "Asia/Kolkata"},
          ${`install:${installId}:logout:${randomUUID()}`}
        )
        returning
          id::text,
          auth_method as "authMethod",
          email,
          timezone,
          linked_at::text as "linkedAt",
          created_at::text as "createdAt"
      `;

      await tx`
        insert into devices (
          profile_id,
          install_id,
          platform,
          locale,
          region,
          timezone,
          app_version,
          app_build
        )
        values (
          ${profile.id},
          ${installId},
          ${identity.platform ?? "ios"},
          ${identity.locale ?? null},
          ${identity.region ?? null},
          ${identity.timezone ?? null},
          ${identity.appVersion ?? null},
          ${identity.appBuild ?? null}
        )
        on conflict (install_id) do update
        set
          profile_id = excluded.profile_id,
          platform = excluded.platform,
          locale = excluded.locale,
          region = excluded.region,
          timezone = excluded.timezone,
          app_version = coalesce(excluded.app_version, devices.app_version),
          app_build = coalesce(excluded.app_build, devices.app_build),
          last_seen_at = now()
      `;

      await this.recordInstallPlatformActivity(tx, {
        installId,
        platform: identity.platform ?? "ios",
        appVersion: identity.appVersion,
        appBuild: identity.appBuild,
      });

      await tx`
        insert into install_scan_credits (
          install_id,
          profile_id,
          free_remaining,
          rewarded_remaining,
          premium_remaining
        )
        values (${installId}, ${profile.id}, ${lifetimeFreeScanAllowance}, 0, 0)
        on conflict (install_id) do update
        set
          profile_id = excluded.profile_id,
          rewarded_remaining = 0,
          premium_remaining = 0,
          last_seen_at = now(),
          updated_at = now()
      `;

      return profile;
    });
  }

  private async transferCurrentInstallQuotaToProfile(profileId: string): Promise<void> {
    const installId = currentRequestIdentity().installId;
    if (!installId) return;

    await this.sql.begin(async (tx) => {
      const [installQuota] = await tx<QuotaRow[]>`
        select free_remaining, rewarded_remaining, premium_remaining
        from install_scan_credits
        where install_id = ${installId}
        for update
      `;

      if (installQuota) {
        await tx`
          insert into scan_credits (
            profile_id,
            local_date,
            free_remaining,
            rewarded_remaining,
            premium_remaining
          )
          values (
            ${profileId},
            ${lifetimeQuotaDate},
            ${installQuota.free_remaining},
            ${installQuota.rewarded_remaining},
            ${installQuota.premium_remaining}
          )
          on conflict (profile_id, local_date) do update
          set
            free_remaining = least(scan_credits.free_remaining, excluded.free_remaining),
            rewarded_remaining = scan_credits.rewarded_remaining + excluded.rewarded_remaining,
            premium_remaining = greatest(scan_credits.premium_remaining, excluded.premium_remaining),
            updated_at = now()
        `;

        await tx`
          update install_scan_credits
          set
            profile_id = null,
            free_remaining = 0,
            rewarded_remaining = 0,
            premium_remaining = 0,
            updated_at = now()
          where install_id = ${installId}
        `;
        return;
      }

      await tx`
        insert into scan_credits (
          profile_id,
          local_date,
          free_remaining,
          rewarded_remaining,
          premium_remaining
        )
        values (${profileId}, ${lifetimeQuotaDate}, ${lifetimeFreeScanAllowance}, 0, 0)
        on conflict (profile_id, local_date) do nothing
      `;
    });
  }

  private async mergeProfiles(
    sourceProfileId: string,
    targetProfileId: string,
    toAuthMethod: Exclude<Profile["authMethod"], "anonymous">,
  ): Promise<void> {
    await this.sql.begin(async (tx) => {
      await tx`
        update meals
        set profile_id = ${targetProfileId}, updated_at = now()
        where profile_id = ${sourceProfileId}
      `;

      await tx`
        update scan_sessions
        set profile_id = ${targetProfileId}, updated_at = now()
        where profile_id = ${sourceProfileId}
      `;

      await tx`
        insert into scan_credits (
          profile_id,
          local_date,
          free_remaining,
          rewarded_remaining,
          premium_remaining
        )
        select
          ${targetProfileId},
          local_date,
          free_remaining,
          rewarded_remaining,
          premium_remaining
        from scan_credits
        where profile_id = ${sourceProfileId}
        on conflict (profile_id, local_date) do update
        set
          free_remaining = least(scan_credits.free_remaining, excluded.free_remaining),
          rewarded_remaining = least(scan_credits.rewarded_remaining, excluded.rewarded_remaining),
          premium_remaining = greatest(scan_credits.premium_remaining, excluded.premium_remaining),
          updated_at = now()
      `;

      await tx`
        update install_scan_credits
        set profile_id = ${targetProfileId}, updated_at = now()
        where profile_id = ${sourceProfileId}
      `;

      await tx`
        update quota_events
        set profile_id = ${targetProfileId}, scan_credit_id = null
        where profile_id = ${sourceProfileId}
      `;

      await tx`
        insert into rewarded_ad_progress (
          quota_owner_key,
          profile_id,
          install_id,
          local_date,
          completed_ads,
          granted_scans,
          created_at,
          updated_at
        )
        select
          case
            when quota_owner_key = ${`profile:${sourceProfileId}`} then ${`profile:${targetProfileId}`}
            else quota_owner_key
          end,
          ${targetProfileId},
          install_id,
          local_date,
          completed_ads,
          granted_scans,
          created_at,
          now()
        from rewarded_ad_progress
        where profile_id = ${sourceProfileId}
        on conflict (quota_owner_key, local_date) do update
        set
          profile_id = excluded.profile_id,
          completed_ads = greatest(rewarded_ad_progress.completed_ads, excluded.completed_ads),
          granted_scans = greatest(rewarded_ad_progress.granted_scans, excluded.granted_scans),
          updated_at = now()
      `;

      await tx`
        delete from rewarded_ad_progress
        where profile_id = ${sourceProfileId}
      `;

      await tx`
        update rewarded_ad_events
        set
          profile_id = ${targetProfileId},
          quota_owner_key = case
            when quota_owner_key = ${`profile:${sourceProfileId}`} then ${`profile:${targetProfileId}`}
            else quota_owner_key
          end
        where profile_id = ${sourceProfileId}
      `;

      await tx`
        delete from scan_credits
        where profile_id = ${sourceProfileId}
      `;

      await tx`
        update rewarded_ad_callbacks
        set profile_id = ${targetProfileId}
        where profile_id = ${sourceProfileId}
      `;

      await tx`
        delete from idempotency_keys source_keys
        where source_keys.profile_id = ${sourceProfileId}
          and exists (
            select 1
            from idempotency_keys target_keys
            where target_keys.profile_id = ${targetProfileId}
              and target_keys.idempotency_key = source_keys.idempotency_key
          )
      `;

      await tx`
        update idempotency_keys
        set profile_id = ${targetProfileId}
        where profile_id = ${sourceProfileId}
      `;

      await tx`
        delete from consents source_consents
        where source_consents.profile_id = ${sourceProfileId}
          and exists (
            select 1
            from consents target_consents
            where target_consents.profile_id = ${targetProfileId}
          )
      `;

      await tx`
        update consents
        set profile_id = ${targetProfileId}, updated_at = now()
        where profile_id = ${sourceProfileId}
      `;

      await tx`
        update devices
        set profile_id = ${targetProfileId}, last_seen_at = now()
        where profile_id = ${sourceProfileId}
      `;

      await tx`
        insert into identity_link_events (profile_id, from_auth_method, to_auth_method, meals_count)
        values (
          ${targetProfileId},
          'anonymous',
          ${toAuthMethod},
          (select count(*)::int from meals where profile_id = ${targetProfileId})
        )
      `;
    });
  }

  private async foodFromRow(row: FoodRow & { aliases?: string[] }): Promise<FoodRecord> {
    const portions = await this.sql<
      { unit: FoodRecord["portions"][number]["unit"]; grams: string; confidence: string }[]
    >`
      select unit, grams, confidence
      from portion_conversions
      where food_id = ${row.id}
      order by confidence desc
    `;

    return {
      id: row.id,
      canonicalName: row.canonical_name,
      region: row.region,
      aliases: row.aliases ?? [],
      source: row.source_name === "LogMyPlate learned" ? "logmyplate_learned" : "logmyplate_seed",
      nutritionPer100g: {
        calories: Number(row.calories_per_100g),
        proteinG: Number(row.protein_g_per_100g),
        carbsG: Number(row.carbs_g_per_100g),
        fatG: Number(row.fat_g_per_100g),
        fiberG: row.fiber_g_per_100g === null ? undefined : Number(row.fiber_g_per_100g),
        sugarG: row.sugar_g_per_100g === null ? undefined : Number(row.sugar_g_per_100g),
        sodiumMg: row.sodium_mg_per_100g === null ? undefined : Number(row.sodium_mg_per_100g),
      },
      portions: portions.map((portion) => ({
        unit: portion.unit,
        grams: Number(portion.grams),
        confidence: Number(portion.confidence),
      })),
    };
  }

  private async getOrCreateProfileForInstall(installId: string): Promise<Profile> {
    const identity = currentRequestIdentity();

    const existing = await this.getProfileForInstall(installId);
    if (existing) {
      const [device] = await this.sql<
        { platform: AppPlatform; app_version: string | null; app_build: number | null }[]
      >`
        update devices
        set
          platform = coalesce(${identity.platform ?? null}, platform),
          locale = coalesce(${identity.locale ?? null}, locale),
          region = coalesce(${identity.region ?? null}, region),
          timezone = coalesce(${identity.timezone ?? null}, timezone),
          app_version = coalesce(${identity.appVersion ?? null}, app_version),
          app_build = coalesce(${identity.appBuild ?? null}, app_build),
          last_seen_at = now()
        where install_id = ${installId}
        returning platform, app_version, app_build
      `;
      await this.recordInstallPlatformActivity(this.sql, {
        installId,
        platform: device?.platform,
        appVersion: device?.app_version,
        appBuild: device?.app_build,
      });
      if (existing.authMethod === "anonymous") return existing;

      const anonymousProfile = await this.resetCurrentInstallToAnonymousProfile();
      if (anonymousProfile) return anonymousProfile;
    }

    const created = await this.sql.begin(async (tx) => {
      const [profile] = await tx<Profile[]>`
        insert into profiles (timezone, provider_subject)
        values (${identity.timezone ?? "Asia/Kolkata"}, ${`install:${installId}`})
        returning
          id::text,
          auth_method as "authMethod",
          email,
          timezone,
          linked_at::text as "linkedAt",
          created_at::text as "createdAt"
      `;

      await tx`
        insert into devices (
          profile_id,
          install_id,
          platform,
          locale,
          region,
          timezone,
          app_version,
          app_build
        )
        values (
          ${profile.id},
          ${installId},
          ${identity.platform ?? "ios"},
          ${identity.locale ?? null},
          ${identity.region ?? null},
          ${identity.timezone ?? null},
          ${identity.appVersion ?? null},
          ${identity.appBuild ?? null}
        )
        on conflict (install_id) do nothing
        returning profile_id::text
      `;

      const [linkedDevice] = await tx<{ profile_id: string }[]>`
        select profile_id::text
        from devices
        where install_id = ${installId}
        limit 1
      `;

      if (linkedDevice?.profile_id !== profile.id) {
        await tx`
          delete from profiles
          where id = ${profile.id}
        `;
        return undefined;
      }

      await this.recordInstallPlatformActivity(tx, {
        installId,
        platform: identity.platform ?? "ios",
        appVersion: identity.appVersion,
        appBuild: identity.appBuild,
        isNewInstall: true,
      });

      await tx`
        insert into install_scan_credits (
          install_id,
          profile_id,
          free_remaining,
          rewarded_remaining,
          premium_remaining
        )
        values (${installId}, ${profile.id}, ${lifetimeFreeScanAllowance}, 0, 0)
        on conflict (install_id) do update
        set
          profile_id = excluded.profile_id,
          rewarded_remaining = 0,
          premium_remaining = 0,
          last_seen_at = now(),
          updated_at = now()
      `;

      return profile;
    });

    if (created) return created;

    const linkedProfile = await this.getProfileForInstall(installId);
    if (linkedProfile?.authMethod === "anonymous") return linkedProfile;

    const anonymousProfile = await this.resetCurrentInstallToAnonymousProfile();
    if (anonymousProfile) return anonymousProfile;

    throw new Error("Could not create anonymous profile for install.");
  }

  private scanFromRow(row: ScanRow): ScanSession {
    return {
      id: row.id,
      profileId: row.profile_id,
      installId: row.install_id ?? undefined,
      platform: row.platform ?? undefined,
      appVersion: row.app_version ?? undefined,
      appBuild: row.app_build ?? undefined,
      status: row.status,
      creditReason: row.consumed_credit_reason ?? undefined,
      analyzedResponse: row.analyzed_response ?? undefined,
      userHint: row.user_hint ?? undefined,
      imageMimeType: row.image_mime_type ?? undefined,
      imageByteSize: row.image_byte_size ?? undefined,
      imageBucket: row.image_bucket ?? undefined,
      imageObjectKey: row.image_object_key ?? undefined,
      imageHash: row.image_hash ?? undefined,
      imageHashAlgorithm: row.image_hash_algorithm ?? undefined,
      createdAt: row.created_at,
    };
  }

  private scanAnalysisCacheFromRow(row: ScanAnalysisCacheRow): ScanAnalysisCacheRecord {
    return {
      profileId: row.profile_id,
      imageHash: row.image_hash,
      hashAlgorithm: row.hash_algorithm,
      imageMimeType: row.image_mime_type ?? undefined,
      imageByteSize: row.image_byte_size ?? undefined,
      analyzedResponse: row.analyzed_response,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private async mealFromRow(row: MealRow) {
    const itemRows = await this.sql<MealItemRow[]>`
      select
        meal_items.meal_id::text,
        meal_items.food_id::text,
        meal_items.display_name,
        meal_items.quantity,
        meal_items.unit,
        meal_items.grams,
        nutrition_results.calories,
        nutrition_results.protein_g,
        nutrition_results.carbs_g,
        nutrition_results.fat_g,
        nutrition_results.fiber_g,
        nutrition_results.sugar_g,
        nutrition_results.sodium_mg
      from meal_items
      left join nutrition_results on nutrition_results.meal_item_id = meal_items.id
      where meal_items.meal_id = ${row.id}
      order by meal_items.created_at asc
    `;

    const items = itemRows.map((item) => ({
      foodId: item.food_id ?? undefined,
      displayName: item.display_name,
      portion: {
        quantity: Number(item.quantity),
        unit: item.unit as PortionUnit,
        grams: Number(item.grams),
      },
      nutrition: {
        calories: Number(item.calories ?? 0),
        proteinG: Number(item.protein_g ?? 0),
        carbsG: Number(item.carbs_g ?? 0),
        fatG: Number(item.fat_g ?? 0),
        fiberG: item.fiber_g === null ? undefined : Number(item.fiber_g),
        sugarG: item.sugar_g === null ? undefined : Number(item.sugar_g),
        sodiumMg: item.sodium_mg === null ? undefined : Number(item.sodium_mg),
      },
    }));

    const [image] = await this.sql<MealImageRow[]>`
      select
        id::text,
        bucket,
        object_key,
        mime_type,
        byte_size,
        width,
        height,
        created_at::text
      from meal_images
      where meal_id = ${row.id}
      limit 1
    `;

    return createMealSummary({
      mealId: row.id,
      mealType: row.meal_type,
      title: row.title,
      loggedAt: new Date(row.logged_at).toISOString(),
      items,
      image: image
        ? {
            imageId: image.id,
            bucket: image.bucket,
            objectKey: image.object_key,
            mimeType: image.mime_type,
            byteSize: image.byte_size,
            width: image.width ?? undefined,
            height: image.height ?? undefined,
            createdAt: image.created_at,
          }
        : undefined,
    });
  }

  async countChatSessionsToday(profileId: string): Promise<number> {
    const rows = await this.sql<{ count: number | string }[]>`
      select count(*)::integer as count
      from chat_sessions
      where profile_id = ${profileId}
        and session_date = current_date
    `;
    return Number(rows[0]?.count ?? 0);
  }

  async createChatSession(input: {
    profileId: string;
    maxTurns: number;
    contextSnapshot: unknown;
  }): Promise<{ id: string; sessionDate: string; createdAt: string }> {
    const [row] = await this.sql<[{ id: string; session_date: string; created_at: string }?]>`
      insert into chat_sessions (profile_id, max_turns, context_snapshot)
      values (${input.profileId}, ${input.maxTurns}, ${JSON.stringify(input.contextSnapshot)})
      returning id, session_date::text, created_at::text
    `;
    return {
      id: row!.id,
      sessionDate: row!.session_date,
      createdAt: row!.created_at,
    };
  }

  async closeChatSession(sessionId: string, turnCount: number): Promise<void> {
    await this.sql`
      update chat_sessions
      set closed_at = now(), turn_count = ${turnCount}
      where id = ${sessionId}
    `;
  }

  async appendChatMessage(input: {
    sessionId: string;
    role: "system" | "user" | "assistant";
    content: string;
    turnNumber: number;
    inputTokens?: number;
    outputTokens?: number;
    latencyMs?: number;
  }): Promise<void> {
    await this.sql.begin(async (tx) => {
      await tx`
        insert into chat_messages (session_id, role, content, turn_number, input_tokens, output_tokens, latency_ms)
        values (${input.sessionId}, ${input.role}, ${input.content}, ${input.turnNumber}, ${input.inputTokens ?? null}, ${input.outputTokens ?? null}, ${input.latencyMs ?? null})
      `;
      await tx`
        update chat_sessions
        set turn_count = ${input.turnNumber}
        where id = ${input.sessionId}
          and turn_count < ${input.turnNumber}
      `;
    });
  }

  async getChatHistory(sessionId: string): Promise<
    | {
        messages: Array<{ role: string; content: string; createdAt: string }>;
        turnCount: number;
        maxTurns: number;
        createdAt: string;
      }
    | undefined
  > {
    const [session] = await this.sql<
      [
        {
          id: string;
          turn_count: number;
          max_turns: number;
          created_at: string;
        }?,
      ]
    >`
      select id, turn_count, max_turns, to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS.USOF') as created_at
      from chat_sessions
      where id = ${sessionId}
    `;
    if (!session) return undefined;

    const messages = await this.sql<Array<{ role: string; content: string; created_at: string }>>`
      select role, content, to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS.USOF') as created_at
      from chat_messages
      where session_id = ${sessionId}
      order by turn_number, created_at
    `;

    return {
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
        createdAt: m.created_at,
      })),
      turnCount: session.turn_count,
      maxTurns: session.max_turns,
      createdAt: session.created_at,
    };
  }

  async listChatSessions(
    profileId: string,
    limit?: number,
  ): Promise<
    Array<{
      id: string;
      turnCount: number;
      createdAt: string;
      closedAt?: string;
    }>
  > {
    const rows = await this.sql<
      Array<{
        id: string;
        turn_count: number;
        created_at: string;
        closed_at: string | null;
      }>
    >`
      select id, turn_count, created_at::text, closed_at::text
      from chat_sessions
      where profile_id = ${profileId}
      order by created_at desc
      limit ${limit ?? 100}
    `;
    return rows.map(
      (r: { id: string; turn_count: number; created_at: string; closed_at: string | null }) => ({
        id: r.id,
        turnCount: r.turn_count,
        createdAt: r.created_at,
        closedAt: r.closed_at ?? undefined,
      }),
    );
  }
}

const localDate = () => new Date().toISOString().slice(0, 10);

const localDateForTimezone = (timezone: string | undefined): string => {
  if (!timezone) return localDate();
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date());
    const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    return `${byType.year}-${byType.month}-${byType.day}`;
  } catch {
    return localDate();
  }
};

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

const validatePassword = (password: string): void => {
  if (password.length < 6 || password.length > 128) {
    throw new AccountAuthError(
      "invalid_password",
      "Password must be between 6 and 128 characters.",
      400,
    );
  }
};

const hashPassword = async (password: string, salt = randomBytes(16).toString("hex")) => {
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return { salt, hash: derived.toString("hex") };
};

const verifyPassword = async (
  password: string,
  salt: string,
  expectedHash: string,
): Promise<boolean> => {
  const actual = Buffer.from((await hashPassword(password, salt)).hash, "hex");
  const expected = Buffer.from(expectedHash, "hex");
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
};

const hashToken = (token: string): string => createHash("sha256").update(token).digest("hex");

const randomPasswordResetCode = (): string => randomInt(0, 1_000_000).toString().padStart(6, "0");
