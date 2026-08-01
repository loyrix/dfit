-- 20260801144304_profile_health_conditions.up.sql
--
-- Optional health focus areas on the existing health target.
--
-- Additive and defaulted, so every existing row keeps behaving exactly as it
-- does today. Conditions change the wording around a Plate Score, never the
-- number: keeping the score to pure nutrition math is what keeps it out of
-- medical-claim territory.
--
-- Deliberately launched with four options only (diabetes, blood pressure,
-- cholesterol, PCOS). Kidney disease, gout, IBS, pregnancy and allergies carry
-- the highest medical risk and the smallest audience, so they are not in v1.

alter table profile_health_targets
  add column if not exists health_focus text[] not null default '{}';
