-- 20260514144058_store_scan_user_hints.down.sql

alter table scan_sessions
  drop constraint if exists scan_sessions_user_hint_length;

alter table scan_sessions
  drop column if exists user_hint;
