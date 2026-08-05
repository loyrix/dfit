-- 20260805165409_meal_advice.up.sql
--
-- Stores the model's meal advice alongside the meal it describes.
--
-- Until now advice existed only on the analyze response, so it appeared on the
-- review screen and was discarded on confirm: we paid for it on every scan and
-- it survived about ten seconds. Persisting it lets meal detail show the same
-- guidance the user saw before saving.
--
-- Nullable with no default. Meals saved before this, and meals whose advice the
-- model declined to write, simply have none, and the UI renders nothing rather
-- than an empty card.

alter table meals
  add column if not exists advice jsonb;
