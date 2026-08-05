-- 20260805165409_meal_advice.down.sql

alter table meals
  drop column if exists advice;
