-- 20261010180248_food_photo_prompt_v11_always_suggest.down.sql
--
-- Only removes the inactive v11 rows. If v11 has been activated from admin,
-- reactivate the previous version first: this refuses to delete a live prompt.

delete from ai_prompt_versions
where created_by = 'migration'
  and not is_active
  and key in ('food_photo', 'food_photo_IN', 'food_photo_GLOBAL')
  and version in (
    'gemini_food_photo_v11',
    'gemini_food_photo_v11_india',
    'gemini_food_photo_v11_global'
  );
