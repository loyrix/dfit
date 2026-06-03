-- 20260603230356_add_push_reminder_scenario_slots.up.sql
alter table push_reminder_deliveries
  add column scenario_slot text not null default 'primary'
    check (scenario_slot in ('primary', 'secondary'));

drop index if exists push_reminder_deliveries_once_idx;

create unique index push_reminder_deliveries_once_idx
  on push_reminder_deliveries (profile_id, scenario_key, scenario_slot, local_date);
