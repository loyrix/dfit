-- 20260621130651_split_chat_session_limits.down.sql

alter table ai_chat_settings
  drop column if exists premium_max_sessions_per_day;

alter table ai_chat_settings
  alter column free_max_sessions_per_day set default 5;

alter table ai_chat_settings
  rename column free_max_sessions_per_day to max_sessions_per_day;
