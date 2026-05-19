import 'package:flutter/material.dart';

import '../models/meal.dart';
import '../theme/logmyplate_colors.dart';
import '../theme/logmyplate_theme.dart';
import 'meal_delete_controls.dart';

class MealCard extends StatelessWidget {
  const MealCard({
    super.key,
    required this.meal,
    required this.onTap,
    this.onDelete,
  });

  final MealLog meal;
  final VoidCallback onTap;
  final Future<bool> Function()? onDelete;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;
    final totals = meal.totals;
    final names = meal.items.map((item) => item.name).join(', ');

    final card = Material(
      color: colors.surfaceCard,
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: colors.border, width: 0.5),
          ),
          child: Row(
            children: [
              _MealTimeDisk(type: meal.type),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      meal.type.label,
                      style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        color: colors.textSecondary,
                        letterSpacing: 1.4,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            names,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: Theme.of(context).textTheme.titleMedium,
                          ),
                        ),
                        if (meal.syncState == MealSyncState.pending) ...[
                          const SizedBox(width: 6),
                          Container(
                            width: 7,
                            height: 7,
                            decoration: const BoxDecoration(
                              color: LogMyPlateColors.accentLow,
                              shape: BoxShape.circle,
                            ),
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Protein ${totals.proteinG.round()}g  Carbs ${totals.carbsG.round()}g  Fat ${totals.fatG.round()}g',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        color: colors.textSecondary,
                        letterSpacing: 0,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              Text(
                '${totals.calories} kCal',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontFeatures: const [FontFeature.tabularFigures()],
                ),
              ),
            ],
          ),
        ),
      ),
    );

    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: onDelete == null
          ? card
          : MealDeleteDismissible(
              dismissKey: ValueKey('meal-card-${meal.id}'),
              borderRadius: 14,
              onDelete: onDelete!,
              child: card,
            ),
    );
  }
}

class _MealTimeDisk extends StatelessWidget {
  const _MealTimeDisk({required this.type});

  final MealType type;

  @override
  Widget build(BuildContext context) {
    final colors = switch (type) {
      MealType.breakfast => (
        LogMyPlateColors.mealBreakfastBg,
        LogMyPlateColors.mealBreakfastFg,
      ),
      MealType.lunch => (
        LogMyPlateColors.mealLunchBg,
        LogMyPlateColors.mealLunchFg,
      ),
      MealType.snack => (
        LogMyPlateColors.mealSnackBg,
        LogMyPlateColors.mealSnackFg,
      ),
      MealType.dinner => (
        LogMyPlateColors.mealDinnerBg,
        LogMyPlateColors.mealDinnerFg,
      ),
    };

    return Container(
      width: 36,
      height: 36,
      decoration: BoxDecoration(color: colors.$1, shape: BoxShape.circle),
      child: Center(
        child: Container(
          width: type == MealType.dinner ? 13 : 14,
          height: type == MealType.dinner ? 13 : 14,
          decoration: BoxDecoration(color: colors.$2, shape: BoxShape.circle),
        ),
      ),
    );
  }
}
