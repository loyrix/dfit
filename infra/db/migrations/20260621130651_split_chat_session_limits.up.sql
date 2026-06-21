-- 20260621130651_split_chat_session_limits.up.sql
-- Renames max_sessions_per_day to free_max_sessions_per_day and adds a
-- separate premium_max_sessions_per_day so admin can configure different
-- daily chat session limits for free vs premium users.

alter table ai_chat_settings
  rename column max_sessions_per_day to free_max_sessions_per_day;

alter table ai_chat_settings
  alter column free_max_sessions_per_day set default 3;

alter table ai_chat_settings
  add column premium_max_sessions_per_day integer not null default 50
    check (premium_max_sessions_per_day >= 1 and premium_max_sessions_per_day <= 1000);

update ai_chat_settings
set
  free_max_sessions_per_day = 3,
  premium_max_sessions_per_day = 50
where key = 'default';
