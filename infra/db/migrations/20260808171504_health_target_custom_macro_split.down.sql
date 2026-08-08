-- 20260808171504_health_target_custom_macro_split.down.sql

alter table profile_health_targets
  drop constraint if exists profile_health_targets_custom_split_complete;

alter table profile_health_targets
  drop column if exists custom_carbs_pct,
  drop column if exists custom_fat_pct,
  drop column if exists custom_protein_pct;
