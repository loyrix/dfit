-- 20260924183100_add_barcode_to_foods.up.sql
--
-- Adds optional barcode support to the canonical foods catalog.
-- Partial unique index ensures uniqueness for non-null barcodes while allowing
-- multiple unbarcoded items (e.g. fresh fruits, homemade recipes, seed items).

alter table foods add column if not exists barcode text;

create unique index if not exists foods_barcode_idx on foods (barcode) where barcode is not null;

insert into food_sources (name, source_kind, license_note, url)
select 'Open Food Facts', 'packaged', 'Open Database License (ODbL)', 'https://world.openfoodfacts.org'
where not exists (select 1 from food_sources where name = 'Open Food Facts');
