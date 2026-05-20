-- 20260520174816_store_scan_image_object.down.sql
drop index if exists scan_sessions_image_object_key_unique_idx;

alter table scan_sessions
  drop column if exists image_object_key,
  drop column if exists image_bucket;
