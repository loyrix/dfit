-- 20260526124141_admin_backoffice.up.sql

alter table feature_flags
  add column if not exists updated_by text;

create table admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor text not null,
  action text not null,
  target_type text not null,
  target_id text,
  reason text,
  before_json jsonb,
  after_json jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index admin_audit_log_created_idx
  on admin_audit_log (created_at desc);

create index admin_audit_log_target_idx
  on admin_audit_log (target_type, target_id, created_at desc);

create table app_runtime_config (
  key text primary key,
  value jsonb not null,
  description text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table ai_model_configs (
  key text primary key,
  platform text not null default 'vertex' check (platform = 'vertex'),
  model_family text not null check (model_family in ('gemini', 'claude', 'mistral', 'llama', 'custom')),
  model text not null,
  display_name text not null,
  enabled boolean not null default true,
  is_default boolean not null default false,
  fallback_key text references ai_model_configs(key) on delete set null,
  max_output_tokens integer not null default 3072 check (max_output_tokens > 0),
  temperature numeric(4,3) not null default 0.1 check (temperature >= 0 and temperature <= 2),
  top_p numeric(4,3) not null default 0.8 check (top_p > 0 and top_p <= 1),
  pricing_json jsonb not null default '{}',
  notes text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index ai_model_configs_single_default_idx
  on ai_model_configs ((is_default))
  where is_default;

create table ai_prompt_versions (
  id uuid primary key default gen_random_uuid(),
  key text not null,
  version text not null,
  model_family text not null default 'gemini',
  title text not null,
  body text not null,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  is_active boolean not null default false,
  created_by text,
  updated_by text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (key, version)
);

create unique index ai_prompt_versions_one_active_key_idx
  on ai_prompt_versions (key)
  where is_active;

create table admin_scan_credit_grants (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  credit_type text not null check (credit_type in ('free', 'rewarded', 'premium')),
  amount integer not null check (amount > 0 and amount <= 1000),
  reason text not null,
  actor text not null,
  audit_log_id uuid references admin_audit_log(id) on delete set null,
  created_at timestamptz not null default now()
);

create index admin_scan_credit_grants_profile_idx
  on admin_scan_credit_grants (profile_id, created_at desc);

create table app_notices (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  severity text not null default 'info' check (severity in ('info', 'success', 'warning', 'critical')),
  active boolean not null default false,
  cta_label text,
  cta_url text,
  audience_json jsonb not null default '{}',
  starts_at timestamptz,
  ends_at timestamptz,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index app_notices_active_idx
  on app_notices (active, starts_at, ends_at);

insert into ai_model_configs (
  key,
  platform,
  model_family,
  model,
  display_name,
  enabled,
  is_default,
  fallback_key,
  max_output_tokens,
  temperature,
  top_p,
  pricing_json,
  notes,
  updated_by
) values
  (
    'vertex-gemini-2.5-flash',
    'vertex',
    'gemini',
    'gemini-2.5-flash',
    'Gemini 2.5 Flash',
    true,
    true,
    'vertex-gemini-2.5-flash-lite',
    3072,
    0.1,
    0.8,
    '{"inputPerMillionUsd":0.30,"outputPerMillionUsd":2.50}',
    'Primary production model for image food scans.',
    'migration'
  ),
  (
    'vertex-gemini-2.5-flash-lite',
    'vertex',
    'gemini',
    'gemini-2.5-flash-lite',
    'Gemini 2.5 Flash Lite',
    true,
    false,
    null,
    3072,
    0.1,
    0.8,
    '{"inputPerMillionUsd":0.10,"outputPerMillionUsd":0.40}',
    'Lower-cost fallback for simple scan traffic.',
    'migration'
  )
on conflict (key) do nothing;

insert into ai_prompt_versions (
  key,
  version,
  model_family,
  title,
  body,
  status,
  is_active,
  created_by,
  updated_by,
  published_at
) values (
  'food_photo',
  'gemini_food_photo_v5',
  'gemini',
  'Indian-first food photo analysis',
  $prompt$
You are LogMyPlate's advanced Indian food recognition and nutrition analysis AI. Analyze the attached
meal photo for an editable food journal. Be Indian-first and global-ready: recognize Indian
home-cooked foods, common English food names, Hinglish terms, regional Indian names, and
global foods when they are actually visible.

VISIBLE-ONLY RULES:
- First decide whether the image contains visible edible food or drink intended for a meal log.
- If there is no clear edible food or drink, return mealName "No food detected" and items [].
- Reject screenshots, people, pets, documents, menus, packaging-only photos, kitchens, empty plates,
  utensils, and random objects unless edible food or drink is clearly visible.
- Analyze ONLY food items that are actually visible in the image.
- Do NOT invent, hallucinate, or assume food items.
- Do NOT assume hidden ingredients.
- Do NOT add oil, butter, ghee, cheese, sugar, sauces, chutneys, pickles, garnishes, or
  condiments unless they are clearly visible as separate food evidence.
- If uncertain, prefer a conservative identification, lower confidence, and add a plausible
  alternative identification in aliases rather than guessing.
- Accuracy is more important than completeness.

REGIONAL DISAMBIGUATION:
- Use regional plate context only to choose between visually plausible foods; it must not override
  visible-only rules.
- In Indian thali photos, a smooth pink liquid/side in a katori may be Solkadhi/kokum kadhi or
  pink/beetroot raita. Prefer Solkadhi/kokum kadhi when it appears smooth and drink-like in
  Maharashtrian, Goan, Konkani, or coastal thali context; call it raita only when yogurt/curd
  texture or vegetable/herb pieces are visible.

PORTION ESTIMATION METHOD:
- Use plate geometry, relative object scaling, estimated plate diameter, food area coverage,
  visible height/depth from perspective, known average food dimensions, realistic Indian
  serving references, and density-based volume-to-weight estimation.
- Count visible pieces/items individually whenever possible.
- Separate different visible foods individually; do not merge them into generic categories.
- If foods overlap or are partially hidden, estimate only the visible portion conservatively.
- Estimate the visible consumed portion, not nutrition per 100g.

OUTPUT MAPPING:
- Use name for the most precise visible food identification.
- Use aliases only for genuinely plausible alternative English, Hinglish, or regional names.
- Use confidence from 0 to 1 to represent uncertainty.
- Use mealType "snack" only when the visible foods themselves are clearly snack-like; the app
  will resolve breakfast, lunch, or dinner from the user's local time.
- Use quantity plus unit for the best visible household measure; use piece-like units when
  countable pieces are visible.
- Always provide estimatedGrams and calories, proteinG, carbsG, fatG, and fiberG when feasible.
- Keep names short and user-editable.
- Work through the visual reasoning internally, but return only the required JSON schema.

{{USER_HINT_BLOCK}}

Return JSON only. Calories are kcal. Protein, carbs, fat, fiber, and sugar are grams. Sodium
is milligrams. Prefer these portion units when appropriate: gram, ml, piece, serving, bowl,
katori, cup, tablespoon, teaspoon, ladle, roti, idli, dosa, slice, scoop, small, medium,
large.
  $prompt$,
  'published',
  true,
  'migration',
  'migration',
  now()
)
on conflict (key, version) do nothing;

insert into app_runtime_config (key, value, description, updated_by) values
  (
    'scan_limits',
    '{"freeLifetime":3,"rewardedCap":5,"launchTotalCap":8,"rewardedAdsPerScan":1,"rewardedPeriod":"day"}',
    'Public scan allowance values surfaced through app config.',
    'migration'
  ),
  (
    'maintenance',
    '{"enabled":false,"message":null}',
    'Emergency maintenance mode values for app clients.',
    'migration'
  ),
  (
    'admin_policy',
    '{"rawImageViewingRequiresReason":true,"creditGrantRequiresReason":true}',
    'Operational safety rules for admin workflows.',
    'migration'
  )
on conflict (key) do nothing;

insert into feature_flags (key, value, description, updated_by) values
  ('account_link', 'true', 'Allow users to save journals with account linking.', 'migration'),
  ('rewarded_ads', 'true', 'Allow rewarded ads to unlock additional scans.', 'migration'),
  ('premium', 'false', 'Premium monetization is not live yet.', 'migration'),
  ('target_bmi_onboarding', 'true', 'Show daily target and BMI setup flows.', 'migration')
on conflict (key) do nothing;
