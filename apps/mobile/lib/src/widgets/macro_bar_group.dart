import 'package:flutter/material.dart';

import '../models/meal.dart';
import '../theme/dfit_colors.dart';
import '../theme/dfit_theme.dart';

class MacroBarGroup extends StatelessWidget {
  const MacroBarGroup({super.key, required this.totals, required this.target});

  final MacroTotals totals;
  final MacroTotals target;

  @override
  Widget build(BuildContext context) {
    final colors = context.dfit;

    return Container(
      padding: const EdgeInsets.fromLTRB(12, 14, 12, 12),
      decoration: BoxDecoration(
        color: colors.surfaceCard,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: colors.border, width: 0.5),
      ),
      child: Row(
        children: [
          _MacroMetric(
            label: 'protein',
            value: totals.proteinG,
            target: target.proteinG,
          ),
          _MacroMetric(
            label: 'carbs',
            value: totals.carbsG,
            target: target.carbsG,
          ),
          _MacroMetric(label: 'fat', value: totals.fatG, target: target.fatG),
        ],
      ),
    );
  }
}

class _MacroMetric extends StatelessWidget {
  const _MacroMetric({
    required this.label,
    required this.value,
    required this.target,
  });

  final String label;
  final double value;
  final double target;

  @override
  Widget build(BuildContext context) {
    final colors = context.dfit;
    final pct = target == 0 ? 0.0 : (value / target).clamp(0.0, 1.0);
    final text = value.round().toString();

    return Expanded(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 5),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              text,
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                color: colors.textPrimary,
                fontFeatures: const [FontFeature.tabularFigures()],
              ),
            ),
            const SizedBox(height: 8),
            ClipRRect(
              borderRadius: BorderRadius.circular(99),
              child: LinearProgressIndicator(
                value: pct,
                minHeight: 6,
                color: DFitColors.accent,
                backgroundColor: colors.mutedFill,
              ),
            ),
            const SizedBox(height: 9),
            Text(
              label,
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                color: colors.textPrimary,
                letterSpacing: 0,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              '${(pct * 100).round()}%',
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                color: colors.textSecondary,
                letterSpacing: 0,
                fontFeatures: const [FontFeature.tabularFigures()],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
