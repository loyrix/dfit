-- 20260531141259_no_food_scan_limit_resets.up.sql

create table no_food_scan_limit_resets (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  reason text not null,
  actor text not null,
  audit_log_id uuid references admin_audit_log(id) on delete set null,
  reset_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index no_food_scan_limit_resets_profile_idx
  on no_food_scan_limit_resets (profile_id, reset_at desc);
