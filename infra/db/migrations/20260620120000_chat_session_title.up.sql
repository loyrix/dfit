-- chat_session_title.up.sql
-- Adds an auto-generated heading for nutritionist chat sessions, derived from
-- the first user message. Nullable so existing rows fall back to a default
-- label in the client.

alter table chat_sessions
  add column if not exists title text;
