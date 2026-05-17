import 'package:flutter/material.dart';

import '../models/meal.dart';
import '../theme/dfit_theme.dart';

class MacroBarGroup extends StatelessWidget {
  const MacroBarGroup({super.key, required this.totals});

  final MacroTotals totals;

  @override
  Widget build(BuildContext context) {
    final colors = context.dfit;

    return Container(
      padding: const EdgeInsets.fromLTRB(12, 14, 12, 14),
      decoration: BoxDecoration(
        color: colors.surfaceCard,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: colors.border, width: 0.5),
      ),
      child: Row(
        children: [
          _MacroMetric(label: 'Protein', value: totals.proteinG),
          _MacroMetric(label: 'Carbs', value: totals.carbsG),
          _MacroMetric(label: 'Fat', value: totals.fatG),
        ],
      ),
    );
  }
}

class _MacroMetric extends StatelessWidget {
  const _MacroMetric({required this.label, required this.value});

  final String label;
  final double value;

  @override
  Widget build(BuildContext context) {
    final colors = context.dfit;

    return Expanded(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 5),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              '${value.round()}g',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                color: colors.textPrimary,
                fontFeatures: const [FontFeature.tabularFigures()],
              ),
            ),
            const SizedBox(height: 5),
            Text(
              label,
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                color: colors.textSecondary,
                letterSpacing: 0,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
