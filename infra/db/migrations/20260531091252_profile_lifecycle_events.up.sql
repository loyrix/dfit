-- 20260531091252_profile_lifecycle_events.up.sql

create table profile_lifecycle_events (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null,
  event_type text not null check (event_type in ('deactivated', 'deleted')),
  actor_type text not null default 'user' check (actor_type in ('user', 'admin', 'system')),
  actor text not null,
  reason text,
  auth_method text,
  email text,
  display_name text,
  identity_provider text,
  provider_subject text,
  profile_timezone text,
  profile_created_at timestamptz,
  profile_updated_at timestamptz,
  install_id text,
  platform text check (platform is null or platform in ('ios', 'android')),
  app_version text,
  app_build integer,
  device_timezone text,
  device_region text,
  device_locale text,
  scan_count integer not null default 0,
  failed_scan_count integer not null default 0,
  meal_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index profile_lifecycle_events_profile_idx
  on profile_lifecycle_events (profile_id, created_at desc);

create index profile_lifecycle_events_event_created_idx
  on profile_lifecycle_events (event_type, created_at desc);

create index profile_lifecycle_events_email_idx
  on profile_lifecycle_events (lower(email))
  where email is not null;
