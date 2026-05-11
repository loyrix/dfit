import 'package:flutter/material.dart';

import '../models/meal.dart';
import '../theme/dfit_colors.dart';

class MealCard extends StatelessWidget {
  const MealCard({super.key, required this.meal, required this.onTap});

  final MealLog meal;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final totals = meal.totals;
    final names = meal.items.map((item) => item.name).join(', ');

    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Material(
        color: Theme.of(context).brightness == Brightness.dark
            ? DFitColors.surfaceCardDark
            : DFitColors.surfaceCard,
        borderRadius: BorderRadius.circular(14),
        child: InkWell(
          borderRadius: BorderRadius.circular(14),
          onTap: onTap,
          child: Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: Theme.of(context).brightness == Brightness.dark
                    ? Colors.white.withValues(alpha: 0.08)
                    : DFitColors.borderLight,
                width: 0.5,
              ),
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
                          color: DFitColors.textSecondaryLight,
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
                                color: DFitColors.accentLow,
                                shape: BoxShape.circle,
                              ),
                            ),
                          ],
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'protein ${totals.proteinG.round()}g  carbs ${totals.carbsG.round()}g  fat ${totals.fatG.round()}g',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: Theme.of(context).textTheme.labelSmall?.copyWith(
                          color: DFitColors.textSecondaryLight,
                          letterSpacing: 0,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                Text(
                  '${totals.calories}',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontFeatures: const [FontFeature.tabularFigures()],
                  ),
                ),
              ],
            ),
          ),
        ),
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
        DFitColors.mealBreakfastBg,
        DFitColors.mealBreakfastFg,
      ),
      MealType.lunch => (DFitColors.mealLunchBg, DFitColors.mealLunchFg),
      MealType.snack => (DFitColors.mealSnackBg, DFitColors.mealSnackFg),
      MealType.dinner => (DFitColors.mealDinnerBg, DFitColors.mealDinnerFg),
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
