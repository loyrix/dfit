import {
  createHash,
  randomBytes,
  randomUUID,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import {
  createMealSummary,
  sumTotals,
  type FoodRecord,
  type MealSummary,
  type PortionUnit,
} from "@dfit/domain";
import type postgres from "postgres";
import type { SqlClient } from "../db/client.js";
import { currentRequestIdentity } from "../request-context.js";
import type {
  AccountSession,
  AppRepository,
  CreateMealInput,
  IdempotencyRecord,
  ListMealsInput,
  Profile,
  ScanSession,
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

type ScanRow = {
  id: string;
  profile_id: string;
  status: ScanSession["status"];
  consumed_credit_reason: ScanSession["creditReason"] | null;
  user_hint: string | null;
  image_mime_type: string | null;
  image_byte_size: number | null;
  created_at: string;
  analyzed_response: unknown | null;
};

const toJsonValue = (value: unknown): postgres.JSONValue =>
  JSON.parse(JSON.stringify(value ?? null)) as postgres.JSONValue;

const scrypt = promisify(scryptCallback);
const sessionDurationMs = 30 * 24 * 60 * 60 * 1000;

export class PostgresStore implements AppRepository {
  constructor(private readonly sql: SqlClient) {}

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

      return linkedProfile;
    });

    await this.attachInstallToProfile(profile.id);
    return this.createSession(profile.id);
  }

  async loginWithEmail(input: { email: string; password: string }): Promise<AccountSession> {
    const email = normalizeEmail(input.email);
    const credential = await this.findCredentialByEmail(email);
    if (!credential) {
      throw new AccountAuthError("invalid_credentials", "Invalid email or password.", 401);
    }

    const passwordMatches = await verifyPassword(
      input.password,
      credential.password_salt,
      credential.password_hash,
    );
    if (!passwordMatches) {
      throw new AccountAuthError("invalid_credentials", "Invalid email or password.", 401);
    }

    const currentProfile = await this.getAnonymousProfileForCurrentInstall();
    if (
      currentProfile &&
      currentProfile.authMethod === "anonymous" &&
      currentProfile.id !== credential.profile_id
    ) {
      await this.mergeProfiles(currentProfile.id, credential.profile_id);
    }

    await this.attachInstallToProfile(credential.profile_id);
    return this.createSession(credential.profile_id);
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

  async getQuota() {
    const profile = await this.getProfile();
    const today = localDate();
    const [row] = await this.sql<
      { free_remaining: number; rewarded_remaining: number; premium_remaining: number }[]
    >`
      insert into scan_credits (profile_id, local_date, free_remaining, rewarded_remaining, premium_remaining)
      values (${profile.id}, ${today}, 1, 2, 0)
      on conflict (profile_id, local_date) do update
        set updated_at = scan_credits.updated_at
      returning free_remaining, rewarded_remaining, premium_remaining
    `;

    return {
      freeRemaining: row.free_remaining,
      rewardedRemaining: row.rewarded_remaining,
      premiumRemaining: row.premium_remaining,
    };
  }

  async consumeCredit(reason: "free" | "rewarded" | "premium") {
    const profile = await this.getProfile();
    const today = localDate();
    const column =
      reason === "free"
        ? "free_remaining"
        : reason === "rewarded"
          ? "rewarded_remaining"
          : "premium_remaining";

    const rows = await this.sql<
      { free_remaining: number; rewarded_remaining: number; premium_remaining: number }[]
    >`
      update scan_credits
      set
        ${this.sql(column)} = ${this.sql(column)} - 1,
        updated_at = now()
      where profile_id = ${profile.id}
        and local_date = ${today}
        and ${this.sql(column)} > 0
      returning free_remaining, rewarded_remaining, premium_remaining
    `;

    if (!rows[0]) throw new Error(`No ${reason} scan credit remaining`);

    await this.sql`
      insert into quota_events (profile_id, event_type, reason, delta, local_date)
      values (${profile.id}, 'consume', ${reason}, -1, ${today})
    `;

    return {
      freeRemaining: rows[0].free_remaining,
      rewardedRemaining: rows[0].rewarded_remaining,
      premiumRemaining: rows[0].premium_remaining,
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

  async deleteMeal(mealId: string) {
    const profile = await this.getProfile();
    const rows = await this.sql<{ id: string }[]>`
      delete from meals
      where id = ${mealId}
        and profile_id = ${profile.id}
      returning id::text
    `;
    return rows.length > 0;
  }

  async prepareScan(profileId?: string) {
    const profile = await this.getProfile();
    const [scan] = await this.sql<ScanSession[]>`
      insert into scan_sessions (profile_id, status)
      values (${profileId ?? profile.id}, 'prepared')
      returning
        id::text,
        profile_id::text as "profileId",
        status,
        consumed_credit_reason as "creditReason",
        created_at::text as "createdAt"
    `;
    return scan;
  }

  async getScan(scanId: string) {
    const profile = await this.getProfile();
    const [scan] = await this.sql<ScanRow[]>`
      select
        scan_sessions.id::text,
        scan_sessions.profile_id::text,
        scan_sessions.status,
        scan_sessions.consumed_credit_reason,
        scan_sessions.user_hint,
        scan_sessions.image_mime_type,
        scan_sessions.image_byte_size,
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
      await tx`
        update scan_sessions
        set
          status = ${scan.status},
          consumed_credit_reason = ${scan.creditReason ?? null},
          user_hint = coalesce(${scan.userHint ?? null}, user_hint),
          image_mime_type = coalesce(${scan.imageMimeType ?? null}, image_mime_type),
          image_byte_size = coalesce(${scan.imageByteSize ?? null}, image_byte_size),
          updated_at = now()
        where id = ${scan.id}
      `;

      if (scan.analyzedResponse && scan.aiProviderRun) {
        await tx`
          delete from ai_predictions
          where scan_session_id = ${scan.id}
        `;

        const providerRun = scan.aiProviderRun;

        const [run] = await tx<{ id: string }[]>`
          insert into ai_provider_runs (
            scan_session_id,
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
        `;

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
        const rawAiJson = providerRun.rawResponse
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
    });
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
        ${this.sql.json(toJsonValue(record.responseBody))}
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
      }[]
    >`
      select profile_id::text, email, password_salt, password_hash
      from account_password_credentials
      where email = ${email}
      limit 1
    `;
    return credential;
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
      limit 1
    `;
    return profile;
  }

  private async getAnonymousProfileForCurrentInstall(): Promise<Profile | undefined> {
    const installId = currentRequestIdentity().installId;
    if (!installId) return undefined;

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
        and profiles.auth_method = 'anonymous'
      limit 1
    `;
    return profile;
  }

  private async attachInstallToProfile(profileId: string): Promise<void> {
    const identity = currentRequestIdentity();
    if (!identity.installId) return;

    await this.sql`
      insert into devices (
        profile_id,
        install_id,
        platform,
        locale,
        region,
        timezone
      )
      values (
        ${profileId},
        ${identity.installId},
        ${identity.platform ?? "ios"},
        ${identity.locale ?? null},
        ${identity.region ?? null},
        ${identity.timezone ?? null}
      )
      on conflict (install_id) do update
      set
        profile_id = excluded.profile_id,
        platform = excluded.platform,
        locale = excluded.locale,
        region = excluded.region,
        timezone = excluded.timezone,
        last_seen_at = now()
    `;
  }

  private async resetCurrentInstallToAnonymousProfile(): Promise<void> {
    const identity = currentRequestIdentity();
    const installId = identity.installId;
    if (!installId) return;

    await this.sql.begin(async (tx) => {
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
          timezone
        )
        values (
          ${profile.id},
          ${installId},
          ${identity.platform ?? "ios"},
          ${identity.locale ?? null},
          ${identity.region ?? null},
          ${identity.timezone ?? null}
        )
        on conflict (install_id) do update
        set
          profile_id = excluded.profile_id,
          platform = excluded.platform,
          locale = excluded.locale,
          region = excluded.region,
          timezone = excluded.timezone,
          last_seen_at = now()
      `;
    });
  }

  private async mergeProfiles(sourceProfileId: string, targetProfileId: string): Promise<void> {
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
          free_remaining = greatest(scan_credits.free_remaining, excluded.free_remaining),
          rewarded_remaining = greatest(scan_credits.rewarded_remaining, excluded.rewarded_remaining),
          premium_remaining = greatest(scan_credits.premium_remaining, excluded.premium_remaining),
          updated_at = now()
      `;

      await tx`
        update quota_events
        set profile_id = ${targetProfileId}, scan_credit_id = null
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
          'email',
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
      source: "dfit_seed",
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

    const [existing] = await this.sql<Profile[]>`
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

    if (existing) {
      await this.sql`
        update devices
        set
          platform = coalesce(${identity.platform ?? null}, platform),
          locale = coalesce(${identity.locale ?? null}, locale),
          region = coalesce(${identity.region ?? null}, region),
          timezone = coalesce(${identity.timezone ?? null}, timezone),
          last_seen_at = now()
        where install_id = ${installId}
      `;
      return existing;
    }

    return this.sql.begin(async (tx) => {
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
          timezone
        )
        values (
          ${profile.id},
          ${installId},
          ${identity.platform ?? "ios"},
          ${identity.locale ?? null},
          ${identity.region ?? null},
          ${identity.timezone ?? null}
        )
      `;

      return profile;
    });
  }

  private scanFromRow(row: ScanRow): ScanSession {
    return {
      id: row.id,
      profileId: row.profile_id,
      status: row.status,
      creditReason: row.consumed_credit_reason ?? undefined,
      analyzedResponse: row.analyzed_response ?? undefined,
      userHint: row.user_hint ?? undefined,
      imageMimeType: row.image_mime_type ?? undefined,
      imageByteSize: row.image_byte_size ?? undefined,
      createdAt: row.created_at,
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
      foodId: item.food_id ?? randomUUID(),
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

    return createMealSummary({
      mealId: row.id,
      mealType: row.meal_type,
      title: row.title,
      loggedAt: new Date(row.logged_at).toISOString(),
      items,
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
