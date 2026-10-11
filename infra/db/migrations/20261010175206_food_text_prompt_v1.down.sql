-- 20261010175206_food_text_prompt_v1.down.sql
--
-- Only removes the inactive v1 row. If it has been activated from admin,
-- deactivate it first: this refuses to delete a live prompt.

delete from ai_prompt_versions
where created_by = 'migration'
  and not is_active
  and key = 'food_text'
  and version = 'gemini_food_text_v1';
