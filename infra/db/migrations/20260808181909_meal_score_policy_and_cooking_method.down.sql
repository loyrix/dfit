-- 20260808181909_meal_score_policy_and_cooking_method.down.sql
--
-- Drops the column and its constraint, and removes the config row only if an
-- operator has not edited it. A row whose updated_by has moved off 'migration'
-- carries someone's deliberate tuning, and silently discarding that on a
-- rollback would lose work this migration never owned.

alter table meal_items
  drop constraint if exists meal_items_cooking_method_check;

alter table meal_items
  drop column if exists cooking_method;

delete from app_runtime_config
where key = 'meal_score_policy'
  and updated_by = 'migration';
