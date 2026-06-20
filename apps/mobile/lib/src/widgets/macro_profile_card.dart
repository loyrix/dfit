import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../models/meal.dart';
import '../theme/logmyplate_colors.dart';
import '../theme/logmyplate_theme.dart';
import 'glass/glass_cards.dart';

class MacroProfileCard extends StatelessWidget {
  const MacroProfileCard({super.key, required this.meal});

  final MealLog meal;

  static const _proteinColor = LogMyPlateColors.macroProtein;
  static const _carbsColor = LogMyPlateColors.macroCarbs;
  static const _fatColor = LogMyPlateColors.macroFat;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;
    final profile = _MealMacroProfile.fromMeal(meal);

    return LiteGlassCard(
      padding: const EdgeInsets.all(14),
      borderRadius: BorderRadius.circular(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  'Macro profile',
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    color: colors.textSecondary,
                    letterSpacing: 1.4,
                  ),
                ),
              ),
              _ProfileBadge(label: profile.profileLabel),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              _MacroGauge(profile: profile),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  children: [
                    _ProfileMetric(
                      label: 'Protein',
                      value:
                          '${_formatGrams(profile.totals.proteinG)}g · ${profile.proteinPercent}%',
                      color: _proteinColor,
                    ),
                    const SizedBox(height: 10),
                    _ProfileMetric(
                      label: 'Carbs',
                      value:
                          '${_formatGrams(profile.totals.carbsG)}g · ${profile.carbsPercent}%',
                      color: _carbsColor,
                    ),
                    const SizedBox(height: 10),
                    _ProfileMetric(
                      label: 'Fat',
                      value:
                          '${_formatGrams(profile.totals.fatG)}g · ${profile.fatPercent}%',
                      color: _fatColor,
                    ),
                    const SizedBox(height: 10),
                    _ProfileMetric(
                      label: 'Protein density',
                      value: '${profile.proteinDensity}g / 100 kCal',
                      color: colors.textSecondary,
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          _MacroSplitBar(profile: profile),
          const SizedBox(height: 12),
          Text(
            profile.focusMessage,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: colors.textSecondary,
              height: 1.25,
            ),
          ),
          if (meal.items.isNotEmpty) ...[
            const SizedBox(height: 16),
            _ItemContributionList(meal: meal),
          ],
        ],
      ),
    );
  }

  static String _formatGrams(double grams) {
    return grams % 1 == 0 ? grams.toStringAsFixed(0) : grams.toStringAsFixed(1);
  }
}

class _MealMacroProfile {
  const _MealMacroProfile({
    required this.totals,
    required this.proteinShare,
    required this.carbsShare,
    required this.fatShare,
    required this.profileLabel,
    required this.focusMessage,
  });

  final MacroTotals totals;
  final double proteinShare;
  final double carbsShare;
  final double fatShare;
  final String profileLabel;
  final String focusMessage;

  int get proteinPercent => (proteinShare * 100).round();
  int get carbsPercent => (carbsShare * 100).round();
  int get fatPercent => (fatShare * 100).round();
  int get proteinDensity => totals.calories <= 0
      ? 0
      : (totals.proteinG / totals.calories * 100).round();

  factory _MealMacroProfile.fromMeal(MealLog meal) {
    final totals = meal.totals;
    final proteinKcal = totals.proteinG * 4;
    final carbsKcal = totals.carbsG * 4;
    final fatKcal = totals.fatG * 9;
    final macroKcal = proteinKcal + carbsKcal + fatKcal;
    final itemNames = meal.items
        .map((item) => item.name.toLowerCase())
        .toList();
    final isSnack = meal.type == MealType.snack;
    final isSingleItem = meal.items.length <= 1;
    final packagedSnack = isSnack && itemNames.any(_looksLikePackagedSnack);
    final drinkOnly = isSingleItem && itemNames.any(_looksLikeDrink);
    final primaryItem = meal.items.isEmpty
        ? 'This food'
        : meal.items.first.name;

    final proteinShare = macroKcal <= 0 ? 0.0 : proteinKcal / macroKcal;
    final carbsShare = macroKcal <= 0 ? 0.0 : carbsKcal / macroKcal;
    final fatShare = macroKcal <= 0 ? 0.0 : fatKcal / macroKcal;

    final label = macroKcal <= 0
        ? 'ready'
        : proteinShare >= 0.3
        ? 'protein led'
        : carbsShare >= 0.55
        ? 'carb led'
        : fatShare >= 0.45
        ? 'fat led'
        : 'balanced';

    final focus = macroKcal <= 0
        ? 'Add items to build this meal profile.'
        : packagedSnack
        ? 'This snack is carb-led and low in protein. That is normal for packaged snacks; balance the next meal with a stronger protein source.'
        : drinkOnly
        ? 'This drink adds energy quickly. If it was sweetened, keep the next snack lighter or pair it with protein.'
        : proteinShare < 0.15
        ? isSnack
              ? 'This snack is protein light. Pair your next snack with a protein-rich option when it fits.'
              : isSingleItem
              ? '$primaryItem is protein light. Balance the day with a stronger protein source.'
              : 'This meal is protein light. Add a protein-rich side or portion when it fits.'
        : carbsShare > 0.6
        ? isSnack
              ? 'Carbs are leading this snack. Keep the next meal steadier with protein and vegetables.'
              : 'Carbs are leading this meal. Pair the next plate with more protein and vegetables.'
        : fatShare > 0.48
        ? isSnack
              ? 'Fat is high for this snack. Keep the next meal lighter on fried sides, oil, and creamy sauces.'
              : 'Fat is high for this meal. Keep the next plate lighter on oil, fried sides, and creamy sauces.'
        : 'Balanced enough for a meal. Keep portions honest and repeat the pattern.';

    return _MealMacroProfile(
      totals: totals,
      proteinShare: proteinShare,
      carbsShare: carbsShare,
      fatShare: fatShare,
      profileLabel: label,
      focusMessage: focus,
    );
  }

  static bool _looksLikePackagedSnack(String name) {
    return name.contains('biscuit') ||
        name.contains('cracker') ||
        name.contains('chips') ||
        name.contains('namkeen') ||
        name.contains('cookie') ||
        name.contains('chocolate') ||
        name.contains('wafer') ||
        name.contains('bar') ||
        name.contains('kurkure') ||
        name.contains('bhujia');
  }

  static bool _looksLikeDrink(String name) {
    return name.contains('tea') ||
        name.contains('coffee') ||
        name.contains('juice') ||
        name.contains('shake') ||
        name.contains('lassi') ||
        name.contains('chaas') ||
        name.contains('soda') ||
        name.contains('drink');
  }
}

class _MacroGauge extends StatelessWidget {
  const _MacroGauge({required this.profile});

  final _MealMacroProfile profile;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;

    return SizedBox(
      width: 104,
      height: 104,
      child: Stack(
        alignment: Alignment.center,
        children: [
          CustomPaint(
            size: const Size.square(104),
            painter: _MacroRingPainter(profile: profile, colors: colors),
          ),
          Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                '${profile.totals.calories}',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  color: colors.textPrimary,
                  fontFeatures: const [FontFeature.tabularFigures()],
                ),
              ),
              Text(
                'kCal',
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  color: colors.textSecondary,
                  letterSpacing: 0,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _MacroRingPainter extends CustomPainter {
  const _MacroRingPainter({required this.profile, required this.colors});

  final _MealMacroProfile profile;
  final LogMyPlateThemeColors colors;

  @override
  void paint(Canvas canvas, Size size) {
    final center = size.center(Offset.zero);
    final radius = size.width / 2 - 8;
    final rect = Rect.fromCircle(center: center, radius: radius);
    final base = Paint()
      ..color = colors.mutedFill
      ..style = PaintingStyle.stroke
      ..strokeWidth = 9
      ..strokeCap = StrokeCap.round;

    canvas.drawCircle(center, radius, base);

    final shares = [
      (profile.proteinShare, MacroProfileCard._proteinColor),
      (profile.carbsShare, MacroProfileCard._carbsColor),
      (profile.fatShare, MacroProfileCard._fatColor),
    ];
    var start = -math.pi / 2;
    for (final entry in shares) {
      final share = entry.$1;
      if (share <= 0) continue;
      final sweep = share * math.pi * 2;
      final paint = Paint()
        ..color = entry.$2
        ..style = PaintingStyle.stroke
        ..strokeWidth = 9
        ..strokeCap = StrokeCap.round;
      canvas.drawArc(rect, start, math.max(0.04, sweep - 0.035), false, paint);
      start += sweep;
    }
  }

  @override
  bool shouldRepaint(covariant _MacroRingPainter oldDelegate) {
    return oldDelegate.profile != profile || oldDelegate.colors != colors;
  }
}

class _MacroSplitBar extends StatelessWidget {
  const _MacroSplitBar({required this.profile});

  final _MealMacroProfile profile;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;
    final shares = [
      (
        label: 'P',
        value: profile.proteinShare,
        color: MacroProfileCard._proteinColor,
      ),
      (
        label: 'C',
        value: profile.carbsShare,
        color: MacroProfileCard._carbsColor,
      ),
      (label: 'F', value: profile.fatShare, color: MacroProfileCard._fatColor),
    ];

    return Column(
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(99),
          child: Row(
            children: [
              for (final item in shares)
                Expanded(
                  flex: math.max(1, (item.value * 1000).round()),
                  child: Container(height: 6, color: item.color),
                ),
            ],
          ),
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            for (final item in shares)
              Expanded(
                child: Text(
                  '${item.label} ${(item.value * 100).round()}%',
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    color: colors.textSecondary,
                    letterSpacing: 0,
                    fontFeatures: const [FontFeature.tabularFigures()],
                  ),
                ),
              ),
          ],
        ),
      ],
    );
  }
}

class _ItemContributionList extends StatelessWidget {
  const _ItemContributionList({required this.meal});

  final MealLog meal;

  @override
  Widget build(BuildContext context) {
    final sortedItems = [...meal.items]
      ..sort((a, b) => b.nutrition.calories.compareTo(a.nutrition.calories));

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Item Contribution',
          style: Theme.of(context).textTheme.labelSmall?.copyWith(
            color: context.logmyplate.textSecondary,
            letterSpacing: 1.2,
          ),
        ),
        const SizedBox(height: 10),
        for (final item in sortedItems)
          _ItemContributionRow(
            item: item,
            totalCalories: math.max(1, meal.totals.calories),
          ),
      ],
    );
  }
}

class _ItemContributionRow extends StatelessWidget {
  const _ItemContributionRow({required this.item, required this.totalCalories});

  final MealItem item;
  final int totalCalories;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;
    final percent = (item.nutrition.calories / totalCalories).clamp(0.0, 1.0);

    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Column(
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  item.name,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
              ),
              const SizedBox(width: 10),
              Text(
                '${item.nutrition.calories} kCal',
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  color: colors.textSecondary,
                  letterSpacing: 0,
                  fontFeatures: const [FontFeature.tabularFigures()],
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          ClipRRect(
            borderRadius: BorderRadius.circular(99),
            child: LinearProgressIndicator(
              minHeight: 5,
              value: percent,
              color: LogMyPlateColors.accent,
              backgroundColor: colors.mutedFill,
            ),
          ),
        ],
      ),
    );
  }
}

class _ProfileMetric extends StatelessWidget {
  const _ProfileMetric({
    required this.label,
    required this.value,
    required this.color,
  });

  final String label;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;

    return Row(
      children: [
        Container(
          width: 8,
          height: 8,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            label,
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
              color: colors.textSecondary,
              letterSpacing: 0,
            ),
          ),
        ),
        Flexible(
          child: Text(
            value,
            textAlign: TextAlign.right,
            overflow: TextOverflow.ellipsis,
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
              color: colors.textPrimary,
              letterSpacing: 0,
              fontFeatures: const [FontFeature.tabularFigures()],
            ),
          ),
        ),
      ],
    );
  }
}

class _ProfileBadge extends StatelessWidget {
  const _ProfileBadge({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: LogMyPlateColors.accent.withValues(alpha: 0.16),
        borderRadius: BorderRadius.circular(99),
      ),
      child: Text(
        label,
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
          color: colors.accentText,
          letterSpacing: 0,
        ),
      ),
    );
  }
}
