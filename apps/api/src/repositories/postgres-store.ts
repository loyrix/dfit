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
  createMealSummary,
  sumTotals,
  rewardedAdsPerScan,
  rewardedDailyScanLimit,
  type FoodRecord,
  type MealSummary,
  type PortionUnit,
  type ScanCreditState,
} from "@logmyplate/domain";
import type postgres from "postgres";
import type { SqlClient } from "../db/client.js";
import { currentRequestIdentity } from "../request-context.js";
import type {
  AccountSession,
  AppRepository,
  AttachMealImageInput,
  CreateMealInput,
  IdempotencyRecord,
  ListMealsInput,
  MealDeletionPlan,
  OAuthAccountInput,
  PasswordResetRequest,
  Profile,
  ProfileDeletionPlan,
  ProfileHealthTarget,
  RewardedAdCompletionInput,
  RewardedAdCreditResult,
  RewardedAdProgressState,
  RewardedAdServerVerification,
  RewardedAdServerVerificationInput,
  ScanAnalysisCacheRecord,
  ScanSession,
  UpdateMealInput,
  UpsertProfileHealthTargetInput,
  UpsertScanAnalysisCacheInput,
} from "./app-repository.js";
import { AccountAuthError } from "./app-repository.js";

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

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
type AppPlatform = NonNullable<ScanSession["platform"]>;
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

      return Boolean(updated);
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

      return Boolean(deletedProfile);
    });

    await this.resetCurrentInstallToAnonymousProfile();
    return deleted;
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
    return quotaFromRow(await this.getOrCreateQuota(profile));
  }

  async getRewardedAdProgress(): Promise<RewardedAdProgressState> {
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
    });

    return {
      adsWatchedToday: completedAds,
      adsNeededForNextScan: rewardState.adsNeededForNextScan,
      scansGrantedToday: grantedScans,
      dailyScanLimit: rewardedDailyScanLimit,
      adsPerScan: rewardedAdsPerScan,
    };
  }

  async consumeCredit(reason: "free" | "rewarded" | "premium") {
    const profile = await this.getProfile();
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

  async completeRewardedAd(input: RewardedAdCompletionInput): Promise<RewardedAdCreditResult> {
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
      });

      return {
        grantedScan: scanGrant > 0,
        adsWatchedToday: progress.completed_ads,
        adsNeededForNextScan: rewardState.adsNeededForNextScan,
        scansGrantedToday: progress.granted_scans,
        dailyScanLimit: rewardedDailyScanLimit,
        adsPerScan: rewardedAdsPerScan,
        quota: quotaFromRow(quotaRow),
      };
    });
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
        and scan_sessions.created_at >= ${sinceIso}::timestamptz
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

  async setIdempotent(key: string, record: Omit<IdempotencyRecord, "createdAt">) {
    const profile = await this.getProfile();
    const responseBody = record.responseBody ?? {};
    await this.sql`
      insert into idempotency_keys (
        profile_id,
        idempotency_key,
        method,
        path,
        response_status,
        response_body
      )
      values (
        ${profile.id},
        ${key},
        'unknown',
        'unknown',
        ${record.responseStatus},
        ${this.sql.json(toJsonValue(responseBody))}
      )
      on conflict (profile_id, idempotency_key) do nothing
    `;
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
      source: "logmyplate_seed",
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
}

const localDate = () => new Date().toISOString().slice(0, 10);

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
