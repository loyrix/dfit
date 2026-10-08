-- 20260924183100_add_barcode_to_foods.down.sql

delete from food_sources where name = 'Open Food Facts';

drop index if exists foods_barcode_idx;

alter table foods drop column if exists barcode;
