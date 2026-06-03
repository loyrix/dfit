-- 20260603230356_add_push_reminder_scenario_slots.down.sql
drop index if exists push_reminder_deliveries_once_idx;

delete from push_reminder_deliveries
where scenario_slot <> 'primary';

create unique index push_reminder_deliveries_once_idx
  on push_reminder_deliveries (profile_id, scenario_key, local_date);

alter table push_reminder_deliveries
  drop column if exists scenario_slot;
