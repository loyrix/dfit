-- 20260801124915_food_photo_prompt_v6_portion_scope.down.sql
--
-- Only removes the inactive v6 rows. If v6 has been activated from admin,
-- reactivate v5 first: this deliberately refuses to delete a live prompt.

delete from ai_prompt_versions
where created_by = 'migration'
  and not is_active
  and key in ('food_photo', 'food_photo_IN', 'food_photo_GLOBAL')
  and version in (
    'gemini_food_photo_v6',
    'gemini_food_photo_v6_india',
    'gemini_food_photo_v6_global'
  );
