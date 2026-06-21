-- 20260621124612_chat_sessions_soft_delete.down.sql

alter table chat_sessions
  drop column if exists deleted_at;
