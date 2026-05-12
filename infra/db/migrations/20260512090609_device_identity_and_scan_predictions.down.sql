alter table scan_sessions
  drop column if exists image_byte_size;

drop index if exists devices_install_id_unique_idx;
