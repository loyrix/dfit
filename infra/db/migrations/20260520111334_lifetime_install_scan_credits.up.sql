-- 20260520111334_lifetime_install_scan_credits.up.sql

alter table scan_credits
  alter column free_remaining set default 3,
  alter column rewarded_remaining set default 0;

alter table quota_events
  add column if not exists install_id text;

create index if not exists quota_events_install_id_idx
  on quota_events (install_id);

create table if not exists install_scan_credits (
  install_id text primary key,
  profile_id uuid references profiles(id) on delete set null,
  free_remaining integer not null default 3 check (free_remaining >= 0),
  rewarded_remaining integer not null default 0 check (rewarded_remaining >= 0),
  premium_remaining integer not null default 0 check (premium_remaining >= 0),
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists install_scan_credits_profile_idx
  on install_scan_credits (profile_id);

with latest_device as (
  select distinct on (install_id)
    install_id,
    profile_id,
    first_seen_at,
    last_seen_at
  from devices
  order by install_id, last_seen_at desc
),
install_usage as (
  select
    latest_device.install_id,
    count(quota_events.id) filter (
      where quota_events.event_type = 'consume'
        and quota_events.reason in ('free', 'rewarded')
    )::integer as free_scans_used
  from latest_device
  left join quota_events on quota_events.profile_id = latest_device.profile_id
  group by latest_device.install_id
),
install_premium as (
  select
    latest_device.install_id,
    coalesce(max(scan_credits.premium_remaining), 0)::integer as premium_remaining
  from latest_device
  left join scan_credits on scan_credits.profile_id = latest_device.profile_id
  group by latest_device.install_id
)
insert into install_scan_credits (
  install_id,
  profile_id,
  free_remaining,
  rewarded_remaining,
  premium_remaining,
  first_seen_at,
  last_seen_at
)
select
  latest_device.install_id,
  latest_device.profile_id,
  greatest(0, 3 - coalesce(install_usage.free_scans_used, 0)),
  0,
  coalesce(install_premium.premium_remaining, 0),
  latest_device.first_seen_at,
  latest_device.last_seen_at
from latest_device
left join install_usage on install_usage.install_id = latest_device.install_id
left join install_premium on install_premium.install_id = latest_device.install_id
on conflict (install_id) do update
set
  profile_id = excluded.profile_id,
  free_remaining = least(install_scan_credits.free_remaining, excluded.free_remaining),
  rewarded_remaining = least(install_scan_credits.rewarded_remaining, excluded.rewarded_remaining),
  premium_remaining = greatest(install_scan_credits.premium_remaining, excluded.premium_remaining),
  last_seen_at = greatest(install_scan_credits.last_seen_at, excluded.last_seen_at),
  updated_at = now();

with profile_usage as (
  select
    profiles.id as profile_id,
    count(quota_events.id) filter (
      where quota_events.event_type = 'consume'
        and quota_events.reason in ('free', 'rewarded')
    )::integer as free_scans_used
  from profiles
  left join quota_events on quota_events.profile_id = profiles.id
  group by profiles.id
),
profile_premium as (
  select
    profiles.id as profile_id,
    coalesce(max(scan_credits.premium_remaining), 0)::integer as premium_remaining
  from profiles
  left join scan_credits on scan_credits.profile_id = profiles.id
  group by profiles.id
)
insert into scan_credits (
  profile_id,
  local_date,
  free_remaining,
  rewarded_remaining,
  premium_remaining
)
select
  profiles.id,
  date '1970-01-01',
  greatest(0, 3 - coalesce(profile_usage.free_scans_used, 0)),
  0,
  coalesce(profile_premium.premium_remaining, 0)
from profiles
left join profile_usage on profile_usage.profile_id = profiles.id
left join profile_premium on profile_premium.profile_id = profiles.id
on conflict (profile_id, local_date) do update
set
  free_remaining = least(scan_credits.free_remaining, excluded.free_remaining),
  rewarded_remaining = least(scan_credits.rewarded_remaining, excluded.rewarded_remaining),
  premium_remaining = greatest(scan_credits.premium_remaining, excluded.premium_remaining),
  updated_at = now();

delete from scan_credits
where local_date <> date '1970-01-01';
