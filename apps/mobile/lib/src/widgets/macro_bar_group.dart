import 'package:flutter/material.dart';

import '../models/meal.dart';
import '../theme/dfit_colors.dart';

class MacroBarGroup extends StatelessWidget {
  const MacroBarGroup({super.key, required this.totals, required this.target});

  final MacroTotals totals;
  final MacroTotals target;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(12, 12, 12, 10),
      decoration: BoxDecoration(
        color: Theme.of(context).brightness == Brightness.dark
            ? DFitColors.surfaceCardDark
            : DFitColors.surfaceCard,
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
          _MacroBar(
            label: 'protein',
            value: totals.proteinG,
            target: target.proteinG,
          ),
          _MacroBar(
            label: 'carbs',
            value: totals.carbsG,
            target: target.carbsG,
          ),
          _MacroBar(label: 'fat', value: totals.fatG, target: target.fatG),
        ],
      ),
    );
  }
}

class _MacroBar extends StatelessWidget {
  const _MacroBar({
    required this.label,
    required this.value,
    required this.target,
  });

  final String label;
  final double value;
  final double target;

  @override
  Widget build(BuildContext context) {
    final pct = target == 0 ? 0.0 : (value / target).clamp(0.0, 1.0);
    final text = value.round().toString();

    return Expanded(
      child: SizedBox(
        height: 78,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.end,
          children: [
            Expanded(
              child: Align(
                alignment: Alignment.bottomCenter,
                child: Stack(
                  clipBehavior: Clip.none,
                  alignment: Alignment.bottomCenter,
                  children: [
                    Container(
                      width: 16,
                      height: 48 * pct + 6,
                      decoration: const BoxDecoration(
                        color: DFitColors.textPrimaryLight,
                        borderRadius: BorderRadius.vertical(
                          top: Radius.circular(3),
                        ),
                      ),
                    ),
                    Positioned(
                      top: -18,
                      child: Text(
                        text,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          fontWeight: FontWeight.w500,
                          fontFeatures: const [FontFeature.tabularFigures()],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 6),
            Text(label, style: Theme.of(context).textTheme.labelSmall),
            Text(
              '${(pct * 100).round()}%',
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                color: DFitColors.textSecondaryLight,
                fontFeatures: const [FontFeature.tabularFigures()],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
