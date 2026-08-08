-- 20260808171504_health_target_custom_macro_split.up.sql
--
-- Part A9: an optional user-chosen macro split that replaces the computed
-- centres outright. An explicit choice is a stronger signal of intent than an
-- algorithmic estimate, so it overrides rather than blends.
--
-- All three columns are nullable with no default, and are only meaningful
-- together. Existing rows have none, so they keep using the computed centres and
-- behave exactly as before.
--
-- Percentages rather than grams: the scoring system compares share-of-energy, so
-- storing grams would mean re-deriving a ratio on every read and would go stale
-- against the user's calorie target.

alter table profile_health_targets
  add column if not exists custom_carbs_pct numeric(5, 2),
  add column if not exists custom_fat_pct numeric(5, 2),
  add column if not exists custom_protein_pct numeric(5, 2);

-- Either a complete split or none at all. A partial split has no meaning and
-- would silently score against a nonsense band.
alter table profile_health_targets
  drop constraint if exists profile_health_targets_custom_split_complete;

alter table profile_health_targets
  add constraint profile_health_targets_custom_split_complete check (
    (
      custom_carbs_pct is null
      and custom_fat_pct is null
      and custom_protein_pct is null
    )
    or (
      custom_carbs_pct is not null
      and custom_fat_pct is not null
      and custom_protein_pct is not null
    )
  );
