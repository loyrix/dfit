import 'package:dfit_mobile/src/models/meal.dart';
import 'package:dfit_mobile/src/models/meal_type_resolver.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('uses local time for main meal defaults', () {
    expect(mealTypeForLocalTime(DateTime(2026, 5, 17, 8)), MealType.breakfast);
    expect(mealTypeForLocalTime(DateTime(2026, 5, 17, 13)), MealType.lunch);
    expect(mealTypeForLocalTime(DateTime(2026, 5, 17, 20)), MealType.dinner);
    expect(mealTypeForLocalTime(DateTime(2026, 5, 17, 2)), MealType.dinner);
  });

  test('keeps food-suggested snack regardless of clock time', () {
    expect(
      mealTypeForReview(
        localTime: DateTime(2026, 5, 17, 8),
        foodSuggestedType: MealType.snack,
      ),
      MealType.snack,
    );
  });

  test('ignores non-snack food suggestions in favor of local time', () {
    expect(
      mealTypeForReview(
        localTime: DateTime(2026, 5, 17, 20),
        foodSuggestedType: MealType.breakfast,
      ),
      MealType.dinner,
    );
  });
}
