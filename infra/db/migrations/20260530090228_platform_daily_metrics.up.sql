-- 20260530090228_platform_daily_metrics.up.sql

alter table devices
  add column if not exists app_version text,
  add column if not exists app_build integer;

alter table scan_sessions
  add column if not exists install_id text,
  add column if not exists platform text,
  add column if not exists app_version text,
  add column if not exists app_build integer;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'scan_sessions_platform_check'
      and conrelid = 'scan_sessions'::regclass
  ) then
    alter table scan_sessions
      add constraint scan_sessions_platform_check
      check (platform is null or platform in ('ios', 'android'));
  end if;
end $$;

create index if not exists scan_sessions_platform_created_idx
  on scan_sessions (platform, created_at desc)
  where platform is not null;

create index if not exists scan_sessions_install_idx
  on scan_sessions (install_id)
  where install_id is not null;

alter table ai_provider_runs
  add column if not exists install_id text,
  add column if not exists platform text,
  add column if not exists app_version text,
  add column if not exists app_build integer,
  add column if not exists local_date date;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'ai_provider_runs_platform_check'
      and conrelid = 'ai_provider_runs'::regclass
  ) then
    alter table ai_provider_runs
      add constraint ai_provider_runs_platform_check
      check (platform is null or platform in ('ios', 'android'));
  end if;
end $$;

create index if not exists ai_provider_runs_platform_date_idx
  on ai_provider_runs (platform, local_date desc)
  where platform is not null;

create index if not exists ai_provider_runs_install_idx
  on ai_provider_runs (install_id)
  where install_id is not null;

create table if not exists platform_daily_metrics (
  local_date date not null,
  platform text not null check (platform in ('ios', 'android')),
  app_version text not null default 'unknown',
  app_build integer not null default 0 check (app_build >= 0),
  installs integer not null default 0 check (installs >= 0),
  scans_prepared integer not null default 0 check (scans_prepared >= 0),
  scans_ready_for_review integer not null default 0 check (scans_ready_for_review >= 0),
  scans_confirmed integer not null default 0 check (scans_confirmed >= 0),
  scans_failed integer not null default 0 check (scans_failed >= 0),
  ai_runs integer not null default 0 check (ai_runs >= 0),
  ai_success integer not null default 0 check (ai_success >= 0),
  ai_failed integer not null default 0 check (ai_failed >= 0),
  input_tokens bigint not null default 0 check (input_tokens >= 0),
  output_tokens bigint not null default 0 check (output_tokens >= 0),
  estimated_cost_usd numeric(14, 6) not null default 0 check (estimated_cost_usd >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (local_date, platform, app_version, app_build)
);

create table if not exists platform_daily_active_installs (
  local_date date not null,
  platform text not null check (platform in ('ios', 'android')),
  install_id text not null,
  app_version text not null default 'unknown',
  app_build integer not null default 0 check (app_build >= 0),
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  primary key (local_date, platform, install_id)
);

create index if not exists platform_daily_active_installs_install_idx
  on platform_daily_active_installs (install_id, local_date desc);

with single_profile_device as (
  select
    profile_id,
    min(install_id) as install_id,
    min(platform) as platform,
    min(app_version) as app_version,
    min(app_build) as app_build
  from devices
  group by profile_id
  having count(distinct install_id) = 1
)
update scan_sessions
set
  install_id = single_profile_device.install_id,
  platform = single_profile_device.platform,
  app_version = single_profile_device.app_version,
  app_build = single_profile_device.app_build
from single_profile_device
where scan_sessions.profile_id = single_profile_device.profile_id
  and scan_sessions.platform is null;

update ai_provider_runs
set
  install_id = scan_sessions.install_id,
  platform = scan_sessions.platform,
  app_version = scan_sessions.app_version,
  app_build = scan_sessions.app_build,
  local_date = (ai_provider_runs.created_at at time zone 'Asia/Kolkata')::date
from scan_sessions
where ai_provider_runs.scan_session_id = scan_sessions.id
  and (
    ai_provider_runs.install_id is null
    or ai_provider_runs.platform is null
    or ai_provider_runs.app_version is null
    or ai_provider_runs.app_build is null
    or ai_provider_runs.local_date is null
  );

insert into platform_daily_metrics (local_date, platform, app_version, app_build, installs)
select
  (devices.first_seen_at at time zone 'Asia/Kolkata')::date,
  devices.platform,
  coalesce(nullif(devices.app_version, ''), 'unknown'),
  coalesce(devices.app_build, 0),
  count(*)::int
from devices
group by
  (devices.first_seen_at at time zone 'Asia/Kolkata')::date,
  devices.platform,
  coalesce(nullif(devices.app_version, ''), 'unknown'),
  coalesce(devices.app_build, 0)
on conflict (local_date, platform, app_version, app_build) do update
set
  installs = excluded.installs,
  updated_at = now();

insert into platform_daily_metrics (
  local_date,
  platform,
  app_version,
  app_build,
  scans_prepared,
  scans_ready_for_review,
  scans_confirmed,
  scans_failed
)
select
  (scan_sessions.created_at at time zone 'Asia/Kolkata')::date,
  scan_sessions.platform,
  coalesce(nullif(scan_sessions.app_version, ''), 'unknown'),
  coalesce(scan_sessions.app_build, 0),
  count(*)::int,
  count(*) filter (where scan_sessions.status in ('ready_for_review', 'confirmed'))::int,
  count(*) filter (where scan_sessions.status = 'confirmed')::int,
  count(*) filter (where scan_sessions.status = 'failed')::int
from scan_sessions
where scan_sessions.platform in ('ios', 'android')
group by
  (scan_sessions.created_at at time zone 'Asia/Kolkata')::date,
  scan_sessions.platform,
  coalesce(nullif(scan_sessions.app_version, ''), 'unknown'),
  coalesce(scan_sessions.app_build, 0)
on conflict (local_date, platform, app_version, app_build) do update
set
  scans_prepared = excluded.scans_prepared,
  scans_ready_for_review = excluded.scans_ready_for_review,
  scans_confirmed = excluded.scans_confirmed,
  scans_failed = excluded.scans_failed,
  updated_at = now();

insert into platform_daily_metrics (
  local_date,
  platform,
  app_version,
  app_build,
  ai_runs,
  ai_success,
  ai_failed,
  input_tokens,
  output_tokens,
  estimated_cost_usd
)
select
  coalesce(ai_provider_runs.local_date, (ai_provider_runs.created_at at time zone 'Asia/Kolkata')::date),
  ai_provider_runs.platform,
  coalesce(nullif(ai_provider_runs.app_version, ''), 'unknown'),
  coalesce(ai_provider_runs.app_build, 0),
  count(*)::int,
  count(*) filter (where ai_provider_runs.success)::int,
  count(*) filter (where not ai_provider_runs.success)::int,
  coalesce(sum(ai_provider_runs.input_token_estimate), 0)::bigint,
  coalesce(sum(ai_provider_runs.output_token_estimate), 0)::bigint,
  coalesce(sum(ai_provider_runs.estimated_cost_usd), 0)::numeric
from ai_provider_runs
where ai_provider_runs.platform in ('ios', 'android')
group by
  coalesce(ai_provider_runs.local_date, (ai_provider_runs.created_at at time zone 'Asia/Kolkata')::date),
  ai_provider_runs.platform,
  coalesce(nullif(ai_provider_runs.app_version, ''), 'unknown'),
  coalesce(ai_provider_runs.app_build, 0)
on conflict (local_date, platform, app_version, app_build) do update
set
  ai_runs = excluded.ai_runs,
  ai_success = excluded.ai_success,
  ai_failed = excluded.ai_failed,
  input_tokens = excluded.input_tokens,
  output_tokens = excluded.output_tokens,
  estimated_cost_usd = excluded.estimated_cost_usd,
  updated_at = now();

insert into platform_daily_active_installs (
  local_date,
  platform,
  install_id,
  app_version,
  app_build,
  first_seen_at,
  last_seen_at
)
select
  (devices.first_seen_at at time zone 'Asia/Kolkata')::date,
  devices.platform,
  devices.install_id,
  coalesce(nullif(devices.app_version, ''), 'unknown'),
  coalesce(devices.app_build, 0),
  devices.first_seen_at,
  devices.first_seen_at
from devices
on conflict (local_date, platform, install_id) do nothing;

insert into platform_daily_active_installs (
  local_date,
  platform,
  install_id,
  app_version,
  app_build,
  first_seen_at,
  last_seen_at
)
select
  (devices.last_seen_at at time zone 'Asia/Kolkata')::date,
  devices.platform,
  devices.install_id,
  coalesce(nullif(devices.app_version, ''), 'unknown'),
  coalesce(devices.app_build, 0),
  devices.last_seen_at,
  devices.last_seen_at
from devices
on conflict (local_date, platform, install_id) do update
set
  app_version = excluded.app_version,
  app_build = excluded.app_build,
  last_seen_at = greatest(platform_daily_active_installs.last_seen_at, excluded.last_seen_at);
