-- 20260826144500_food_photo_prompt_v10_wider_food_detection.down.sql
--
-- Only removes the inactive v10 rows. If v10 has been activated from admin,
-- reactivate the previous version first: this refuses to delete a live prompt.

delete from ai_prompt_versions
where created_by = 'migration'
  and not is_active
  and key in ('food_photo', 'food_photo_IN', 'food_photo_GLOBAL')
  and version in (
    'gemini_food_photo_v10',
    'gemini_food_photo_v10_india',
    'gemini_food_photo_v10_global'
  );
