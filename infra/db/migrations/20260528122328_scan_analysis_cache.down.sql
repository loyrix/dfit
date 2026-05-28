-- 20260528122328_scan_analysis_cache.down.sql

drop index if exists scan_analysis_cache_profile_created_idx;

drop table if exists scan_analysis_cache;

alter table scan_sessions
  drop constraint if exists scan_sessions_image_hash_algorithm_check,
  drop constraint if exists scan_sessions_image_hash_check,
  drop column if exists image_hash_algorithm,
  drop column if exists image_hash;
