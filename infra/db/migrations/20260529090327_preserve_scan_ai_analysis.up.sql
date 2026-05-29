-- 20260529090327_preserve_scan_ai_analysis.up.sql

alter table scan_sessions
  drop constraint if exists scan_sessions_profile_id_fkey;

alter table scan_sessions
  alter column profile_id drop not null;

alter table scan_sessions
  add constraint scan_sessions_profile_id_fkey
  foreign key (profile_id) references profiles(id) on delete set null;
