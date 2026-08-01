-- 20260801144304_profile_health_conditions.down.sql

alter table profile_health_targets
  drop column if exists health_focus;
