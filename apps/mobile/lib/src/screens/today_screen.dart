import 'package:flutter/material.dart';

import '../models/meal.dart';
import '../theme/dfit_colors.dart';
import '../theme/dfit_theme.dart';
import '../widgets/dfit_fab.dart';
import '../widgets/energy_hero_card.dart';
import '../widgets/macro_bar_group.dart';
import '../widgets/meal_card.dart';

class TodayScreen extends StatelessWidget {
  const TodayScreen({
    super.key,
    required this.meals,
    required this.totals,
    this.quota,
    this.weeklyRange,
    this.loading = false,
    this.initialLoading = false,
    this.syncMessage,
    required this.onRefresh,
    required this.onScan,
    required this.onAddManually,
    required this.onOpenSettings,
    required this.onOpenMeal,
    required this.onOpenWeeklyJournal,
  });

  final List<MealLog> meals;
  final MacroTotals totals;
  final ScanQuota? quota;
  final JournalRangeData? weeklyRange;
  final bool loading;
  final bool initialLoading;
  final String? syncMessage;
  final Future<void> Function() onRefresh;
  final VoidCallback onScan;
  final VoidCallback onAddManually;
  final VoidCallback onOpenSettings;
  final ValueChanged<MealLog> onOpenMeal;
  final VoidCallback onOpenWeeklyJournal;

  @override
  Widget build(BuildContext context) {
    final isEmpty = meals.isEmpty && !initialLoading;
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
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 120),
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
                      IconButton(
                        tooltip: 'Settings',
                        onPressed: onOpenSettings,
                        icon: Icon(
                          Icons.settings_outlined,
                          color: colors.icon,
                          size: 22,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  if (loading && !initialLoading) ...[
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
                  if (initialLoading)
                    const _TodayLoadingBody()
                  else ...[
                    EnergyHeroCard(totals: totals, mealCount: meals.length),
                    const SizedBox(height: 12),
                    MacroBarGroup(totals: totals),
                    if (weeklyRange != null) ...[
                      const SizedBox(height: 12),
                      _WeeklySummaryCard(
                        range: weeklyRange!,
                        onTap: onOpenWeeklyJournal,
                        syncing: loading,
                        hasSyncIssue: syncMessage != null,
                      ),
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
                ],
              ),
            ),
            if (loading && meals.isNotEmpty && !initialLoading)
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
            if (!initialLoading)
              Positioned(
                left: 0,
                right: 0,
                bottom: 24,
                child: Center(
                  child: DFitFab(onPressed: onScan, pulsing: isEmpty),
                ),
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
  const _WeeklySummaryCard({
    required this.range,
    required this.onTap,
    required this.syncing,
    required this.hasSyncIssue,
  });

  final JournalRangeData range;
  final VoidCallback onTap;
  final bool syncing;
  final bool hasSyncIssue;

  @override
  Widget build(BuildContext context) {
    final colors = context.dfit;
    final summary = range.summary;
    final trackedText =
        '${summary.activeDays} ${summary.activeDays == 1 ? 'day' : 'days'} tracked';
    final trackedProgress = summary.windowDays == 0
        ? 0.0
        : (summary.activeDays / summary.windowDays).clamp(0.0, 1.0);

    return Material(
      color: colors.surfaceCard,
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: colors.border, width: 0.5),
          ),
          child: Column(
            children: [
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Text(
                              '7 Day Summary',
                              style: Theme.of(context).textTheme.labelSmall
                                  ?.copyWith(
                                    color: colors.textSecondary,
                                    letterSpacing: 1.4,
                                  ),
                            ),
                            if (syncing || hasSyncIssue) ...[
                              const SizedBox(width: 8),
                              _SyncDot(
                                color: hasSyncIssue
                                    ? colors.accentText
                                    : DFitColors.accent,
                              ),
                            ],
                          ],
                        ),
                        const SizedBox(height: 7),
                        Text(
                          trackedText,
                          style: Theme.of(context).textTheme.titleMedium,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          hasSyncIssue
                              ? 'Showing saved journal'
                              : syncing
                              ? '${summary.mealCount} meals logged - syncing'
                              : '${summary.mealCount} meals logged',
                          style: Theme.of(context).textTheme.bodySmall
                              ?.copyWith(color: colors.textSecondary),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      color: colors.mutedFill,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(
                      Icons.chevron_right_rounded,
                      color: colors.textSecondary,
                      size: 22,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              _WeeklyProgressStrip(
                totalDays: summary.windowDays,
                progress: trackedProgress,
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Text(
                    'Open weekly journal',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: colors.textSecondary,
                    ),
                  ),
                  const Spacer(),
                  Icon(
                    Icons.chevron_right_rounded,
                    color: colors.textSecondary,
                    size: 18,
                  ),
                ],
              ),
              AnimatedSwitcher(
                duration: const Duration(milliseconds: 200),
                child: syncing
                    ? Padding(
                        key: const ValueKey('weekly-syncing'),
                        padding: const EdgeInsets.only(top: 12),
                        child: LinearProgressIndicator(
                          minHeight: 2,
                          color: DFitColors.accent,
                          backgroundColor: colors.mutedFill,
                        ),
                      )
                    : const SizedBox.shrink(key: ValueKey('weekly-idle')),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _WeeklyProgressStrip extends StatelessWidget {
  const _WeeklyProgressStrip({required this.totalDays, required this.progress});

  final int totalDays;
  final double progress;

  @override
  Widget build(BuildContext context) {
    final colors = context.dfit;
    final visibleDays = totalDays <= 0 ? 7 : totalDays.clamp(1, 7);
    final filledDays = (progress * visibleDays).round();

    return Row(
      children: [
        for (var index = 0; index < visibleDays; index++) ...[
          Expanded(
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 280),
              height: 5,
              decoration: BoxDecoration(
                color: index < filledDays
                    ? DFitColors.accent
                    : colors.mutedFill,
                borderRadius: BorderRadius.circular(99),
              ),
            ),
          ),
          if (index != visibleDays - 1) const SizedBox(width: 5),
        ],
      ],
    );
  }
}

class _SyncDot extends StatelessWidget {
  const _SyncDot({required this.color});

  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 6,
      height: 6,
      decoration: BoxDecoration(color: color, shape: BoxShape.circle),
    );
  }
}

class _TodayLoadingBody extends StatefulWidget {
  const _TodayLoadingBody();

  @override
  State<_TodayLoadingBody> createState() => _TodayLoadingBodyState();
}

class _TodayLoadingBodyState extends State<_TodayLoadingBody>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1400),
  )..repeat();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.dfit;

    return AnimatedBuilder(
      animation: _controller,
      builder: (context, _) {
        return Column(
          key: const ValueKey('today-loading-skeleton'),
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: colors.surfaceHero,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _SkeletonBox(
                    width: 74,
                    height: 10,
                    shimmer: _controller.value,
                    darkSurface: true,
                  ),
                  const SizedBox(height: 16),
                  _SkeletonBox(
                    width: 170,
                    height: 44,
                    radius: 10,
                    shimmer: _controller.value,
                    darkSurface: true,
                  ),
                  const SizedBox(height: 18),
                  Row(
                    children: List.generate(10, (index) {
                      return Expanded(
                        child: Padding(
                          padding: EdgeInsets.only(right: index == 9 ? 0 : 3),
                          child: _SkeletonBox(
                            height: 5,
                            radius: 99,
                            shimmer: _controller.value,
                            darkSurface: true,
                          ),
                        ),
                      );
                    }),
                  ),
                  const SizedBox(height: 10),
                  Align(
                    alignment: Alignment.centerRight,
                    child: _SkeletonBox(
                      width: 96,
                      height: 10,
                      shimmer: _controller.value,
                      darkSurface: true,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
            _LoadingCard(
              child: Row(
                children: List.generate(3, (index) {
                  return Expanded(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 5),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _SkeletonBox(
                            width: 48,
                            height: 18,
                            shimmer: _controller.value,
                          ),
                          const SizedBox(height: 10),
                          _SkeletonBox(
                            height: 6,
                            radius: 99,
                            shimmer: _controller.value,
                          ),
                          const SizedBox(height: 9),
                          _SkeletonBox(
                            width: 54,
                            height: 10,
                            shimmer: _controller.value,
                          ),
                        ],
                      ),
                    ),
                  );
                }),
              ),
            ),
            const SizedBox(height: 12),
            _LoadingCard(
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _SkeletonBox(
                          width: 104,
                          height: 10,
                          shimmer: _controller.value,
                        ),
                        const SizedBox(height: 14),
                        _SkeletonBox(
                          width: 92,
                          height: 20,
                          shimmer: _controller.value,
                        ),
                        const SizedBox(height: 8),
                        _SkeletonBox(
                          width: 124,
                          height: 12,
                          shimmer: _controller.value,
                        ),
                      ],
                    ),
                  ),
                  _SkeletonBox(
                    width: 68,
                    height: 68,
                    radius: 12,
                    shimmer: _controller.value,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 22),
            _SkeletonBox(width: 54, height: 10, shimmer: _controller.value),
            const SizedBox(height: 10),
            for (var index = 0; index < 3; index++) ...[
              _LoadingCard(
                child: Row(
                  children: [
                    _SkeletonBox(
                      width: 42,
                      height: 42,
                      radius: 21,
                      shimmer: _controller.value,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _SkeletonBox(
                            width: 70,
                            height: 10,
                            shimmer: _controller.value,
                          ),
                          const SizedBox(height: 9),
                          _SkeletonBox(
                            width: double.infinity,
                            height: 18,
                            shimmer: _controller.value,
                          ),
                          const SizedBox(height: 9),
                          _SkeletonBox(
                            width: 150,
                            height: 10,
                            shimmer: _controller.value,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 10),
            ],
          ],
        );
      },
    );
  }
}

class _LoadingCard extends StatelessWidget {
  const _LoadingCard({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    final colors = context.dfit;

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: colors.surfaceCard,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: colors.border, width: 0.5),
      ),
      child: child,
    );
  }
}

class _SkeletonBox extends StatelessWidget {
  const _SkeletonBox({
    this.width,
    required this.height,
    this.radius = 6,
    required this.shimmer,
    this.darkSurface = false,
  });

  final double? width;
  final double height;
  final double radius;
  final double shimmer;
  final bool darkSurface;

  @override
  Widget build(BuildContext context) {
    final colors = context.dfit;
    final base = darkSurface
        ? Colors.white.withValues(alpha: 0.07)
        : colors.mutedFill;
    final highlight = darkSurface
        ? DFitColors.accent.withValues(alpha: 0.18)
        : colors.textPrimary.withValues(alpha: 0.08);
    final start = -1.6 + shimmer * 3.2;

    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(radius),
        gradient: LinearGradient(
          begin: Alignment(start, -0.5),
          end: Alignment(start + 1.2, 0.5),
          colors: [base, highlight, base],
          stops: const [0.15, 0.5, 0.85],
        ),
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
          'Today',
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
