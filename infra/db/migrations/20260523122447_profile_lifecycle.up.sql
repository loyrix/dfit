-- 20260523122447_profile_lifecycle.up.sql

alter table profiles
  add column if not exists deactivated_at timestamptz;

create index if not exists profiles_deactivated_at_idx
  on profiles (deactivated_at)
  where deactivated_at is not null;
