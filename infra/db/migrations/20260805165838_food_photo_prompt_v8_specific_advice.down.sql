-- 20260805165838_food_photo_prompt_v8_specific_advice.down.sql
--
-- Only removes the inactive v8 rows. If v8 has been activated from admin,
-- reactivate v7 first: this deliberately refuses to delete a live prompt.

delete from ai_prompt_versions
where created_by = 'migration'
  and not is_active
  and key in ('food_photo', 'food_photo_IN', 'food_photo_GLOBAL')
  and version in (
    'gemini_food_photo_v8',
    'gemini_food_photo_v8_india',
    'gemini_food_photo_v8_global'
  );
