update food_sources
set
  name = 'LogMyPlate seed',
  url = 'https://logmyplate.local'
where name = concat('D', 'Fit seed')
  or name = 'LogMyPlate seed';

update portion_conversions
set source = 'logmyplate_seed'
where source = concat('d', 'fit_seed');

alter table portion_conversions
  alter column source set default 'logmyplate_seed';
