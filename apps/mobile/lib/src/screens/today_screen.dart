import 'package:flutter/material.dart';

import '../models/meal.dart';
import '../theme/dfit_colors.dart';
import '../theme/dfit_theme.dart';
import '../widgets/dfit_fab.dart';
import '../widgets/energy_hero_card.dart';
import '../widgets/macro_bar_group.dart';
import '../widgets/meal_card.dart';
import '../widgets/primitive_icons.dart';

class TodayScreen extends StatelessWidget {
  const TodayScreen({
    super.key,
    required this.meals,
    required this.totals,
    required this.target,
    this.quota,
    this.weeklyRange,
    this.loading = false,
    this.syncMessage,
    required this.onRefresh,
    required this.onScan,
    required this.onAddManually,
    required this.onOpenSettings,
    required this.onOpenMeal,
  });

  final List<MealLog> meals;
  final MacroTotals totals;
  final MacroTotals target;
  final ScanQuota? quota;
  final JournalRangeData? weeklyRange;
  final bool loading;
  final String? syncMessage;
  final Future<void> Function() onRefresh;
  final VoidCallback onScan;
  final VoidCallback onAddManually;
  final VoidCallback onOpenSettings;
  final ValueChanged<MealLog> onOpenMeal;

  @override
  Widget build(BuildContext context) {
    final isEmpty = meals.isEmpty;
    final colors = context.dfit;

    return Scaffold(
      body: SafeArea(
        child: Stack(
          children: [
            RefreshIndicator(
              color: DFitColors.accent,
              onRefresh: onRefresh,
              child: ListView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: EdgeInsets.fromLTRB(16, 12, 16, isEmpty ? 120 : 28),
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          _dateLabel(DateTime.now()),
                          style: Theme.of(context).textTheme.labelSmall
                              ?.copyWith(
                                color: colors.textSecondary,
                                letterSpacing: 1.4,
                              ),
                        ),
                      ),
                      if (quota != null) ...[
                        _QuotaPill(quota: quota!),
                        const SizedBox(width: 6),
                      ],
                      if (!isEmpty)
                        IconButton(
                          tooltip: 'Scan meal',
                          onPressed: onScan,
                          icon: const PrimitiveCameraIcon(size: 22),
                        ),
                      IconButton(
                        tooltip: 'Settings',
                        onPressed: onOpenSettings,
                        icon: const PrimitiveGearIcon(),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  if (loading) ...[
                    LinearProgressIndicator(
                      minHeight: 2,
                      color: DFitColors.accent,
                      backgroundColor: colors.border,
                    ),
                    const SizedBox(height: 10),
                  ],
                  if (syncMessage != null) ...[
                    _SyncBanner(message: syncMessage!, onRetry: onRefresh),
                    const SizedBox(height: 10),
                  ],
                  EnergyHeroCard(totals: totals, target: target),
                  const SizedBox(height: 12),
                  MacroBarGroup(totals: totals, target: target),
                  if (weeklyRange != null) ...[
                    const SizedBox(height: 12),
                    _WeeklySummaryCard(range: weeklyRange!),
                  ],
                  const SizedBox(height: 22),
                  if (isEmpty)
                    _EmptyTodayBody(onAddManually: onAddManually)
                  else
                    _MealsList(
                      meals: meals,
                      onOpenMeal: onOpenMeal,
                      onAddManually: onAddManually,
                    ),
                ],
              ),
            ),
            if (loading && meals.isNotEmpty)
              Positioned(
                top: 0,
                left: 0,
                right: 0,
                child: IgnorePointer(
                  child: LinearProgressIndicator(
                    minHeight: 2,
                    color: DFitColors.accent,
                    backgroundColor: DFitColors.accent.withValues(alpha: 0.08),
                  ),
                ),
              ),
            if (isEmpty)
              Positioned(
                left: 0,
                right: 0,
                bottom: 24,
                child: Center(child: DFitFab(onPressed: onScan, pulsing: true)),
              ),
          ],
        ),
      ),
    );
  }

  String _dateLabel(DateTime date) {
    const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
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
    return '${days[date.weekday - 1]} ${date.day.toString().padLeft(2, '0')} ${months[date.month - 1]}';
  }
}

class _WeeklySummaryCard extends StatelessWidget {
  const _WeeklySummaryCard({required this.range});

  final JournalRangeData range;

  @override
  Widget build(BuildContext context) {
    final colors = context.dfit;
    final summary = range.summary;
    final trackedText = '${summary.activeDays}/${summary.windowDays} days';

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: colors.surfaceCard,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: colors.border, width: 0.5),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '7 DAY SUMMARY',
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    color: colors.textSecondary,
                    letterSpacing: 1.4,
                  ),
                ),
                const SizedBox(height: 7),
                Text(
                  trackedText,
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 4),
                Text(
                  '${summary.mealCount} meals logged',
                  style: Theme.of(
                    context,
                  ).textTheme.bodySmall?.copyWith(color: colors.textSecondary),
                ),
              ],
            ),
          ),
          _WeeklyMetric(
            label: 'avg kcal',
            value: '${summary.dailyAverage.calories}',
          ),
          const SizedBox(width: 8),
          _WeeklyMetric(
            label: 'protein',
            value: '${summary.dailyAverage.proteinG.round()}g',
            accent: true,
          ),
        ],
      ),
    );
  }
}

class _WeeklyMetric extends StatelessWidget {
  const _WeeklyMetric({
    required this.label,
    required this.value,
    this.accent = false,
  });

  final String label;
  final String value;
  final bool accent;

  @override
  Widget build(BuildContext context) {
    final colors = context.dfit;
    final fill = accent
        ? colors.accent.withValues(alpha: 0.18)
        : colors.mutedFill;
    final valueColor = accent ? colors.accentText : colors.textPrimary;

    return Container(
      width: 68,
      padding: const EdgeInsets.symmetric(vertical: 9),
      decoration: BoxDecoration(
        color: fill,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Column(
        children: [
          Text(
            value,
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              color: valueColor,
              fontFeatures: const [FontFeature.tabularFigures()],
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
              color: colors.textSecondary,
              letterSpacing: 0,
            ),
          ),
        ],
      ),
    );
  }
}

class _SyncBanner extends StatelessWidget {
  const _SyncBanner({required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final colors = context.dfit;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
      decoration: BoxDecoration(
        color: DFitColors.accent.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(
          color: DFitColors.accent.withValues(alpha: 0.3),
          width: 0.5,
        ),
      ),
      child: Row(
        children: [
          Expanded(
            child: Text(
              message,
              style: Theme.of(
                context,
              ).textTheme.bodySmall?.copyWith(color: colors.accentText),
            ),
          ),
          const SizedBox(width: 8),
          TextButton(
            onPressed: onRetry,
            style: TextButton.styleFrom(
              foregroundColor: colors.accentText,
              minimumSize: const Size(48, 32),
              padding: const EdgeInsets.symmetric(horizontal: 10),
              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
            ),
            child: const Text('Retry'),
          ),
        ],
      ),
    );
  }
}

class _QuotaPill extends StatelessWidget {
  const _QuotaPill({required this.quota});

  final ScanQuota quota;

  @override
  Widget build(BuildContext context) {
    final colors = context.dfit;
    final remaining = quota.totalRemaining;
    final label = remaining > 0 ? '$remaining scans' : 'ad unlock';
    final background = remaining > 0 ? colors.textPrimary : colors.accent;
    final foreground = remaining > 0 ? colors.background : colors.accentOn;

    return Container(
      height: 34,
      padding: const EdgeInsets.symmetric(horizontal: 11),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(17),
        border: Border.all(
          color: Colors.white.withValues(alpha: 0.08),
          width: 0.5,
        ),
      ),
      alignment: Alignment.center,
      child: Text(
        label,
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
          color: foreground,
          letterSpacing: 0.2,
          fontFeatures: const [FontFeature.tabularFigures()],
        ),
      ),
    );
  }
}

class _MealsList extends StatelessWidget {
  const _MealsList({
    required this.meals,
    required this.onOpenMeal,
    required this.onAddManually,
  });

  final List<MealLog> meals;
  final ValueChanged<MealLog> onOpenMeal;
  final VoidCallback onAddManually;

  @override
  Widget build(BuildContext context) {
    final colors = context.dfit;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'TODAY',
          style: Theme.of(
            context,
          ).textTheme.labelSmall?.copyWith(color: colors.textPrimary),
        ),
        const SizedBox(height: 10),
        for (final meal in meals)
          MealCard(meal: meal, onTap: () => onOpenMeal(meal)),
        const SizedBox(height: 8),
        TextButton(onPressed: onAddManually, child: const Text('Add manually')),
      ],
    );
  }
}

class _EmptyTodayBody extends StatelessWidget {
  const _EmptyTodayBody({required this.onAddManually});

  final VoidCallback onAddManually;

  @override
  Widget build(BuildContext context) {
    final colors = context.dfit;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 58),
      child: Column(
        children: [
          SizedBox(
            width: 120,
            height: 100,
            child: Stack(
              alignment: Alignment.center,
              children: [
                _GhostVessel(left: 0, top: 22, width: 38, height: 26),
                _GhostVessel(left: 70, top: 14, width: 34, height: 36),
                Positioned(
                  bottom: 10,
                  child: Column(
                    children: List.generate(2, (_) {
                      return Container(
                        width: 32,
                        height: 8,
                        margin: const EdgeInsets.only(top: 3),
                        decoration: BoxDecoration(
                          border: Border.all(
                            color: DFitColors.textTertiaryLight,
                            width: 1.4,
                          ),
                          borderRadius: BorderRadius.circular(99),
                        ),
                      );
                    }),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 18),
          Text('No meals yet', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 6),
          Text(
            'Tap the camera to log your first meal of the day.',
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: colors.textSecondary,
              height: 1.4,
            ),
          ),
          const SizedBox(height: 12),
          TextButton(
            onPressed: onAddManually,
            child: const Text('Add manually'),
          ),
        ],
      ),
    );
  }
}

class _GhostVessel extends StatelessWidget {
  const _GhostVessel({
    required this.left,
    required this.top,
    required this.width,
    required this.height,
  });

  final double left;
  final double top;
  final double width;
  final double height;

  @override
  Widget build(BuildContext context) {
    return Positioned(
      left: left,
      top: top,
      child: Container(
        width: width,
        height: height,
        decoration: BoxDecoration(
          border: Border.all(color: DFitColors.textTertiaryLight, width: 1.4),
          borderRadius: const BorderRadius.vertical(
            bottom: Radius.circular(20),
          ),
        ),
      ),
    );
  }
}
