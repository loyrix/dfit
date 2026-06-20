-- chat_session_title.down.sql

alter table chat_sessions
  drop column if exists title;
