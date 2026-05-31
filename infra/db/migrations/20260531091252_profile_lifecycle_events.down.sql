-- 20260531091252_profile_lifecycle_events.down.sql

drop index if exists profile_lifecycle_events_email_idx;
drop index if exists profile_lifecycle_events_event_created_idx;
drop index if exists profile_lifecycle_events_profile_idx;
drop table if exists profile_lifecycle_events;
