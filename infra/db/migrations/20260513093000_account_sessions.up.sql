create table account_password_credentials (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  email text not null,
  password_salt text not null,
  password_hash text not null,
  password_params jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id),
  unique (email)
);

create table account_sessions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index profiles_email_unique_idx
  on profiles (lower(email))
  where email is not null;

create index account_sessions_profile_idx
  on account_sessions (profile_id, expires_at)
  where revoked_at is null;
