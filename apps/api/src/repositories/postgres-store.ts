import { randomUUID } from "node:crypto";
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
  AppRepository,
  CreateMealInput,
  IdempotencyRecord,
  Profile,
  ScanSession,
} from "./app-repository.js";

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
  image_mime_type: string | null;
  image_byte_size: number | null;
  created_at: string;
  analyzed_response: unknown | null;
};

const toJsonValue = (value: unknown): postgres.JSONValue =>
  JSON.parse(JSON.stringify(value ?? null)) as postgres.JSONValue;

export class PostgresStore implements AppRepository {
  constructor(private readonly sql: SqlClient) {}

  async getProfile(): Promise<Profile> {
    const identity = currentRequestIdentity();
    if (identity.installId) return this.getOrCreateProfileForInstall(identity.installId);

    const [existing] = await this.sql<Profile[]>`
      select
        id::text,
        auth_method as "authMethod",
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
        timezone,
        linked_at::text as "linkedAt",
        created_at::text as "createdAt"
    `;

    return profile;
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

  async listMeals() {
    const profile = await this.getProfile();
    const rows = await this.sql<MealRow[]>`
      select id::text, meal_type, title, logged_at
      from meals
      where profile_id = ${profile.id}
      order by logged_at desc
      limit 100
    `;

    const meals = await Promise.all(rows.map((row) => this.mealFromRow(row)));
    return meals;
  }

  async getMeal(mealId: string) {
    const [meal] = await this.sql<MealRow[]>`
      select id::text, meal_type, title, logged_at
      from meals
      where id = ${mealId}
      limit 1
    `;

    if (!meal) return undefined;
    return this.mealFromRow(meal);
  }

  async deleteMeal(mealId: string) {
    const rows = await this.sql<{ id: string }[]>`
      delete from meals
      where id = ${mealId}
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
    const [scan] = await this.sql<ScanRow[]>`
      select
        scan_sessions.id::text,
        scan_sessions.profile_id::text,
        scan_sessions.status,
        scan_sessions.consumed_credit_reason,
        scan_sessions.image_mime_type,
        scan_sessions.image_byte_size,
        scan_sessions.created_at::text,
        ai_predictions.raw_ai_json as analyzed_response
      from scan_sessions
      left join lateral (
        select raw_ai_json
        from ai_predictions
        where ai_predictions.scan_session_id = scan_sessions.id
        order by ai_predictions.created_at desc
        limit 1
      ) ai_predictions on true
      where scan_sessions.id = ${scanId}
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
          image_mime_type = coalesce(${scan.imageMimeType ?? null}, image_mime_type),
          image_byte_size = coalesce(${scan.imageByteSize ?? null}, image_byte_size),
          updated_at = now()
        where id = ${scan.id}
      `;

      if (scan.analyzedResponse) {
        await tx`
          delete from ai_predictions
          where scan_session_id = ${scan.id}
        `;

        const [run] = await tx<{ id: string }[]>`
          insert into ai_provider_runs (
            scan_session_id,
            provider,
            model,
            prompt_version,
            schema_version,
            success
          )
          values (${scan.id}, 'mock', 'mock-indian-plate-v1', 'mock_v1', 'scan_v1', true)
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
            ${tx.json(toJsonValue(scan.analyzedResponse))},
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
