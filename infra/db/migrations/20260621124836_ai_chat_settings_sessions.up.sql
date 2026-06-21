-- 20260621124836_ai_chat_settings_sessions.up.sql
-- Adds max_sessions_per_day to ai_chat_settings so the free-tier chat
-- allowance is admin-configurable instead of only deploy-time env var.

alter table ai_chat_settings
  add column if not exists max_sessions_per_day integer not null default 5
    check (max_sessions_per_day >= 1 and max_sessions_per_day <= 100);

-- Ensure the seed row has the default value
update ai_chat_settings
set max_sessions_per_day = 5
where key = 'default'
  and max_sessions_per_day is distinct from 5;
