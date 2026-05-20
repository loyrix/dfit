-- 20260520174816_store_scan_image_object.up.sql
alter table scan_sessions
  add column if not exists image_bucket text,
  add column if not exists image_object_key text;

create unique index if not exists scan_sessions_image_object_key_unique_idx
  on scan_sessions (image_object_key)
  where image_object_key is not null;
