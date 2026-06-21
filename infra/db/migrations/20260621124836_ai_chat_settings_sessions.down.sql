-- 20260621124836_ai_chat_settings_sessions.down.sql

alter table ai_chat_settings
  drop column if exists max_sessions_per_day;
