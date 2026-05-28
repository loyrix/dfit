-- 20260528144932_account_password_reset_codes.up.sql

create table account_password_reset_codes (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  email text not null,
  code_salt text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  attempt_count integer not null default 0 check (attempt_count >= 0),
  created_at timestamptz not null default now()
);

create index account_password_reset_codes_email_idx
  on account_password_reset_codes (lower(email), expires_at desc);

create index account_password_reset_codes_profile_idx
  on account_password_reset_codes (profile_id, created_at desc);
