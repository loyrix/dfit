import 'package:flutter/material.dart';

import '../models/meal.dart';
import '../theme/dfit_colors.dart';
import '../widgets/macro_bar_group.dart';
import '../widgets/primitive_icons.dart';

class MealDetailScreen extends StatelessWidget {
  const MealDetailScreen({super.key, required this.meal});

  final MealLog meal;

  @override
  Widget build(BuildContext context) {
    final totals = meal.totals;

    return Scaffold(
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
          children: [
            Align(
              alignment: Alignment.centerLeft,
              child: IconButton(
                onPressed: () => Navigator.of(context).pop(),
                icon: const BackMark(color: DFitColors.textPrimaryLight),
              ),
            ),
            const SizedBox(height: 18),
            Text(
              meal.type.label,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                color: DFitColors.textSecondaryLight,
                letterSpacing: 1.6,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              '${totals.calories}',
              textAlign: TextAlign.center,
              style: Theme.of(
                context,
              ).textTheme.displayLarge?.copyWith(fontSize: 54),
            ),
            Text(
              'kcal',
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: DFitColors.textSecondaryLight,
              ),
            ),
            const SizedBox(height: 22),
            MacroBarGroup(totals: totals, target: defaultTarget),
            const SizedBox(height: 22),
            Text('ITEMS', style: Theme.of(context).textTheme.labelSmall),
            const SizedBox(height: 10),
            for (final item in meal.items)
              Container(
                padding: const EdgeInsets.symmetric(vertical: 12),
                decoration: const BoxDecoration(
                  border: Border(
                    bottom: BorderSide(
                      color: DFitColors.borderLight,
                      width: 0.5,
                    ),
                  ),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            item.name,
                            style: Theme.of(context).textTheme.titleMedium,
                          ),
                          const SizedBox(height: 4),
                          Text(
                            '${_formatQuantity(item.quantity)} ${item.unit} - ${item.grams}g',
                            style: Theme.of(context).textTheme.bodySmall
                                ?.copyWith(
                                  color: DFitColors.textSecondaryLight,
                                ),
                          ),
                        ],
                      ),
                    ),
                    Text('${item.nutrition.calories} kcal'),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }

  String _formatQuantity(double value) {
    return value % 1 == 0 ? value.toStringAsFixed(0) : value.toStringAsFixed(1);
  }
}
