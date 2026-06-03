-- 20260603144951_push_notification_tokens.up.sql
create table push_notification_tokens (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  install_id text not null,
  provider text not null check (provider in ('fcm')),
  platform text not null check (platform in ('ios', 'android')),
  token text not null,
  token_hash text not null,
  permission_status text not null default 'unknown' check (
    permission_status in ('authorized', 'provisional', 'denied', 'not_determined', 'unknown')
  ),
  locale text,
  region text,
  timezone text,
  app_version text,
  app_build integer,
  enabled boolean not null default true,
  disabled_at timestamptz,
  last_registered_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, token_hash)
);

create index push_notification_tokens_profile_idx
  on push_notification_tokens (profile_id, enabled, last_seen_at desc);

create index push_notification_tokens_install_idx
  on push_notification_tokens (install_id, enabled, last_seen_at desc);

update app_runtime_config
set
  description = 'Controls review prompts, interstitial ads, FCM push reminder scenarios, and streak celebrations for mobile clients.',
  updated_at = now()
where key = 'engagement_policy';
