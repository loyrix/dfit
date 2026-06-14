-- chat_sessions_and_messages.down.sql

drop index if exists idx_chat_messages_session_turn;
drop table if exists chat_messages;
drop index if exists idx_chat_sessions_profile_date;
drop table if exists chat_sessions;
