import 'package:flutter/material.dart';

import '../models/meal.dart';
import '../theme/logmyplate_colors.dart';
import '../theme/logmyplate_surfaces.dart';
import '../theme/logmyplate_theme.dart';
import '../widgets/glass/glass_cards.dart';
import '../widgets/glass/glass_section_card.dart';
import '../widgets/logmyplate_fab.dart';
import '../widgets/energy_hero_card.dart';
import '../widgets/logmyplate_notice.dart';
import '../widgets/macro_bar_group.dart';
import '../widgets/meal_card.dart';
import '../widgets/meal_delete_controls.dart';
import '../widgets/nutritionist_entry_button.dart';
import '../widgets/primitive_icons.dart';
import '../widgets/glass/glass_backdrop.dart';
import 'package:logmyplate_mobile/src/widgets/glass/glass_wrapper.dart';

class TodayScreen extends StatelessWidget {
  const TodayScreen({
    super.key,
    required this.meals,
    required this.totals,
    this.target,
    this.quota,
    this.rewardedAdProgress,
    this.weeklyRange,
    this.streakSummary,
    this.loading = false,
    this.initialLoading = false,
    this.weeklyJournalOpening = false,
    this.showScanAction = true,
    this.showSettingsAction = true,
    this.isPremium = false,
    this.bottomPadding = 120,
    this.syncMessage,
    required this.onRefresh,
    required this.onScan,
    this.onUnlockWithAd,
    required this.onAddManually,
    required this.onOpenSettings,
    required this.onOpenMeal,
    required this.onDeleteMeal,
    required this.onOpenWeeklyJournal,
    required this.onOpenStreak,
    this.onOpenNutritionist,
    this.onSetTarget,
  });

  final List<MealLog> meals;
  final MacroTotals totals;
  final MacroTotals? target;
  final ScanQuota? quota;
  final RewardedAdProgress? rewardedAdProgress;
  final JournalRangeData? weeklyRange;
  final StreakSummary? streakSummary;
  final bool loading;
  final bool initialLoading;
  final bool weeklyJournalOpening;
  final bool showScanAction;
  final bool showSettingsAction;
  final bool isPremium;
  final double bottomPadding;
  final String? syncMessage;
  final Future<void> Function() onRefresh;
  final VoidCallback onScan;
  final VoidCallback? onUnlockWithAd;
  final VoidCallback onAddManually;
  final VoidCallback onOpenSettings;
  final ValueChanged<MealLog> onOpenMeal;
  final Future<void> Function(MealLog meal) onDeleteMeal;
  final VoidCallback onOpenWeeklyJournal;
  final VoidCallback onOpenStreak;
  final VoidCallback? onOpenNutritionist;
  final VoidCallback? onSetTarget;

  @override
  Widget build(BuildContext context) {
    final isEmpty = meals.isEmpty && !initialLoading;
    final colors = context.logmyplate;
    final adProgress = rewardedAdProgress ?? RewardedAdProgress.initial();

    return Scaffold(
      extendBodyBehindAppBar: true,
      body: GlassBackdrop(
        child: SafeArea(
          child: Stack(
          children: [
            RefreshIndicator(
              color: LogMyPlateColors.accent,
              onRefresh: onRefresh,
              child: ListView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: EdgeInsets.fromLTRB(16, 12, 16, bottomPadding),
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
                        _QuotaPill(
                          quota: quota!,
                          progress: adProgress,
                          onUnlockWithAd: onUnlockWithAd,
                        ),
                        const SizedBox(width: 6),
                      ],
                      if (onOpenNutritionist != null)
                        IconButton(
                          tooltip: 'AI Nutritionist',
                          onPressed: onOpenNutritionist,
                          icon: Icon(
                            Icons.auto_awesome_rounded,
                            color: colors.icon,
                            size: 22,
                          ),
                        ),
                      if (showSettingsAction)
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
                      color: LogMyPlateColors.accent,
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
                    if (streakSummary != null) ...[
                      GestureDetector(
                        onTap: onOpenStreak,
                        child: _CardStreakPanel(streak: streakSummary),
                      ),
                      const SizedBox(height: 12),
                    ],
                    EnergyHeroCard(
                      totals: totals,
                      mealCount: meals.length,
                      target: target,
                      onSetTarget: onSetTarget,
                    ),
                    const SizedBox(height: 12),
                    MacroBarGroup(totals: totals),
                    if (weeklyRange != null) ...[
                      const SizedBox(height: 12),
                      _WeeklyRhythmCard(
                        range: weeklyRange!,
                        onOpenJournal: onOpenWeeklyJournal,
                        syncing: loading || weeklyJournalOpening,
                        opening: weeklyJournalOpening,
                        hasSyncIssue: syncMessage != null,
                      ),
                    ],
                    if (onOpenNutritionist != null) ...[
                      const SizedBox(height: 12),
                      NutritionistEntryButton(
                        isPremium: isPremium,
                        onTap: onOpenNutritionist!,
                      ),
                    ],
                    const SizedBox(height: 22),
                    if (isEmpty)
                      _EmptyTodayBody(onAddManually: onAddManually)
                    else
                      _MealsList(
                        meals: meals,
                        onOpenMeal: onOpenMeal,
                        onDeleteMeal: onDeleteMeal,
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
                    color: LogMyPlateColors.accent,
                    backgroundColor: LogMyPlateColors.accent.withValues(
                      alpha: 0.08,
                    ),
                  ),
                ),
              ),
            if (!initialLoading && showScanAction)
              Positioned(
                left: 0,
                right: 0,
                bottom: 24,
                child: Center(
                  child: LogMyPlateFab(
                    onPressed: onScan,
                    pulsing: isEmpty,
                  ),
                ),
              ),
          ],
        ),
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

class _WeeklyRhythmCard extends StatelessWidget {
  const _WeeklyRhythmCard({
    super.key,
    required this.range,
    required this.onOpenJournal,
    required this.syncing,
    required this.opening,
    required this.hasSyncIssue,
  });

  final JournalRangeData range;
  final VoidCallback onOpenJournal;
  final bool syncing;
  final bool opening;
  final bool hasSyncIssue;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;
    final summary = range.summary;
    
    final targetCalories = range.target?.calories;
    final hasTarget = targetCalories != null && targetCalories > 0;
    final averageCalories = summary.trackedDayAverage.calories > 0
        ? summary.trackedDayAverage.calories
        : summary.activeDays > 0
        ? (summary.totals.calories / summary.activeDays).round()
        : 0;

    return GlassSectionCard(
      title: 'Weekly rhythm',
      onTap: opening ? null : onOpenJournal,
      trailing: Container(
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
        decoration: BoxDecoration(
          color: colors.surfaceCard,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Text(
          'Meals logged this week: ${summary.activeDays}',
          style: Theme.of(context).textTheme.labelSmall?.copyWith(
            color: colors.textSecondary,
          ),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
                  '${summary.activeDays} Active Day${summary.activeDays == 1 ? '' : 's'}',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 12),
                _WeeklyCoveragePanel(
                  key: const ValueKey('journal'),
                  activeDays: summary.activeDays,
                  totalDays: summary.windowDays,
                  days: range.days,
                  averageCalories: averageCalories,
                  targetCalories: hasTarget ? targetCalories : null,
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Text(
                      hasSyncIssue
                          ? 'Showing saved data'
                          : opening
                          ? 'Loading details'
                          : 'Tap for details',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: colors.textSecondary,
                      ),
                    ),
                    const Spacer(),
                    opening
                        ? SizedBox(
                            key: const ValueKey('weekly-card-spinner'),
                            width: 15,
                            height: 15,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: LogMyPlateColors.accent,
                              backgroundColor: colors.mutedFill,
                            ),
                          )
                        : Icon(
                            Icons.arrow_forward_rounded,
                            color: colors.textSecondary,
                            size: 17,
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
                            color: LogMyPlateColors.accent,
                            backgroundColor: colors.mutedFill,
                          ),
                        )
                      : const SizedBox.shrink(key: ValueKey('weekly-idle')),
                ),
        ],
      ),
    );
  }
}

class _CardStreakPanel extends StatelessWidget {
  const _CardStreakPanel({super.key, this.streak});
  final StreakSummary? streak;

  @override
  Widget build(BuildContext context) {
    if (streak == null || !streak!.hasHistory) {
      return LiteGlassCard(
        child: Text(
          'Log today to start your streak!',
          style: Theme.of(context).textTheme.bodySmall,
          textAlign: TextAlign.center,
        ),
      );
    }
    final nextMilestone = streak!.nextMilestoneDays;

    return LiteGlassCard(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          SizedBox(
            width: 48,
            height: 48,
            child: Stack(
              alignment: Alignment.center,
              children: [
                Image.asset(
                  'assets/icons/shield.png',
                  width: 48,
                  height: 48,
                ),
                Padding(
                  padding: const EdgeInsets.only(bottom: 2), // adjust for visual center of shield
                  child: Text(
                    streak!.currentStreakDays.toString(),
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontFeatures: const [FontFeature.tabularFigures()],
                      fontWeight: FontWeight.bold,
                      color: const Color(0xFF382300),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (nextMilestone != null)
                  Text(
                    '${nextMilestone - streak!.currentStreakDays} more days to unlock Scan reward!',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      fontWeight: FontWeight.w500,
                    ),
                  )
                else
                  Text(
                    'You are on a streak!',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                if (streak!.nextRewardScans > 0) ...[
                  const SizedBox(height: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: LogMyPlateColors.accent.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.star_rounded, size: 14, color: LogMyPlateColors.accent),
                        const SizedBox(width: 4),
                        Text(
                          '+${streak!.nextRewardScans} scan reward',
                          style: Theme.of(context).textTheme.labelSmall?.copyWith(
                            color: LogMyPlateColors.accent,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}
class _WeeklyCoveragePanel extends StatelessWidget {
  const _WeeklyCoveragePanel({
    super.key,
    required this.activeDays,
    required this.totalDays,
    required this.days,
    required this.averageCalories,
    this.targetCalories,
  });

  final int activeDays;
  final int totalDays;
  final List<JournalDayData> days;
  final int averageCalories;
  final int? targetCalories;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;
    final visibleDays = totalDays <= 0 ? 7 : totalDays.clamp(1, 7);
    final filledDays = activeDays.clamp(0, visibleDays);
    final coverage = visibleDays == 0 ? 0.0 : filledDays / visibleDays;

    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        SizedBox(
          width: 72,
          height: 72,
          child: Stack(
            alignment: Alignment.center,
            children: [
              SizedBox.expand(
                child: CircularProgressIndicator(
                  strokeWidth: 8,
                  value: coverage,
                  strokeCap: StrokeCap.round,
                  color: LogMyPlateColors.accent,
                  backgroundColor: colors.mutedFill,
                ),
              ),
              Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    '$filledDays/$visibleDays',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontFeatures: const [FontFeature.tabularFigures()],
                    ),
                  ),
                  Text(
                    'days',
                    style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      color: colors.textSecondary,
                      letterSpacing: 0,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _WeeklyCoverageSegments(
                activeDays: filledDays,
                totalDays: visibleDays,
                days: days,
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  _WeeklyInfoPill(
                    label: 'Avg/day',
                    value: '$averageCalories kCal',
                  ),
                  if (targetCalories != null)
                    _WeeklyInfoPill(
                      label: 'Target/day',
                      value: '$targetCalories kCal',
                    ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _WeeklyCoverageSegments extends StatelessWidget {
  const _WeeklyCoverageSegments({
    required this.activeDays,
    required this.totalDays,
    required this.days,
  });

  final int activeDays;
  final int totalDays;
  final List<JournalDayData> days;

  static const _days = ['Sun', 'Mon', 'Tues', 'Wed', 'Thur', 'Fri', 'Sat'];

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;
    final now = DateTime.now();
    final todayStr = '${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}';

    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        for (var index = 0; index < 7; index++) ...[
          Builder(
            builder: (context) {
              bool isLogged = false;
              bool isPast = false;
              
              if (index < days.length) {
                final dayData = days[index];
                isLogged = dayData.mealCount > 0;
                if (dayData.date.compareTo(todayStr) < 0) {
                  isPast = true;
                }
              } else {
                isLogged = index < activeDays;
              }
              
              Color bgColor = colors.mutedFill;
              Color textColor = colors.textSecondary;
              
              if (isLogged) {
                bgColor = LogMyPlateColors.accent.withValues(alpha: 0.15);
                textColor = colors.accentText;
              } else if (isPast) {
                bgColor = LogMyPlateColors.destructive.withValues(alpha: 0.15);
                textColor = LogMyPlateColors.destructive;
              }
              
              return Expanded(
                child: Container(
                  margin: EdgeInsets.only(right: index != 6 ? 4 : 0),
                  padding: const EdgeInsets.symmetric(vertical: 4),
                  decoration: BoxDecoration(
                    color: bgColor,
                    borderRadius: BorderRadius.circular(6),
                  ),
                  alignment: Alignment.center,
                  child: Text(
                    _days[index],
                    style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      color: textColor,
                      fontSize: 9,
                      fontWeight: FontWeight.w600,
                      letterSpacing: 0,
                    ),
                    maxLines: 1,
                  ),
                ),
              );
            },
          ),
        ],
      ],
    );
  }
}

class _WeeklyInfoPill extends StatelessWidget {
  const _WeeklyInfoPill({
    required this.label,
    required this.value,
    this.highlighted = false,
  });

  final String label;
  final String value;
  final bool highlighted;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 7),
      decoration: BoxDecoration(
        color: highlighted
            ? LogMyPlateColors.accent.withValues(alpha: 0.18)
            : colors.mutedFill,
        borderRadius: BorderRadius.circular(99),
        border: highlighted
            ? Border.all(
                color: LogMyPlateColors.accent.withValues(alpha: 0.34),
                width: 0.5,
              )
            : null,
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            label,
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
              color: colors.textTertiary,
              letterSpacing: 0,
            ),
          ),
          const SizedBox(width: 5),
          Text(
            value,
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
              color: highlighted ? colors.accentText : colors.textSecondary,
              letterSpacing: 0,
              fontFeatures: const [FontFeature.tabularFigures()],
            ),
          ),
        ],
      ),
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
    final surface = LogMyPlateHeroSurfaceStyle.of(context);

    return AnimatedBuilder(
      animation: _controller,
      builder: (context, _) {
        return Column(
          key: const ValueKey('today-loading-skeleton'),
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: surface.decoration(radius: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _SkeletonBox(
                    width: 74,
                    height: 10,
                    shimmer: _controller.value,
                    darkSurface: surface.isDark,
                  ),
                  const SizedBox(height: 16),
                  _SkeletonBox(
                    width: 170,
                    height: 44,
                    radius: 10,
                    shimmer: _controller.value,
                    darkSurface: surface.isDark,
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
                            darkSurface: surface.isDark,
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
                      darkSurface: surface.isDark,
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
    final colors = context.logmyplate;

    return LiteGlassCard(
      padding: const EdgeInsets.all(14),
      borderRadius: BorderRadius.circular(14),
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
    final colors = context.logmyplate;
    final base = darkSurface
        ? Colors.white.withValues(alpha: 0.07)
        : colors.mutedFill;
    final highlight = darkSurface
        ? LogMyPlateColors.accent.withValues(alpha: 0.18)
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
    final colors = context.logmyplate;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
      decoration: BoxDecoration(
        color: LogMyPlateColors.accent.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(
          color: LogMyPlateColors.accent.withValues(alpha: 0.3),
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
          GlassWrapper(child: TextButton(
            onPressed: onRetry,
            style: TextButton.styleFrom(
              foregroundColor: colors.accentText,
              minimumSize: const Size(48, 32),
              padding: const EdgeInsets.symmetric(horizontal: 10),
              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
            ),
            child: const Text('Retry'),
          )),
        ],
      ),
    );
  }
}

class _QuotaPill extends StatelessWidget {
  const _QuotaPill({
    required this.quota,
    required this.progress,
    this.onUnlockWithAd,
  });

  final ScanQuota quota;
  final RewardedAdProgress progress;
  final VoidCallback? onUnlockWithAd;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;
    final remaining = quota.totalRemaining;
    final canUnlockWithAd =
        remaining <= 0 && onUnlockWithAd != null && !progress.dailyLimitReached;
    final label = remaining > 0
        ? '$remaining scans'
        : progress.dailyLimitReached
        ? 'limit hit'
        : 'ad unlock';
    final background = remaining > 0
        ? colors.textPrimary
        : canUnlockWithAd
        ? colors.accent
        : colors.mutedFill;
    final foreground = remaining > 0
        ? colors.background
        : canUnlockWithAd
        ? colors.accentOn
        : colors.textSecondary;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(17),
        onTap: canUnlockWithAd ? onUnlockWithAd : null,
        child: Ink(
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
          child: Center(
            child: Text(
              label,
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                color: foreground,
                letterSpacing: 0.2,
                fontFeatures: const [FontFeature.tabularFigures()],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _MealsList extends StatelessWidget {
  const _MealsList({
    required this.meals,
    required this.onOpenMeal,
    required this.onDeleteMeal,
    required this.onAddManually,
  });

  final List<MealLog> meals;
  final ValueChanged<MealLog> onOpenMeal;
  final Future<void> Function(MealLog meal) onDeleteMeal;
  final VoidCallback onAddManually;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;

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
          MealCard(
            meal: meal,
            onTap: () => onOpenMeal(meal),
            onDelete: () => _deleteMeal(context, meal),
          ),
        const SizedBox(height: 8),
        GlassWrapper(child: TextButton(onPressed: onAddManually, child: const Text('Add manually'))),
      ],
    );
  }

  Future<bool> _deleteMeal(BuildContext context, MealLog meal) async {
    if (!await confirmMealDeletion(context)) return false;

    try {
      await onDeleteMeal(meal);
      return true;
    } catch (_) {
      if (!context.mounted) return false;
      LogMyPlateNotice.show(
        context,
        tone: LogMyPlateNoticeTone.error,
        title: 'Could not delete meal',
        message: 'Check your connection and try again.',
      );
      return false;
    }
  }
}

class _EmptyTodayBody extends StatelessWidget {
  const _EmptyTodayBody({required this.onAddManually});

  final VoidCallback onAddManually;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;
    final isDark = Theme.of(context).brightness == Brightness.dark;

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
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(22),
            border: Border.all(
              color: isDark
                  ? Colors.white.withValues(alpha: 0.08)
                  : LogMyPlateColors.accent.withValues(alpha: 0.20),
              width: 0.7,
            ),
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: isDark
                  ? const [Color(0xFF171D19), Color(0xFF101412)]
                  : const [Colors.white, Color(0xFFFFFBF0)],
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: isDark ? 0.14 : 0.06),
                blurRadius: 24,
                offset: const Offset(0, 14),
              ),
            ],
          ),
          child: Row(
            children: [
              SizedBox(
                width: 86,
                height: 86,
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    Container(
                      width: 86,
                      height: 86,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: LogMyPlateColors.accent.withValues(alpha: 0.10),
                      ),
                    ),
                    Container(
                      width: 62,
                      height: 62,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: isDark
                            ? Colors.white.withValues(alpha: 0.06)
                            : const Color(0xFFFFF4D8),
                        border: Border.all(
                          color: LogMyPlateColors.accent.withValues(
                            alpha: 0.30,
                          ),
                        ),
                      ),
                      child: Center(
                        child: PrimitiveCameraIcon(
                          color: colors.accentText,
                          size: 28,
                        ),
                      ),
                    ),
                    Positioned(
                      right: 6,
                      top: 12,
                      child: Container(
                        width: 10,
                        height: 10,
                        decoration: const BoxDecoration(
                          color: LogMyPlateColors.accent,
                          shape: BoxShape.circle,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Ready for your first meal',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: colors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 5),
                    Text(
                      'Use Scan from the bottom bar, or add a quick manual log.',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: colors.textSecondary,
                        height: 1.35,
                      ),
                    ),
                    const SizedBox(height: 11),
                    Align(
                      alignment: Alignment.centerLeft,
                      child: GlassWrapper(child: TextButton(
                        onPressed: onAddManually,
                        style: TextButton.styleFrom(
                          foregroundColor: colors.accentText,
                          backgroundColor: LogMyPlateColors.accent.withValues(
                            alpha: 0.12,
                          ),
                          minimumSize: const Size(0, 34),
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(99),
                          ),
                        ),
                        child: const Text('Add manually'),
                      )),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
