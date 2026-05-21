import 'package:flutter/material.dart';

import '../models/meal.dart';
import '../theme/logmyplate_colors.dart';
import '../theme/logmyplate_theme.dart';

class MacroBarGroup extends StatelessWidget {
  const MacroBarGroup({super.key, required this.totals});

  final MacroTotals totals;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;
    final proteinCalories = totals.proteinG * 4;
    final carbsCalories = totals.carbsG * 4;
    final fatCalories = totals.fatG * 9;
    final macroCalories = proteinCalories + carbsCalories + fatCalories;
    final hasMacros = macroCalories > 0;

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: colors.surfaceCard,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: colors.border, width: 0.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(
                'Macro mix',
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  color: colors.textSecondary,
                  letterSpacing: 1.3,
                ),
              ),
              const Spacer(),
              Text(
                hasMacros ? '${totals.calories} kCal total' : 'No macros yet',
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  color: colors.textTertiary,
                  letterSpacing: 0,
                  fontFeatures: const [FontFeature.tabularFigures()],
                ),
              ),
            ],
          ),
          const SizedBox(height: 13),
          _MacroStackedBar(
            proteinShare: hasMacros ? proteinCalories / macroCalories : 0,
            carbsShare: hasMacros ? carbsCalories / macroCalories : 0,
            fatShare: hasMacros ? fatCalories / macroCalories : 0,
          ),
          const SizedBox(height: 13),
          Row(
            children: [
              _MacroMetric(
                label: 'Protein',
                value: totals.proteinG,
                share: hasMacros ? proteinCalories / macroCalories : 0,
                color: _MacroColors.protein,
              ),
              const SizedBox(width: 8),
              _MacroMetric(
                label: 'Carbs',
                value: totals.carbsG,
                share: hasMacros ? carbsCalories / macroCalories : 0,
                color: _MacroColors.carbs,
              ),
              const SizedBox(width: 8),
              _MacroMetric(
                label: 'Fat',
                value: totals.fatG,
                share: hasMacros ? fatCalories / macroCalories : 0,
                color: _MacroColors.fat,
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _MacroColors {
  const _MacroColors._();

  static const protein = LogMyPlateColors.macroProtein;
  static const carbs = LogMyPlateColors.macroCarbs;
  static const fat = LogMyPlateColors.macroFat;
}

class _MacroStackedBar extends StatelessWidget {
  const _MacroStackedBar({
    required this.proteinShare,
    required this.carbsShare,
    required this.fatShare,
  });

  final double proteinShare;
  final double carbsShare;
  final double fatShare;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;
    final shares = [
      (proteinShare, _MacroColors.protein),
      (carbsShare, _MacroColors.carbs),
      (fatShare, _MacroColors.fat),
    ].where((entry) => entry.$1 > 0).toList(growable: false);

    return ClipRRect(
      borderRadius: BorderRadius.circular(99),
      child: Container(
        height: 12,
        color: colors.mutedFill,
        child: shares.isEmpty
            ? const SizedBox.expand()
            : Row(
                children: [
                  for (var index = 0; index < shares.length; index++)
                    Expanded(
                      flex: (shares[index].$1 * 1000).round().clamp(1, 1000),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 240),
                        margin: EdgeInsets.only(
                          right: index == shares.length - 1 ? 0 : 2,
                        ),
                        decoration: BoxDecoration(
                          color: shares[index].$2,
                          borderRadius: BorderRadius.horizontal(
                            left: Radius.circular(index == 0 ? 99 : 3),
                            right: Radius.circular(
                              index == shares.length - 1 ? 99 : 3,
                            ),
                          ),
                        ),
                      ),
                    ),
                ],
              ),
      ),
    );
  }
}

class _MacroMetric extends StatelessWidget {
  const _MacroMetric({
    required this.label,
    required this.value,
    required this.share,
    required this.color,
  });

  final String label;
  final double value;
  final double share;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;

    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.10),
          borderRadius: BorderRadius.circular(13),
          border: Border.all(color: color.withValues(alpha: 0.18), width: 0.5),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              children: [
                Container(
                  width: 7,
                  height: 7,
                  decoration: BoxDecoration(
                    color: color,
                    shape: BoxShape.circle,
                  ),
                ),
                const Spacer(),
                Text(
                  '${(share * 100).round()}%',
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    color: colors.textTertiary,
                    letterSpacing: 0,
                    fontFeatures: const [FontFeature.tabularFigures()],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 9),
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
