-- 20261010175205_widen_scan_user_hint_for_described_meals.down.sql
--
-- Restores the 280 character limit for new rows.
--
-- Added NOT VALID on purpose: descriptions longer than 280 characters may have
-- been saved while the wider limit was in place, and validating against them
-- would make the rollback fail. Existing rows are left as they are; nothing is
-- truncated or deleted.

alter table scan_sessions
  drop constraint if exists scan_sessions_user_hint_length;

alter table scan_sessions
  add constraint scan_sessions_user_hint_length
  check (user_hint is null or char_length(user_hint) <= 280) not valid;
