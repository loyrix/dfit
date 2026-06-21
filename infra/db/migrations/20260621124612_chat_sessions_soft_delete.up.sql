-- 20260621124612_chat_sessions_soft_delete.up.sql
-- Adds soft-delete support to chat_sessions so that deleted sessions do not
-- reduce the daily session count (which would let users bypass the daily limit).

alter table chat_sessions
  add column if not exists deleted_at timestamptz;

-- Existing list/count queries can rely on "deleted_at is null" to exclude
-- soft-deleted rows.
