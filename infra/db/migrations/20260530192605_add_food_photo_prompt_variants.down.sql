delete from ai_prompt_versions
where created_by = 'migration'
  and key in ('food_photo_IN', 'food_photo_GLOBAL')
  and version in ('gemini_food_photo_v5_india', 'gemini_food_photo_v5_global');
