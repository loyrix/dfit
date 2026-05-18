create table meal_images (
  id uuid primary key default gen_random_uuid(),
  meal_id uuid not null unique references meals(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  bucket text not null,
  object_key text not null unique,
  mime_type text not null check (mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  byte_size integer not null check (byte_size > 0),
  width integer,
  height integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index meal_images_profile_created_idx
  on meal_images (profile_id, created_at desc);
