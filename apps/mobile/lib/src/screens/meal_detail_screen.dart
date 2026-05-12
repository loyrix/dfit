import 'package:flutter/material.dart';

import '../models/meal.dart';
import '../theme/dfit_theme.dart';
import '../widgets/macro_profile_card.dart';
import '../widgets/primitive_icons.dart';

class MealDetailScreen extends StatelessWidget {
  const MealDetailScreen({super.key, required this.meal});

  final MealLog meal;

  @override
  Widget build(BuildContext context) {
    final totals = meal.totals;
    final colors = context.dfit;

    return Scaffold(
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
          children: [
            Align(
              alignment: Alignment.centerLeft,
              child: IconButton(
                onPressed: () => Navigator.of(context).pop(),
                icon: const BackMark(),
              ),
            ),
            const SizedBox(height: 18),
            Text(
              meal.type.label,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                color: colors.textSecondary,
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
              'kcal - ${meal.items.length} items',
              textAlign: TextAlign.center,
              style: Theme.of(
                context,
              ).textTheme.bodySmall?.copyWith(color: colors.textSecondary),
            ),
            const SizedBox(height: 22),
            MacroProfileCard(meal: meal),
            const SizedBox(height: 22),
            Text('ITEMS', style: Theme.of(context).textTheme.labelSmall),
            const SizedBox(height: 10),
            for (final item in meal.items)
              Container(
                padding: const EdgeInsets.symmetric(vertical: 12),
                decoration: BoxDecoration(
                  border: Border(
                    bottom: BorderSide(color: colors.border, width: 0.5),
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
                                ?.copyWith(color: colors.textSecondary),
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
