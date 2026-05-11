create extension if not exists pgcrypto;

create type auth_method as enum ('anonymous', 'apple', 'google', 'email');
create type meal_type as enum ('breakfast', 'lunch', 'snack', 'dinner');
create type scan_status as enum (
  'prepared',
  'analyzing',
  'ready_for_review',
  'confirmed',
  'cancelled',
  'failed'
);
create type portion_unit as enum (
  'gram',
  'ml',
  'piece',
  'serving',
  'bowl',
  'katori',
  'cup',
  'tablespoon',
  'teaspoon',
  'ladle',
  'roti',
  'idli',
  'dosa',
  'slice',
  'scoop',
  'small',
  'medium',
  'large'
);

create table profiles (
  id uuid primary key default gen_random_uuid(),
  supabase_user_id uuid unique,
  auth_method auth_method not null default 'anonymous',
  linked_at timestamptz,
  email text,
  provider_subject text,
  timezone text not null default 'Asia/Kolkata',
  deletion_requested_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table identity_link_events (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  from_auth_method auth_method not null,
  to_auth_method auth_method not null,
  meals_count integer not null default 0,
  created_at timestamptz not null default now()
);

create table devices (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  install_id text not null,
  platform text not null check (platform in ('ios', 'android')),
  locale text,
  region text,
  timezone text,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  unique (profile_id, install_id)
);

create table consents (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  analytics_enabled boolean not null default true,
  ai_improvement_opt_in boolean not null default false,
  accepted_terms_version text,
  accepted_privacy_version text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table idempotency_keys (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  idempotency_key text not null,
  method text not null,
  path text not null,
  response_status integer not null,
  response_body jsonb not null,
  created_at timestamptz not null default now(),
  unique (profile_id, idempotency_key)
);

create table feature_flags (
  key text primary key,
  value jsonb not null,
  description text,
  updated_at timestamptz not null default now()
);

create table scan_credits (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  local_date date not null,
  free_remaining integer not null default 1 check (free_remaining >= 0),
  rewarded_remaining integer not null default 0 check (rewarded_remaining >= 0),
  premium_remaining integer not null default 0 check (premium_remaining >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, local_date)
);

create table quota_events (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  scan_credit_id uuid references scan_credits(id) on delete set null,
  event_type text not null,
  reason text not null,
  delta integer not null,
  local_date date not null,
  created_at timestamptz not null default now()
);

create table rewarded_ad_callbacks (
  transaction_id text primary key,
  profile_id uuid references profiles(id) on delete cascade,
  scan_session_id uuid,
  raw_query jsonb not null,
  signature_key_id text,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

create table food_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  source_kind text not null,
  license_note text,
  url text,
  created_at timestamptz not null default now()
);

create table foods (
  id uuid primary key default gen_random_uuid(),
  canonical_name text not null,
  region text,
  source_id uuid references food_sources(id) on delete set null,
  source_food_id text,
  calories_per_100g numeric(8,2) not null,
  protein_g_per_100g numeric(8,2) not null,
  carbs_g_per_100g numeric(8,2) not null,
  fat_g_per_100g numeric(8,2) not null,
  fiber_g_per_100g numeric(8,2),
  sugar_g_per_100g numeric(8,2),
  sodium_mg_per_100g numeric(8,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table food_aliases (
  id uuid primary key default gen_random_uuid(),
  food_id uuid not null references foods(id) on delete cascade,
  alias text not null,
  locale text,
  created_at timestamptz not null default now(),
  unique (food_id, alias, locale)
);

create table portion_conversions (
  id uuid primary key default gen_random_uuid(),
  food_id uuid references foods(id) on delete cascade,
  unit portion_unit not null,
  grams numeric(8,2) not null check (grams >= 0),
  source text not null default 'dfit_seed',
  confidence numeric(4,3) not null default 0.7 check (confidence >= 0 and confidence <= 1),
  created_at timestamptz not null default now()
);

create table dish_templates (
  id uuid primary key default gen_random_uuid(),
  canonical_name text not null,
  region text,
  cuisine text,
  default_unit portion_unit not null,
  default_grams numeric(8,2) not null,
  created_at timestamptz not null default now()
);

create table dish_template_items (
  id uuid primary key default gen_random_uuid(),
  dish_template_id uuid not null references dish_templates(id) on delete cascade,
  food_id uuid not null references foods(id) on delete restrict,
  grams numeric(8,2) not null,
  created_at timestamptz not null default now()
);

create table meals (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  meal_type meal_type not null,
  title text not null,
  logged_at timestamptz not null,
  local_date date not null,
  source text not null default 'manual',
  scan_session_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table meal_items (
  id uuid primary key default gen_random_uuid(),
  meal_id uuid not null references meals(id) on delete cascade,
  food_id uuid references foods(id) on delete set null,
  display_name text not null,
  quantity numeric(8,2) not null,
  unit portion_unit not null,
  grams numeric(8,2) not null,
  user_edited boolean not null default false,
  created_at timestamptz not null default now()
);

create table nutrition_results (
  id uuid primary key default gen_random_uuid(),
  meal_item_id uuid references meal_items(id) on delete cascade,
  meal_id uuid references meals(id) on delete cascade,
  calories numeric(9,2) not null,
  protein_g numeric(9,2) not null,
  carbs_g numeric(9,2) not null,
  fat_g numeric(9,2) not null,
  fiber_g numeric(9,2),
  sugar_g numeric(9,2),
  sodium_mg numeric(9,2),
  source_version text not null default 'seed_v1',
  created_at timestamptz not null default now(),
  check (meal_item_id is not null or meal_id is not null)
);

create table scan_sessions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  status scan_status not null default 'prepared',
  ad_credit_granted boolean not null default false,
  rewarded_ad_transaction_id text references rewarded_ad_callbacks(transaction_id),
  consumed_credit_reason text,
  image_width integer,
  image_height integer,
  image_mime_type text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table rewarded_ad_callbacks
  add constraint rewarded_ad_callbacks_scan_fk
  foreign key (scan_session_id) references scan_sessions(id) on delete set null;

alter table meals
  add constraint meals_scan_session_fk
  foreign key (scan_session_id) references scan_sessions(id) on delete set null;

create table ai_provider_runs (
  id uuid primary key default gen_random_uuid(),
  scan_session_id uuid references scan_sessions(id) on delete cascade,
  provider text not null,
  model text not null,
  prompt_version text not null,
  schema_version text not null,
  input_token_estimate integer,
  output_token_estimate integer,
  estimated_cost_usd numeric(12,6),
  latency_ms integer,
  success boolean not null,
  error_code text,
  created_at timestamptz not null default now()
);

create table ai_predictions (
  id uuid primary key default gen_random_uuid(),
  scan_session_id uuid not null references scan_sessions(id) on delete cascade,
  provider_run_id uuid references ai_provider_runs(id) on delete set null,
  detected_language text,
  raw_ai_json jsonb not null,
  total_confidence numeric(4,3),
  created_at timestamptz not null default now()
);

create table ai_predicted_items (
  id uuid primary key default gen_random_uuid(),
  ai_prediction_id uuid not null references ai_predictions(id) on delete cascade,
  name text not null,
  aliases text[] not null default '{}',
  quantity numeric(8,2) not null,
  unit portion_unit not null,
  estimated_grams numeric(8,2) not null,
  confidence numeric(4,3) not null,
  mapped_food_id uuid references foods(id) on delete set null,
  created_at timestamptz not null default now()
);

create table user_corrections (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  scan_session_id uuid references scan_sessions(id) on delete cascade,
  correction_kind text not null,
  before_json jsonb,
  after_json jsonb not null,
  created_at timestamptz not null default now()
);

create table daily_summaries (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  local_date date not null,
  calories numeric(9,2) not null default 0,
  protein_g numeric(9,2) not null default 0,
  carbs_g numeric(9,2) not null default 0,
  fat_g numeric(9,2) not null default 0,
  meal_count integer not null default 0,
  computed_at timestamptz not null default now(),
  unique (profile_id, local_date)
);

create table weekly_summaries (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  week_start_local_date date not null,
  summary_json jsonb not null,
  computed_at timestamptz not null default now(),
  unique (profile_id, week_start_local_date)
);

create table pattern_flags (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  local_date date,
  flag_key text not null,
  severity text not null default 'info',
  message text not null,
  evidence_json jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index meals_profile_date_idx on meals (profile_id, local_date desc);
create index meal_items_meal_idx on meal_items (meal_id);
create index scan_sessions_profile_created_idx on scan_sessions (profile_id, created_at desc);
create index ai_predictions_scan_idx on ai_predictions (scan_session_id);
create index foods_name_idx on foods using gin (to_tsvector('simple', canonical_name));
create index food_aliases_alias_idx on food_aliases using gin (to_tsvector('simple', alias));
