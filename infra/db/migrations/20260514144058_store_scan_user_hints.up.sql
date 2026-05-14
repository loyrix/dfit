-- 20260514144058_store_scan_user_hints.up.sql

alter table scan_sessions
  add column if not exists user_hint text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'scan_sessions_user_hint_length'
      and conrelid = 'scan_sessions'::regclass
  ) then
    alter table scan_sessions
      add constraint scan_sessions_user_hint_length
      check (user_hint is null or char_length(user_hint) <= 280);
  end if;
end $$;
