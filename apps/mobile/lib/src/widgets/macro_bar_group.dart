import 'package:flutter/material.dart';

import '../models/meal.dart';
import '../theme/logmyplate_colors.dart';
import '../theme/logmyplate_theme.dart';
import '../widgets/glass/glass_section_card.dart';
import '../widgets/macro_chips.dart';

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

    return GlassSectionCard(
      title: 'Macro mix',
      trailing: Text(
        hasMacros ? '${totals.calories} kCal total' : 'No macros yet',
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
          color: colors.textTertiary,
          letterSpacing: 0,
          fontFeatures: const [FontFeature.tabularFigures()],
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _MacroStackedBar(
            proteinShare: hasMacros ? proteinCalories / macroCalories : 0,
            carbsShare: hasMacros ? carbsCalories / macroCalories : 0,
            fatShare: hasMacros ? fatCalories / macroCalories : 0,
          ),
          const SizedBox(height: 13),
          Row(
            children: [
              MacroDetailChip(
                label: 'Protein',
                value: totals.proteinG,
                share: hasMacros ? proteinCalories / macroCalories : 0,
                color: _MacroColors.protein,
              ),
              const SizedBox(width: 8),
              MacroDetailChip(
                label: 'Carbs',
                value: totals.carbsG,
                share: hasMacros ? carbsCalories / macroCalories : 0,
                color: _MacroColors.carbs,
              ),
              const SizedBox(width: 8),
              MacroDetailChip(
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
