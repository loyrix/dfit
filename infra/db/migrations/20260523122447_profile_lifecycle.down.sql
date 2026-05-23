-- 20260523122447_profile_lifecycle.down.sql

drop index if exists profiles_deactivated_at_idx;

alter table profiles
  drop column if exists deactivated_at;
