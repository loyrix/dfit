-- 20260528122328_scan_analysis_cache.up.sql

alter table scan_sessions
  add column if not exists image_hash text,
  add column if not exists image_hash_algorithm text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'scan_sessions_image_hash_check'
      and conrelid = 'scan_sessions'::regclass
  ) then
    alter table scan_sessions
      add constraint scan_sessions_image_hash_check
      check (image_hash is null or image_hash ~ '^[a-f0-9]{64}$');
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'scan_sessions_image_hash_algorithm_check'
      and conrelid = 'scan_sessions'::regclass
  ) then
    alter table scan_sessions
      add constraint scan_sessions_image_hash_algorithm_check
      check (image_hash_algorithm is null or image_hash_algorithm = 'sha256:v1');
  end if;
end $$;

create table scan_analysis_cache (
  profile_id uuid not null references profiles(id) on delete cascade,
  image_hash text not null,
  hash_algorithm text not null,
  image_mime_type text,
  image_byte_size integer,
  analyzed_response jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (profile_id, hash_algorithm, image_hash),
  constraint scan_analysis_cache_hash_algorithm_check
    check (hash_algorithm = 'sha256:v1'),
  constraint scan_analysis_cache_image_hash_check
    check (image_hash ~ '^[a-f0-9]{64}$'),
  constraint scan_analysis_cache_image_mime_type_check
    check (
      image_mime_type is null
      or image_mime_type in ('image/jpeg', 'image/png', 'image/webp')
    ),
  constraint scan_analysis_cache_image_byte_size_check
    check (image_byte_size is null or image_byte_size > 0)
);

create index scan_analysis_cache_profile_created_idx
  on scan_analysis_cache (profile_id, created_at desc);
