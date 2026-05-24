-- 20260524174601_account_identities.up.sql

create table account_identities (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  provider auth_method not null check (provider <> 'anonymous'),
  provider_subject text not null,
  email text,
  email_verified boolean not null default false,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_subject),
  unique (profile_id, provider)
);

create index account_identities_profile_idx
  on account_identities (profile_id);

insert into account_identities (
  profile_id,
  provider,
  provider_subject,
  email,
  email_verified
)
select
  profile_id,
  'email',
  email,
  email,
  true
from account_password_credentials
on conflict (provider, provider_subject) do nothing;

insert into account_identities (
  profile_id,
  provider,
  provider_subject,
  email,
  email_verified
)
select
  id,
  auth_method,
  regexp_replace(provider_subject, '^(apple|google):', ''),
  email,
  email is not null
from profiles
where auth_method in ('apple', 'google')
  and provider_subject is not null
on conflict (provider, provider_subject) do nothing;
