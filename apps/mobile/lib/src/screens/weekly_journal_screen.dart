import 'package:flutter/material.dart';

import '../models/meal.dart';
import '../navigation/dfit_page_route.dart';
import '../theme/dfit_colors.dart';
import '../theme/dfit_theme.dart';
import '../widgets/energy_hero_card.dart';
import '../widgets/macro_bar_group.dart';
import '../widgets/primitive_icons.dart';

class WeeklyJournalScreen extends StatelessWidget {
  const WeeklyJournalScreen({
    super.key,
    required this.range,
    required this.target,
    required this.onOpenMeal,
    this.isSyncing = false,
    this.syncMessage,
    this.onRefresh,
  });

  final JournalRangeData range;
  final MacroTotals target;
  final ValueChanged<MealLog> onOpenMeal;
  final bool isSyncing;
  final String? syncMessage;
  final Future<void> Function()? onRefresh;

  @override
  Widget build(BuildContext context) {
    final days = range.days.reversed.toList();

    return Scaffold(
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 28),
          children: [
            _JournalHeader(
              label: '7 DAY JOURNAL',
              title: '7 day summary',
              subtitle: _rangeLabel(range),
            ),
            if (isSyncing || syncMessage != null) ...[
              const SizedBox(height: 12),
              _JournalSyncStrip(
                isSyncing: isSyncing,
                message: syncMessage,
                onRefresh: onRefresh,
              ),
            ],
            const SizedBox(height: 16),
            _WeeklyJournalHero(range: range),
            const SizedBox(height: 12),
            _LabeledPanel(
              label: 'DAILY AVERAGE',
              child: MacroBarGroup(
                totals: range.summary.dailyAverage,
                target: target,
              ),
            ),
            const SizedBox(height: 22),
            _SectionLabel('DAY WISE'),
            const SizedBox(height: 10),
            if (days.isEmpty)
              const _EmptyWeekCard()
            else
              for (final day in days)
                _JournalDayRow(day: day, onTap: () => _openDay(context, day)),
          ],
        ),
      ),
    );
  }

  void _openDay(BuildContext context, JournalDayData day) {
    Navigator.of(context).push<void>(
      dfitPageRoute<void>(
        builder: (_) => DayJournalDetailScreen(
          day: day,
          target: target,
          onOpenMeal: onOpenMeal,
        ),
      ),
    );
  }
}

class DayJournalDetailScreen extends StatelessWidget {
  const DayJournalDetailScreen({
    super.key,
    required this.day,
    required this.target,
    required this.onOpenMeal,
  });

  final JournalDayData day;
  final MacroTotals target;
  final ValueChanged<MealLog> onOpenMeal;

  @override
  Widget build(BuildContext context) {
    final meals = day.meals;
    final hasMeals = meals.isNotEmpty;

    return Scaffold(
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 28),
          children: [
            _JournalHeader(
              label: 'DAY ANALYSIS',
              title: _dayTitle(day.date),
              subtitle: _mealCountLabel(day.mealCount),
            ),
            const SizedBox(height: 16),
            if (hasMeals) ...[
              EnergyHeroCard(totals: day.totals, target: target),
              const SizedBox(height: 12),
              MacroBarGroup(totals: day.totals, target: target),
              const SizedBox(height: 18),
              _DayCompositionCard(day: day),
            ] else
              _EmptyDayOverview(day: day),
            const SizedBox(height: 22),
            _SectionLabel('MEALS'),
            const SizedBox(height: 10),
            if (meals.isEmpty)
              const _EmptyDayCard()
            else
              for (final meal in meals)
                _DayMealRow(meal: meal, onTap: () => onOpenMeal(meal)),
          ],
        ),
      ),
    );
  }
}

class _DayMealRow extends StatelessWidget {
  const _DayMealRow({required this.meal, required this.onTap});

  final MealLog meal;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colors = context.dfit;
    final totals = meal.totals;
    final itemNames = meal.items.map((item) => item.name).join(', ');

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Material(
        color: colors.surfaceCard,
        borderRadius: BorderRadius.circular(16),
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: onTap,
          child: Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: colors.border, width: 0.5),
            ),
            child: Row(
              children: [
                _MealBadge(type: meal.type),
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
                      Text(
                        meal.title,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      const SizedBox(height: 5),
                      Text(
                        itemNames,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: colors.textSecondary,
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

class _MealBadge extends StatelessWidget {
  const _MealBadge({required this.type});

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
      width: 38,
      height: 38,
      decoration: BoxDecoration(color: colors.$1, shape: BoxShape.circle),
      child: Center(
        child: Container(
          width: 14,
          height: 14,
          decoration: BoxDecoration(color: colors.$2, shape: BoxShape.circle),
        ),
      ),
    );
  }
}

class _JournalHeader extends StatelessWidget {
  const _JournalHeader({
    required this.label,
    required this.title,
    required this.subtitle,
  });

  final String label;
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    final colors = context.dfit;

    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        IconButton(
          onPressed: () => Navigator.of(context).pop(),
          icon: const BackMark(),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  color: colors.textSecondary,
                  letterSpacing: 1.4,
                ),
              ),
              const SizedBox(height: 4),
              Text(title, style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 2),
              Text(
                subtitle,
                style: Theme.of(
                  context,
                ).textTheme.bodySmall?.copyWith(color: colors.textSecondary),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _JournalSyncStrip extends StatelessWidget {
  const _JournalSyncStrip({
    required this.isSyncing,
    required this.message,
    required this.onRefresh,
  });

  final bool isSyncing;
  final String? message;
  final Future<void> Function()? onRefresh;

  @override
  Widget build(BuildContext context) {
    final colors = context.dfit;
    final hasError = message != null;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: hasError
            ? DFitColors.accent.withValues(alpha: 0.12)
            : colors.mutedFill,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: hasError
              ? DFitColors.accent.withValues(alpha: 0.24)
              : colors.border,
          width: 0.5,
        ),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Container(
                width: 7,
                height: 7,
                decoration: BoxDecoration(
                  color: hasError ? colors.accentText : DFitColors.accent,
                  shape: BoxShape.circle,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  hasError ? 'Showing saved journal' : 'Syncing latest journal',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: hasError ? colors.accentText : colors.textSecondary,
                  ),
                ),
              ),
              if (hasError && onRefresh != null)
                TextButton(
                  onPressed: () {
                    onRefresh?.call();
                  },
                  style: TextButton.styleFrom(
                    foregroundColor: colors.accentText,
                    minimumSize: const Size(52, 30),
                    padding: const EdgeInsets.symmetric(horizontal: 10),
                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  ),
                  child: const Text('Retry'),
                ),
            ],
          ),
          AnimatedSwitcher(
            duration: const Duration(milliseconds: 200),
            child: isSyncing
                ? Padding(
                    key: const ValueKey('journal-sync-progress'),
                    padding: const EdgeInsets.only(top: 9),
                    child: LinearProgressIndicator(
                      minHeight: 2,
                      color: DFitColors.accent,
                      backgroundColor: colors.border,
                    ),
                  )
                : const SizedBox.shrink(key: ValueKey('journal-sync-idle')),
          ),
        ],
      ),
    );
  }
}

class _WeeklyJournalHero extends StatelessWidget {
  const _WeeklyJournalHero({required this.range});

  final JournalRangeData range;

  @override
  Widget build(BuildContext context) {
    final summary = range.summary;
    final activePct = summary.windowDays == 0
        ? 0.0
        : (summary.activeDays / summary.windowDays).clamp(0.0, 1.0);

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: DFitColors.surfaceHero,
        borderRadius: BorderRadius.circular(18),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'LAST 7 DAYS',
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
              color: Colors.white.withValues(alpha: 0.52),
              letterSpacing: 1.8,
            ),
          ),
          const SizedBox(height: 12),
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '${summary.activeDays}/${summary.windowDays}',
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                  color: Colors.white,
                  fontSize: 40,
                  fontFeatures: const [FontFeature.tabularFigures()],
                ),
              ),
              const SizedBox(width: 8),
              Padding(
                padding: const EdgeInsets.only(bottom: 6),
                child: Text(
                  'days tracked',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Colors.white.withValues(alpha: 0.55),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),
          _SegmentedProgress(value: activePct),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: _HeroStat(label: 'meals', value: '${summary.mealCount}'),
              ),
              Expanded(
                child: _HeroStat(
                  label: 'avg kcal',
                  value: '${summary.dailyAverage.calories}',
                ),
              ),
              Expanded(
                child: _HeroStat(
                  label: 'protein',
                  value: '${summary.dailyAverage.proteinG.round()}g',
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _SegmentedProgress extends StatelessWidget {
  const _SegmentedProgress({required this.value});

  final double value;

  @override
  Widget build(BuildContext context) {
    final filledSegments = (value * 7).round();

    return Row(
      children: List.generate(7, (index) {
        final active = index < filledSegments;
        return Expanded(
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 250),
            height: 5,
            margin: EdgeInsets.only(right: index == 6 ? 0 : 5),
            decoration: BoxDecoration(
              color: active
                  ? DFitColors.accent
                  : Colors.white.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(99),
            ),
          ),
        );
      }),
    );
  }
}

class _HeroStat extends StatelessWidget {
  const _HeroStat({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          value,
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
            color: Colors.white,
            fontFeatures: const [FontFeature.tabularFigures()],
          ),
        ),
        const SizedBox(height: 3),
        Text(
          label,
          style: Theme.of(context).textTheme.labelSmall?.copyWith(
            color: Colors.white.withValues(alpha: 0.45),
            letterSpacing: 0,
          ),
        ),
      ],
    );
  }
}

class _LabeledPanel extends StatelessWidget {
  const _LabeledPanel({required this.label, required this.child});

  final String label;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [_SectionLabel(label), const SizedBox(height: 10), child],
    );
  }
}

class _EmptyWeekCard extends StatelessWidget {
  const _EmptyWeekCard();

  @override
  Widget build(BuildContext context) {
    final colors = context.dfit;

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: colors.surfaceCard,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: colors.border, width: 0.5),
      ),
      child: Row(
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: colors.mutedFill,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Center(
              child: Container(
                width: 12,
                height: 12,
                decoration: BoxDecoration(
                  color: colors.textTertiary,
                  shape: BoxShape.circle,
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'No journal days yet',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 4),
                Text(
                  'Logged days will appear here after the first sync.',
                  style: Theme.of(
                    context,
                  ).textTheme.bodySmall?.copyWith(color: colors.textSecondary),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _JournalDayRow extends StatelessWidget {
  const _JournalDayRow({required this.day, required this.onTap});

  final JournalDayData day;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colors = context.dfit;
    final hasMeals = day.mealCount > 0;
    final date = _parseDate(day.date);

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Material(
        color: colors.surfaceCard,
        borderRadius: BorderRadius.circular(16),
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: onTap,
          child: Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: colors.border, width: 0.5),
            ),
            child: Row(
              children: [
                _DateBadge(date: date, active: hasMeals),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              _dayTitle(day.date),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: Theme.of(context).textTheme.titleMedium,
                            ),
                          ),
                          Text(
                            '${day.totals.calories}',
                            style: Theme.of(context).textTheme.titleMedium
                                ?.copyWith(
                                  fontFeatures: const [
                                    FontFeature.tabularFigures(),
                                  ],
                                ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(
                        _mealCountLabel(day.mealCount),
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: colors.textSecondary,
                        ),
                      ),
                      const SizedBox(height: 11),
                      _MacroTriplet(totals: day.totals, muted: !hasMeals),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                Icon(
                  Icons.chevron_right_rounded,
                  color: colors.textTertiary,
                  size: 22,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _DateBadge extends StatelessWidget {
  const _DateBadge({required this.date, required this.active});

  final DateTime? date;
  final bool active;

  @override
  Widget build(BuildContext context) {
    final colors = context.dfit;
    final value = date;
    final badgeColor = active
        ? DFitColors.accent.withValues(alpha: 0.16)
        : colors.mutedFill;
    final borderColor = active
        ? DFitColors.accent.withValues(alpha: 0.55)
        : colors.border;

    return Container(
      width: 52,
      height: 58,
      decoration: BoxDecoration(
        color: badgeColor,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: borderColor, width: 0.8),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            value == null ? '--' : _weekDay(value).substring(0, 3),
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
              color: active ? colors.accentText : colors.textSecondary,
              letterSpacing: 0.7,
            ),
          ),
          const SizedBox(height: 5),
          Text(
            value == null ? '--' : value.day.toString().padLeft(2, '0'),
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              color: active ? colors.textPrimary : colors.textSecondary,
              fontFeatures: const [FontFeature.tabularFigures()],
            ),
          ),
        ],
      ),
    );
  }
}

class _MacroTriplet extends StatelessWidget {
  const _MacroTriplet({required this.totals, this.muted = false});

  final MacroTotals totals;
  final bool muted;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        _MacroPill(
          label: 'P',
          value: '${totals.proteinG.round()}g',
          muted: muted,
        ),
        const SizedBox(width: 6),
        _MacroPill(
          label: 'C',
          value: '${totals.carbsG.round()}g',
          muted: muted,
        ),
        const SizedBox(width: 6),
        _MacroPill(label: 'F', value: '${totals.fatG.round()}g', muted: muted),
      ],
    );
  }
}

class _MacroPill extends StatelessWidget {
  const _MacroPill({
    required this.label,
    required this.value,
    required this.muted,
  });

  final String label;
  final String value;
  final bool muted;

  @override
  Widget build(BuildContext context) {
    final colors = context.dfit;

    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 7),
        decoration: BoxDecoration(
          color: muted
              ? colors.mutedFill.withValues(alpha: 0.45)
              : colors.mutedFill,
          borderRadius: BorderRadius.circular(10),
        ),
        child: Text(
          '$label $value',
          textAlign: TextAlign.center,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: Theme.of(context).textTheme.labelSmall?.copyWith(
            color: muted ? colors.textTertiary : colors.textSecondary,
            letterSpacing: 0,
            fontFeatures: const [FontFeature.tabularFigures()],
          ),
        ),
      ),
    );
  }
}

class _DayCompositionCard extends StatelessWidget {
  const _DayCompositionCard({required this.day});

  final JournalDayData day;

  @override
  Widget build(BuildContext context) {
    final colors = context.dfit;
    final itemCount = day.meals.fold<int>(
      0,
      (count, meal) => count + meal.items.length,
    );

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: colors.surfaceCard,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: colors.border, width: 0.5),
      ),
      child: Row(
        children: [
          Expanded(
            child: _CompositionMetric(label: 'items', value: '$itemCount'),
          ),
          Container(width: 1, height: 38, color: colors.border),
          Expanded(
            child: _CompositionMetric(
              label: 'protein',
              value: '${day.totals.proteinG.round()}g',
            ),
          ),
          Container(width: 1, height: 38, color: colors.border),
          Expanded(
            child: _CompositionMetric(
              label: 'cal / meal',
              value: day.mealCount == 0
                  ? '0'
                  : '${(day.totals.calories / day.mealCount).round()}',
            ),
          ),
        ],
      ),
    );
  }
}

class _EmptyDayOverview extends StatelessWidget {
  const _EmptyDayOverview({required this.day});

  final JournalDayData day;

  @override
  Widget build(BuildContext context) {
    final colors = context.dfit;

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: colors.surfaceCard,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: colors.border, width: 0.5),
      ),
      child: Row(
        children: [
          _DateBadge(date: _parseDate(day.date), active: false),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'No meals logged',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 5),
                Text(
                  'This day stays empty until a meal is added.',
                  style: Theme.of(
                    context,
                  ).textTheme.bodySmall?.copyWith(color: colors.textSecondary),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _CompositionMetric extends StatelessWidget {
  const _CompositionMetric({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final colors = context.dfit;

    return Column(
      children: [
        Text(
          value,
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
            fontFeatures: const [FontFeature.tabularFigures()],
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: Theme.of(context).textTheme.labelSmall?.copyWith(
            color: colors.textSecondary,
            letterSpacing: 0,
          ),
        ),
      ],
    );
  }
}

class _EmptyDayCard extends StatelessWidget {
  const _EmptyDayCard();

  @override
  Widget build(BuildContext context) {
    final colors = context.dfit;

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: colors.surfaceCard,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: colors.border, width: 0.5),
      ),
      child: Text(
        'No meals logged for this day.',
        style: Theme.of(
          context,
        ).textTheme.bodySmall?.copyWith(color: colors.textSecondary),
      ),
    );
  }
}

class _SectionLabel extends StatelessWidget {
  const _SectionLabel(this.text);

  final String text;

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: Theme.of(context).textTheme.labelSmall?.copyWith(
        color: context.dfit.textSecondary,
        letterSpacing: 1.4,
      ),
    );
  }
}

String _rangeLabel(JournalRangeData range) {
  return '${_compactDate(range.startDate)} - ${_compactDate(range.endDate)}';
}

String _compactDate(String value) {
  final date = _parseDate(value);
  if (date == null) return value;
  return '${date.day.toString().padLeft(2, '0')} ${_month(date)}';
}

String _dayTitle(String value) {
  final date = _parseDate(value);
  if (date == null) return value;
  final relative = _relativeDateLabel(date);
  if (relative != null) return relative;
  return '${_weekDay(date)} ${date.day.toString().padLeft(2, '0')} ${_month(date)}';
}

String _mealCountLabel(int count) {
  if (count == 0) return 'No meals logged';
  if (count == 1) return '1 meal logged';
  return '$count meals logged';
}

String? _relativeDateLabel(DateTime date) {
  final now = DateTime.now();
  final today = DateTime(now.year, now.month, now.day);
  final value = DateTime(date.year, date.month, date.day);
  final diff = today.difference(value).inDays;
  if (diff == 0) return 'Today';
  if (diff == 1) return 'Yesterday';
  return null;
}

DateTime? _parseDate(String value) {
  final parsed = DateTime.tryParse(value);
  if (parsed == null) return null;
  return DateTime(parsed.year, parsed.month, parsed.day);
}

String _weekDay(DateTime date) {
  const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  return days[date.weekday - 1];
}

String _month(DateTime date) {
  const months = [
    'JAN',
    'FEB',
    'MAR',
    'APR',
    'MAY',
    'JUN',
    'JUL',
    'AUG',
    'SEP',
    'OCT',
    'NOV',
    'DEC',
  ];
  return months[date.month - 1];
}
