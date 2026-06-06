-- 20260606164145_revenuecat_subscriptions.up.sql

create table if not exists profile_subscription_entitlements (
  profile_id uuid primary key references profiles(id) on delete cascade,
  provider text not null default 'revenuecat' check (provider in ('revenuecat')),
  app_user_id text not null,
  entitlement_id text not null,
  status text not null check (
    status in ('active', 'inactive', 'expired', 'cancelled', 'billing_issue', 'unknown')
  ),
  store text check (
    store in ('app_store', 'play_store', 'stripe', 'promotional', 'unknown')
  ),
  product_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  will_renew boolean,
  environment text,
  latest_event_id text,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, app_user_id, entitlement_id)
);

create index if not exists profile_subscription_entitlements_status_idx
  on profile_subscription_entitlements (status, current_period_end desc);

create table if not exists subscription_events (
  event_id text primary key,
  profile_id uuid references profiles(id) on delete set null,
  provider text not null default 'revenuecat' check (provider in ('revenuecat')),
  app_user_id text not null,
  entitlement_id text,
  event_type text not null,
  product_id text,
  store text,
  environment text,
  purchased_at timestamptz,
  expiration_at timestamptz,
  raw_payload jsonb not null,
  received_at timestamptz not null default now()
);

create index if not exists subscription_events_profile_received_idx
  on subscription_events (profile_id, received_at desc);

create table if not exists premium_scan_usage (
  profile_id uuid not null references profiles(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  local_date date not null,
  used integer not null default 0 check (used >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (profile_id, period_start, local_date),
  check (period_end >= period_start)
);

create index if not exists premium_scan_usage_profile_period_idx
  on premium_scan_usage (profile_id, period_start, period_end);
