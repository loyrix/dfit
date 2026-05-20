-- 20260520132512_rewarded_ad_progress.up.sql

create table rewarded_ad_progress (
  quota_owner_key text not null,
  profile_id uuid not null references profiles(id) on delete cascade,
  install_id text,
  local_date date not null,
  completed_ads integer not null default 0 check (completed_ads >= 0),
  granted_scans integer not null default 0 check (granted_scans >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (quota_owner_key, local_date)
);

create index rewarded_ad_progress_profile_date_idx
  on rewarded_ad_progress (profile_id, local_date desc);

create table rewarded_ad_events (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  install_id text,
  quota_owner_key text not null,
  local_date date not null,
  provider text not null,
  placement text not null,
  ad_unit_id text,
  transaction_id text,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (provider, transaction_id)
);

create index rewarded_ad_events_owner_date_idx
  on rewarded_ad_events (quota_owner_key, local_date desc);
