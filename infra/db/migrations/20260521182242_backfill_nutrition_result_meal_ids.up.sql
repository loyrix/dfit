-- 20260521182242_backfill_nutrition_result_meal_ids.up.sql

update nutrition_results
set meal_id = meal_items.meal_id
from meal_items
where nutrition_results.meal_id is null
  and nutrition_results.meal_item_id = meal_items.id;
