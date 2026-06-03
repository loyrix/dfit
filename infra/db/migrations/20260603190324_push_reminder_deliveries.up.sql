-- 20260603190324_push_reminder_deliveries.up.sql
create table push_reminder_runs (
  id uuid primary key default gen_random_uuid(),
  dry_run boolean not null default false,
  status text not null default 'running' check (status in ('running', 'completed', 'failed')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  summary jsonb not null default '{}'::jsonb,
  error text
);

create table push_reminder_deliveries (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references push_reminder_runs(id) on delete set null,
  profile_id uuid not null references profiles(id) on delete cascade,
  scenario_key text not null check (
    scenario_key in ('breakfast', 'lunch', 'snack', 'dinner', 'targetSetup')
  ),
  local_date date not null,
  timezone text not null,
  title text not null,
  body text not null,
  status text not null check (status in ('pending', 'sent', 'failed')),
  target_token_count integer not null default 0 check (target_token_count >= 0),
  sent_count integer not null default 0 check (sent_count >= 0),
  failed_count integer not null default 0 check (failed_count >= 0),
  failures jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index push_reminder_runs_started_at_idx
  on push_reminder_runs (started_at);

create index push_reminder_deliveries_created_at_idx
  on push_reminder_deliveries (created_at);

create index push_reminder_deliveries_profile_date_idx
  on push_reminder_deliveries (profile_id, local_date desc, created_at desc);

create unique index push_reminder_deliveries_once_idx
  on push_reminder_deliveries (profile_id, scenario_key, local_date);
