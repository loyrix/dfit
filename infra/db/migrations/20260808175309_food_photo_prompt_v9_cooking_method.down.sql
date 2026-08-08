-- 20260808175309_food_photo_prompt_v9_cooking_method.down.sql
--
-- Only removes the inactive v9 rows. If v9 has been activated from admin,
-- reactivate the previous version first: this refuses to delete a live prompt.

delete from ai_prompt_versions
where created_by = 'migration'
  and not is_active
  and key in ('food_photo', 'food_photo_IN', 'food_photo_GLOBAL')
  and version in (
    'gemini_food_photo_v9',
    'gemini_food_photo_v9_india',
    'gemini_food_photo_v9_global'
  );
