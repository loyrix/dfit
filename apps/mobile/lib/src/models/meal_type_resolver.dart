import 'meal.dart';

MealType mealTypeForLocalTime(DateTime localTime) {
  final hour = localTime.hour;
  if (hour >= 5 && hour < 11) return MealType.breakfast;
  if (hour >= 11 && hour < 17) return MealType.lunch;
  return MealType.dinner;
}

MealType mealTypeForReview({
  required DateTime localTime,
  MealType? foodSuggestedType,
}) {
  if (foodSuggestedType == MealType.snack) return MealType.snack;
  return mealTypeForLocalTime(localTime);
}
