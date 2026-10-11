-- 20261010175205_widen_scan_user_hint_for_described_meals.up.sql
--
-- A scan can now be a meal described in words with no photo. The text is then
-- the whole meal rather than a clue about a picture, and a full plate with
-- quantities does not fit in the 280 characters a photo note is held to.
--
-- Widens the stored limit to 600. The API still holds a note sent with a photo
-- to 280, so this only makes room for described meals. Every existing row is
-- within the old limit and therefore within the new one.
--
-- Apply before deploying the API build that accepts described meals: with the
-- old constraint in place a description over 280 characters fails to save.

alter table scan_sessions
  drop constraint if exists scan_sessions_user_hint_length;

alter table scan_sessions
  add constraint scan_sessions_user_hint_length
  check (user_hint is null or char_length(user_hint) <= 600);
