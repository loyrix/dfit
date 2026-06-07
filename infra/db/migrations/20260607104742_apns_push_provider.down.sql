-- 20260607104742_apns_push_provider.down.sql

alter table push_notification_tokens
  drop column if exists apns_sandbox;

-- Delete any APNs tokens before restoring the constraint
delete from push_notification_tokens where provider = 'apns';

alter table push_notification_tokens
  drop constraint if exists push_notification_tokens_provider_check;

alter table push_notification_tokens
  add constraint push_notification_tokens_provider_check
    check (provider in ('fcm'));
