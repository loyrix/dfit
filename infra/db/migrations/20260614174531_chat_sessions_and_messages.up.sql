-- chat_sessions_and_messages.up.sql

create table if not exists chat_sessions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  session_date date not null default current_date,
  turn_count int not null default 0 check (turn_count >= 0),
  max_turns int not null default 15,
  context_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  closed_at timestamptz
);

create index if not exists idx_chat_sessions_profile_date
  on chat_sessions (profile_id, session_date);

create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references chat_sessions(id) on delete cascade,
  role text not null check (role in ('system', 'user', 'assistant')),
  content text not null,
  turn_number int not null default 0,
  input_tokens int,
  output_tokens int,
  latency_ms int,
  created_at timestamptz not null default now()
);

create index if not exists idx_chat_messages_session_turn
  on chat_messages (session_id, turn_number);
