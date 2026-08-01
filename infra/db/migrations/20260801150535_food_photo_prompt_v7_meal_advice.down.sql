-- 20260801150535_food_photo_prompt_v7_meal_advice.down.sql
--
-- Only removes the inactive v7 rows. If v7 has been activated from admin,
-- reactivate v6 first: this deliberately refuses to delete a live prompt.

delete from ai_prompt_versions
where created_by = 'migration'
  and not is_active
  and key in ('food_photo', 'food_photo_IN', 'food_photo_GLOBAL')
  and version in (
    'gemini_food_photo_v7',
    'gemini_food_photo_v7_india',
    'gemini_food_photo_v7_global'
  );
