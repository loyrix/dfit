-- 20260621120952_ai_chat_settings.up.sql
-- Stores AI Nutritionist chat runtime configuration that can be tuned from
-- the admin backoffice without a deploy or environment variable change.

create table if not exists ai_chat_settings (
  key text primary key,
  max_turns_per_session integer not null default 15
    check (max_turns_per_session >= 1 and max_turns_per_session <= 200),
  welcome_message_prompt text not null default 'Greet the user warmly and briefly summarize what you see in their data. Keep it under 60 words.',
  updated_by text,
  updated_at timestamptz not null default now()
);

insert into ai_chat_settings (key, max_turns_per_session, welcome_message_prompt)
values (
  'default',
  15,
  'Greet the user warmly and briefly summarize what you see in their data. Keep it under 60 words.'
)
on conflict (key) do nothing;
