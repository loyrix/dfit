-- 20260607104742_apns_push_provider.up.sql
-- Allow 'apns' as a push provider for direct APNs delivery to iOS devices,
-- bypassing Firebase Cloud Messaging for iOS push notifications.

alter table push_notification_tokens
  drop constraint if exists push_notification_tokens_provider_check;

alter table push_notification_tokens
  add constraint push_notification_tokens_provider_check
    check (provider in ('fcm', 'apns'));

alter table push_notification_tokens
  add column if not exists apns_sandbox boolean;
