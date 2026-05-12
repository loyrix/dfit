create unique index if not exists devices_install_id_unique_idx on devices (install_id);

alter table scan_sessions
  add column if not exists image_byte_size integer;
