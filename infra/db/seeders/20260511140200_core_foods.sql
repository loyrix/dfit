insert into food_sources (name, source_kind, license_note, url)
select
  'DFit seed',
  'internal',
  'Initial hand-curated MVP seed values for development only.',
  'https://dfit.local'
where not exists (
  select 1 from food_sources where name = 'DFit seed'
);

with source as (
  select id from food_sources where name = 'DFit seed' limit 1
)
insert into foods (
  canonical_name,
  region,
  source_id,
  calories_per_100g,
  protein_g_per_100g,
  carbs_g_per_100g,
  fat_g_per_100g,
  fiber_g_per_100g,
  sodium_mg_per_100g
)
select *
from (
  values
    ('Dal', 'IN', (select id from source), 100, 6, 14, 3, 4, 250),
    ('Cooked rice', 'GLOBAL', (select id from source), 140, 2.8, 30.1, 0.5, 0.4, 3),
    ('Roti', 'IN', (select id from source), 267, 8.7, 53.3, 2.7, 9.7, 317),
    ('Mixed vegetable sabzi', 'IN', (select id from source), 98, 2.6, 13.3, 4.4, 3.7, 258),
    ('Curd', 'IN', (select id from source), 61, 3.5, 4.7, 3.3, 0, 46),
    ('Paneer', 'IN', (select id from source), 265, 18.3, 3.4, 20.8, 0, 22)
) as seed(canonical_name, region, source_id, calories, protein, carbs, fat, fiber, sodium)
where not exists (
  select 1
  from foods
  where foods.canonical_name = seed.canonical_name
    and foods.region = seed.region
);

with alias_seed(canonical_name, region, alias, locale) as (
  values
    ('Dal', 'IN', 'lentil curry', 'en'),
    ('Dal', 'IN', 'dal tadka', 'en-IN'),
    ('Dal', 'IN', 'daal', 'en-IN'),
    ('Cooked rice', 'GLOBAL', 'rice', 'en'),
    ('Cooked rice', 'GLOBAL', 'chawal', 'en-IN'),
    ('Cooked rice', 'GLOBAL', 'steamed rice', 'en'),
    ('Roti', 'IN', 'chapati', 'en-IN'),
    ('Roti', 'IN', 'phulka', 'en-IN'),
    ('Roti', 'IN', 'fulka', 'en-IN'),
    ('Mixed vegetable sabzi', 'IN', 'sabzi', 'en-IN'),
    ('Mixed vegetable sabzi', 'IN', 'subzi', 'en-IN'),
    ('Mixed vegetable sabzi', 'IN', 'vegetable curry', 'en'),
    ('Curd', 'IN', 'dahi', 'en-IN'),
    ('Curd', 'IN', 'yogurt', 'en'),
    ('Paneer', 'IN', 'cottage cheese', 'en')
)
insert into food_aliases (food_id, alias, locale)
select foods.id, alias_seed.alias, alias_seed.locale
from alias_seed
join foods
  on foods.canonical_name = alias_seed.canonical_name
 and foods.region = alias_seed.region
where not exists (
  select 1
  from food_aliases existing
  where existing.food_id = foods.id
    and existing.alias = alias_seed.alias
    and existing.locale = alias_seed.locale
);

insert into portion_conversions (food_id, unit, grams, source, confidence)
select foods.id, portion_seed.unit::portion_unit, portion_seed.grams, 'dfit_seed', portion_seed.confidence
from (
  values
    ('Dal', 'IN', 'katori', 180, 0.7),
    ('Cooked rice', 'GLOBAL', 'bowl', 150, 0.7),
    ('Roti', 'IN', 'piece', 30, 0.75),
    ('Mixed vegetable sabzi', 'IN', 'katori', 120, 0.65),
    ('Curd', 'IN', 'katori', 150, 0.7)
) as portion_seed(canonical_name, region, unit, grams, confidence)
join foods
  on foods.canonical_name = portion_seed.canonical_name
 and foods.region = portion_seed.region
where not exists (
  select 1
  from portion_conversions existing
  where existing.food_id = foods.id
    and existing.unit = portion_seed.unit::portion_unit
    and existing.grams = portion_seed.grams
);
