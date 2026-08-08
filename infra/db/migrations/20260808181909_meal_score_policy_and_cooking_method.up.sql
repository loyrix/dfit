-- 20260808181909_meal_score_policy_and_cooking_method.up.sql
--
-- Phase 8 of docs/meal-health-score-implementation-plan.md. Two additive changes.
--
-- 1. meal_items.cooking_method
--
-- Prompt v9 returns a cooking method per item, but no app build sends it back:
-- confirmScanRequest carries name, portion and nutrition only. Without a column
-- to land in, the field would be captured at analysis and discarded at confirm,
-- leaving the Part B and Part C cooking modifiers permanently inert on every
-- stored meal. The confirm route recovers it server-side from the stored
-- analysis, the same way micronutrients are recovered, so every installed build
-- contributes without needing a release.
--
-- Nullable with no default and no backfill. Null means "not known", which is the
-- honest state for every meal logged before v9 is activated, and the scoring
-- code skips the modifier rather than guessing. A default of 'unknown' would
-- have made "the model was unsure" indistinguishable from "nobody ever asked".
--
-- Deliberately text rather than an enum: these values are policy, and adding a
-- technique later should not require an enum migration against a live table.
-- The check constraint keeps the column honest without that rigidity.
--
-- 2. meal_score_policy runtime config
--
-- Every tunable constant behind Parts B-E. This exists because the shipped
-- defaults are known to be harsh: measured against production data, Part B puts
-- 60% of meals at one or two stars, and Part C has 75% of days scoring zero on
-- calorie adherence because users log roughly two meals a day. Those are the
-- spec as written and they ship as written, but they must be correctable from
-- the backend the moment round-one testing says so, without an app release.
--
-- Ratings are computed server-side only, so editing this row is sufficient on
-- its own -- nothing has to reach a client for a change to take effect.
--
-- The row is seeded with exactly the shipped defaults, so applying this
-- migration changes no score by a single point. It exists to be visible and
-- editable in admin, not to alter behaviour.

alter table meal_items
  add column if not exists cooking_method text;

alter table meal_items
  drop constraint if exists meal_items_cooking_method_check;

alter table meal_items
  add constraint meal_items_cooking_method_check
  check (
    cooking_method is null
    or cooking_method in ('fried', 'sauced_creamy', 'baked', 'grilled', 'steamed', 'raw', 'unknown')
  );

insert into app_runtime_config (key, value, description, updated_by)
values (
  'meal_score_policy',
  '{
    "meal": {
      "falloff": 15,
      "weights": { "carbs": 0.4, "fat": 0.35, "protein": 0.25 },
      "skew": { "thresholdPct": 70, "penalty": 15 },
      "protein": { "scalingFactor": 1, "cap": 10 },
      "fiber": { "perGram": 0.5, "cap": 8 },
      "sugar": { "perGram": 0.5, "cap": 12 },
      "cooking": {
        "fried": -8,
        "sauced_creamy": -5,
        "baked": -2,
        "grilled": 3,
        "steamed": 5,
        "raw": 5,
        "unknown": 0
      }
    },
    "daily": {
      "calorieWindow": { "min": 90, "max": 110 },
      "calorieFalloff": 20,
      "blend": { "composite": 0.7, "calories": 0.3 }
    },
    "weekly": {
      "goodDayThreshold": 61,
      "consistencyPerDay": 1,
      "consistencyCap": 5
    },
    "stars": {
      "oneStar": 20,
      "twoStar": 40,
      "threeStar": 60,
      "fourStar": 80
    }
  }'::jsonb,
  'Tunable constants for the meal health score (Parts B-E): macro closeness, daily calorie blend, weekly consistency, and star cutoffs. Seeded with the shipped defaults. Star cutoffs and meal.falloff are the first things to loosen if round-one testing finds the rating too harsh.',
  'migration'
)
on conflict (key) do nothing;
