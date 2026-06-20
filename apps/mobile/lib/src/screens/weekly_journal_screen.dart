import 'package:flutter/material.dart';

import '../models/meal.dart';
import '../navigation/logmyplate_page_route.dart';
import '../theme/logmyplate_colors.dart';
import '../theme/logmyplate_spacing.dart';
import '../theme/logmyplate_surfaces.dart';
import '../theme/logmyplate_theme.dart';
import '../widgets/glass/glass_cards.dart';
import '../widgets/energy_hero_card.dart';
import '../widgets/logmyplate_notice.dart';
import '../widgets/macro_bar_group.dart';
import '../widgets/meal_delete_controls.dart';
import '../widgets/primitive_icons.dart';
import '../widgets/glass/fake_glass_row.dart';
import '../widgets/glass/glass_backdrop.dart';
import '../widgets/glass/glass_cards.dart';
import 'package:logmyplate_mobile/src/widgets/glass/glass_wrapper.dart';

class WeeklyJournalScreen extends StatefulWidget {
  const WeeklyJournalScreen({
    super.key,
    required this.range,
    required this.onOpenMeal,
    required this.onDeleteMeal,
    required this.onLoadWeek,
    required this.onLoadWeeks,
    this.isSyncing = false,
    this.syncMessage,
    this.onRefresh,
    this.showBackButton = true,
    this.bottomPadding = 28,
  });

  final JournalRangeData range;
  final Future<bool> Function(MealLog meal) onOpenMeal;
  final Future<void> Function(MealLog meal) onDeleteMeal;
  final Future<JournalRangeData> Function(int weekOffset) onLoadWeek;
  final Future<List<JournalWeekOption>> Function() onLoadWeeks;
  final bool isSyncing;
  final String? syncMessage;
  final Future<void> Function()? onRefresh;
  final bool showBackButton;
  final double bottomPadding;

  @override
  State<WeeklyJournalScreen> createState() => _WeeklyJournalScreenState();
}

class _WeeklyJournalScreenState extends State<WeeklyJournalScreen> {
  late JournalRangeData _range = widget.range;
  int _weekOffset = 0;
  bool _loadingWeek = false;
  bool _loadingAvailableWeeks = true;
  String? _weekLoadError;
  late List<JournalWeekOption> _availableWeeks = _initialAvailableWeeks();

  @override
  void initState() {
    super.initState();
    _loadAvailableWeeks();
  }

  @override
  Widget build(BuildContext context) {
    final days = _range.days.reversed
        .where((day) => day.mealCount > 0)
        .toList(growable: false);

    return Scaffold(
      extendBodyBehindAppBar: true,
      body: GlassBackdrop(
        child: SafeArea(
          child: ListView(
          padding: EdgeInsets.fromLTRB(16, 12, 16, widget.bottomPadding),
          children: [
            _JournalHeader(
              label: '7 Day Journal',
              title: 'Weekly summary',
              subtitle: _rangeLabel(_range),
              showBackButton: widget.showBackButton,
            ),
            const SizedBox(height: LogMyPlateSpacing.itemSpacing),
            if (_loadingAvailableWeeks || _availableWeeks.isNotEmpty)
              _WeekSelector(
                range: _range,
                loading: _loadingWeek || _loadingAvailableWeeks,
                onTap: _openWeekPicker,
              ),
            if (widget.isSyncing ||
                widget.syncMessage != null ||
                _loadingWeek ||
                _weekLoadError != null) ...[
              const SizedBox(height: LogMyPlateSpacing.itemSpacing),
              _JournalSyncStrip(
                isSyncing: widget.isSyncing || _loadingWeek,
                message: _weekLoadError ?? widget.syncMessage,
                onRefresh: widget.onRefresh,
              ),
            ],
            const SizedBox(height: LogMyPlateSpacing.itemSpacing),
            _WeeklyJournalHero(range: _range),
            const SizedBox(height: LogMyPlateSpacing.itemSpacing),
            _LabeledPanel(
              label: 'Tracked Day Average',
              child: MacroBarGroup(totals: _range.summary.trackedDayAverage),
            ),
            const SizedBox(height: LogMyPlateSpacing.sectionSpacing),
            _SectionLabel('Day Wise'),
            const SizedBox(height: 10),
            if (days.isEmpty)
              const _EmptyWeekCard()
            else
              for (final day in days)
                _JournalDayRow(
                  day: day,
                  target: _range.target,
                  onTap: () => _openDay(context, day),
                ),
          ],
        ),
      ),
      ),
    );
  }

  Future<void> _openDay(BuildContext context, JournalDayData day) async {
    await Navigator.of(context).push<void>(
      logmyplatePageRoute<void>(
        builder: (_) => DayJournalDetailScreen(
          day: day,
          target: _range.target,
          onOpenMeal: widget.onOpenMeal,
          onDeleteMeal: widget.onDeleteMeal,
          onMealDeleted: () async {
            await _loadWeek(_weekOffset);
            await _loadAvailableWeeks();
          },
        ),
      ),
    );
  }

  Future<void> _openWeekPicker() async {
    if (_loadingAvailableWeeks || _availableWeeks.isEmpty) return;
    final selected = await showModalBottomSheet<int>(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (_) => _WeekPickerSheet(
        selectedWeekOffset: _weekOffset,
        weeks: _availableWeeks,
      ),
    );
    if (selected == null || selected == _weekOffset || !mounted) return;

    await _loadWeek(selected);
  }

  Future<void> _loadAvailableWeeks() async {
    try {
      final weeks = await widget.onLoadWeeks();
      final visibleWeeks = weeks
          .where((week) => week.activeDays > 0)
          .toList(growable: false);
      if (!mounted) return;
      setState(() {
        _availableWeeks = visibleWeeks;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _weekLoadError ??= 'Could not load saved weeks.';
      });
    } finally {
      if (mounted) setState(() => _loadingAvailableWeeks = false);
    }
  }

  List<JournalWeekOption> _initialAvailableWeeks() {
    if (widget.range.summary.activeDays <= 0) return const [];
    return [
      JournalWeekOption(
        weekOffset: 0,
        startDate: widget.range.startDate,
        endDate: widget.range.endDate,
        activeDays: widget.range.summary.activeDays,
      ),
    ];
  }

  Future<void> _loadWeek(int selected) async {
    setState(() {
      _loadingWeek = true;
      _weekLoadError = null;
    });
    try {
      final nextRange = await widget.onLoadWeek(selected);
      if (!mounted) return;
      setState(() {
        _weekOffset = selected;
        _range = nextRange;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _weekLoadError = 'Could not load that week.';
      });
    } finally {
      if (mounted) setState(() => _loadingWeek = false);
    }
  }
}

class DayJournalDetailScreen extends StatefulWidget {
  const DayJournalDetailScreen({
    super.key,
    required this.day,
    required this.onOpenMeal,
    required this.onDeleteMeal,
    required this.onMealDeleted,
    this.target,
  });

  final JournalDayData day;
  final MacroTotals? target;
  final Future<bool> Function(MealLog meal) onOpenMeal;
  final Future<void> Function(MealLog meal) onDeleteMeal;
  final Future<void> Function() onMealDeleted;

  @override
  State<DayJournalDetailScreen> createState() => _DayJournalDetailScreenState();
}

class _DayJournalDetailScreenState extends State<DayJournalDetailScreen> {
  late JournalDayData _day = widget.day;

  @override
  Widget build(BuildContext context) {
    final meals = _day.meals;
    final hasMeals = meals.isNotEmpty;

    return Scaffold(
      extendBodyBehindAppBar: true,
      body: GlassBackdrop(
        child: SafeArea(
          child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 28),
          children: [
            _JournalHeader(
              label: 'Day Analysis',
              title: _dayTitle(_day.date),
              subtitle: _mealCountLabel(_day.mealCount),
            ),
            const SizedBox(height: LogMyPlateSpacing.sectionSpacing),
            if (hasMeals) ...[
              EnergyHeroCard(
                totals: _day.totals,
                mealCount: _day.mealCount,
                label: 'Day Energy',
                target: widget.target,
              ),
              const SizedBox(height: LogMyPlateSpacing.itemSpacing),
              MacroBarGroup(totals: _day.totals),
            ] else
              _EmptyDayOverview(day: _day),
            const SizedBox(height: LogMyPlateSpacing.sectionSpacing),
            _SectionLabel('Meals'),
            const SizedBox(height: 10),
            if (meals.isEmpty)
              const _EmptyDayCard()
            else
              for (final meal in meals)
                _DayMealRow(
                  meal: meal,
                  onTap: () => _openMeal(context, meal),
                  onDelete: () => _deleteMeal(context, meal),
                ),
          ],
        ),
      ),
      ),
    );
  }

  Future<void> _openMeal(BuildContext context, MealLog meal) async {
    final deleted = await widget.onOpenMeal(meal);
    if (deleted && context.mounted) {
      _removeMeal(meal);
      await widget.onMealDeleted();
    }
  }

  Future<bool> _deleteMeal(BuildContext context, MealLog meal) async {
    if (!await confirmMealDeletion(context)) return false;

    try {
      await widget.onDeleteMeal(meal);
      if (!mounted) return false;
      _removeMeal(meal);
      await widget.onMealDeleted();
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

  void _removeMeal(MealLog meal) {
    final meals = _day.meals.where((entry) => entry.id != meal.id).toList();
    setState(() {
      _day = JournalDayData(
        date: _day.date,
        mealCount: meals.length,
        totals: meals.fold<MacroTotals>(
          MacroTotals.zero,
          (total, entry) => total + entry.totals,
        ),
        meals: meals,
      );
    });
  }
}

class _DayMealRow extends StatelessWidget {
  const _DayMealRow({
    required this.meal,
    required this.onTap,
    required this.onDelete,
  });

  final MealLog meal;
  final VoidCallback onTap;
  final Future<bool> Function() onDelete;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;
    final totals = meal.totals;
    final itemNames = meal.items.map((item) => item.name).join(', ');

    final row = FakeGlassRow(
      borderRadius: BorderRadius.circular(LogMyPlateSpacing.cardBorderRadius),
      child: Material(
        type: MaterialType.transparency,
        child: InkWell(
          borderRadius: BorderRadius.circular(LogMyPlateSpacing.cardBorderRadius),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.all(LogMyPlateSpacing.cardPadding),
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
                '${totals.calories} kCal',
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

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: MealDeleteDismissible(
        dismissKey: ValueKey('day-meal-${meal.id}'),
        onDelete: onDelete,
        child: row,
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
        LogMyPlateColors.mealBreakfastBg,
        LogMyPlateColors.mealBreakfastFg,
      ),
      MealType.lunch => (
        LogMyPlateColors.mealLunchBg,
        LogMyPlateColors.mealLunchFg,
      ),
      MealType.snack => (
        LogMyPlateColors.mealSnackBg,
        LogMyPlateColors.mealSnackFg,
      ),
      MealType.dinner => (
        LogMyPlateColors.mealDinnerBg,
        LogMyPlateColors.mealDinnerFg,
      ),
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
    this.showBackButton = true,
  });

  final String label;
  final String title;
  final String subtitle;
  final bool showBackButton;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;

    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        if (showBackButton) ...[
          IconButton(
            onPressed: () => Navigator.of(context).pop(),
            icon: const BackMark(),
          ),
          const SizedBox(width: 8),
        ],
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
    final colors = context.logmyplate;
    final hasError = message != null;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: hasError
            ? LogMyPlateColors.accent.withValues(alpha: 0.12)
            : colors.mutedFill,
        borderRadius: BorderRadius.circular(LogMyPlateSpacing.elementBorderRadius),
        border: Border.all(
          color: hasError
              ? LogMyPlateColors.accent.withValues(alpha: 0.24)
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
                  color: hasError ? colors.accentText : LogMyPlateColors.accent,
                  shape: BoxShape.circle,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  hasError
                      ? message ?? 'Showing saved journal'
                      : 'Syncing latest journal',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: hasError ? colors.accentText : colors.textSecondary,
                  ),
                ),
              ),
              if (hasError && onRefresh != null)
                GlassWrapper(child: TextButton(
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
                )),
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
                      color: LogMyPlateColors.accent,
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

class _WeekSelector extends StatelessWidget {
  const _WeekSelector({
    required this.range,
    required this.loading,
    required this.onTap,
  });

  final JournalRangeData range;
  final bool loading;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;

    return FakeGlassRow(
      borderRadius: BorderRadius.circular(LogMyPlateSpacing.elementBorderRadius),
      child: Material(
        type: MaterialType.transparency,
        child: InkWell(
          onTap: loading ? null : onTap,
          borderRadius: BorderRadius.circular(LogMyPlateSpacing.elementBorderRadius),
          child: Padding(
            padding: const EdgeInsets.all(LogMyPlateSpacing.cardPadding),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Week',
                      style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        color: colors.textSecondary,
                        letterSpacing: 1.2,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      _rangeLabel(range),
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                  ],
                ),
              ),
              if (loading)
                SizedBox(
                  width: 18,
                  height: 18,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: colors.accent,
                  ),
                )
              else
                Icon(
                  Icons.keyboard_arrow_down_rounded,
                  color: colors.textSecondary,
                ),
            ],
          ),
          ),
        ),
      ),
    );
  }
}

class _WeekPickerSheet extends StatelessWidget {
  const _WeekPickerSheet({
    required this.selectedWeekOffset,
    required this.weeks,
  });

  final int selectedWeekOffset;
  final List<JournalWeekOption> weeks;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;

    return SafeArea(
      child: Container(
        margin: const EdgeInsets.all(LogMyPlateSpacing.itemSpacing),
        child: GlassCard(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 10),
          borderRadius: BorderRadius.circular(LogMyPlateSpacing.heroCardBorderRadius),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Choose week', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 10),
            for (final week in weeks)
              ListTile(
                contentPadding: EdgeInsets.zero,
                dense: true,
                title: Text(_weekOffsetLabel(week.weekOffset)),
                subtitle: Text(
                  '${_compactDate(week.startDate)} - ${_compactDate(week.endDate)}'
                  '  ·  ${week.activeDays} ${week.activeDays == 1 ? 'day' : 'days'} tracked',
                  style: Theme.of(
                    context,
                  ).textTheme.bodySmall?.copyWith(color: colors.textSecondary),
                ),
                trailing: week.weekOffset == selectedWeekOffset
                    ? Icon(Icons.check_rounded, color: colors.accent)
                    : null,
                onTap: () => Navigator.of(context).pop(week.weekOffset),
              ),
          ],
        ),
      ),
      ),
    );
  }
}

class _WeeklyJournalHero extends StatelessWidget {
  const _WeeklyJournalHero({required this.range});

  final JournalRangeData range;

  @override
  Widget build(BuildContext context) {
    final surface = LogMyPlateHeroSurfaceStyle.of(context);
    final summary = range.summary;
    final activePct = summary.windowDays == 0
        ? 0.0
        : (summary.activeDays / summary.windowDays).clamp(0.0, 1.0);

    return Container(
      padding: const EdgeInsets.all(LogMyPlateSpacing.cardPadding),
      decoration: surface.decoration(radius: 18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Last 7 Days',
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
              color: surface.textSecondary,
              letterSpacing: 1.8,
            ),
          ),
          const SizedBox(height: LogMyPlateSpacing.itemSpacing),
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '${summary.activeDays}/${summary.windowDays}',
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                  color: surface.textPrimary,
                  fontSize: 36,
                  fontFeatures: const [FontFeature.tabularFigures()],
                ),
              ),
              const SizedBox(width: 8),
              Padding(
                padding: const EdgeInsets.only(bottom: 6),
                child: Text(
                  'days tracked',
                  style: Theme.of(
                    context,
                  ).textTheme.bodySmall?.copyWith(color: surface.textSecondary),
                ),
              ),
            ],
          ),
          const SizedBox(height: LogMyPlateSpacing.sectionSpacing),
          _SegmentedProgress(value: activePct),
          const SizedBox(height: LogMyPlateSpacing.sectionSpacing),
          Row(
            children: [
              Expanded(
                child: _HeroStat(
                  label: 'Meals',
                  value: '${summary.mealCount}',
                  primaryText: surface.textPrimary,
                  secondaryText: surface.textSecondary,
                ),
              ),
              Expanded(
                child: _HeroStat(
                  label: 'Avg tracked day',
                  value: '${summary.trackedDayAverage.calories} kCal',
                  primaryText: surface.textPrimary,
                  secondaryText: surface.textSecondary,
                ),
              ),
              Expanded(
                child: _HeroStat(
                  label: 'Protein',
                  value: '${summary.trackedDayAverage.proteinG.round()}g',
                  primaryText: surface.textPrimary,
                  secondaryText: surface.textSecondary,
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
    final colors = context.logmyplate;
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
              color: active ? LogMyPlateColors.accent : colors.mutedFill,
              borderRadius: BorderRadius.circular(99),
            ),
          ),
        );
      }),
    );
  }
}

class _HeroStat extends StatelessWidget {
  const _HeroStat({
    required this.label,
    required this.value,
    required this.primaryText,
    required this.secondaryText,
  });

  final String label;
  final String value;
  final Color primaryText;
  final Color secondaryText;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          value,
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
            color: primaryText,
            fontFeatures: const [FontFeature.tabularFigures()],
          ),
        ),
        const SizedBox(height: 3),
        Text(
          label,
          style: Theme.of(context).textTheme.labelSmall?.copyWith(
            color: secondaryText,
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
    final colors = context.logmyplate;

    return LiteGlassCard(
      padding: const EdgeInsets.all(LogMyPlateSpacing.cardPadding),
      borderRadius: BorderRadius.circular(LogMyPlateSpacing.cardBorderRadius),
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
  const _JournalDayRow({required this.day, required this.onTap, this.target});

  final JournalDayData day;
  final MacroTotals? target;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;
    final hasMeals = day.mealCount > 0;
    final date = _parseDate(day.date);
    final targetCalories = target?.calories;
    final hasTarget = targetCalories != null && targetCalories > 0;
    final targetProgress = hasTarget
        ? (day.totals.calories / targetCalories).clamp(0.0, 1.0).toDouble()
        : 0.0;

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: FakeGlassRow(
        borderRadius: BorderRadius.circular(LogMyPlateSpacing.cardBorderRadius),
        child: Material(
          type: MaterialType.transparency,
          child: InkWell(
            borderRadius: BorderRadius.circular(LogMyPlateSpacing.cardBorderRadius),
            onTap: onTap,
            child: Padding(
              padding: const EdgeInsets.all(LogMyPlateSpacing.cardPadding),
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
                            '${day.totals.calories} kCal',
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
                      if (hasTarget) ...[
                        const SizedBox(height: 10),
                        _DayTargetStrip(
                          calories: day.totals.calories,
                          targetCalories: targetCalories,
                          progress: targetProgress,
                        ),
                      ],
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
      ),
    );
  }
}

class _DayTargetStrip extends StatelessWidget {
  const _DayTargetStrip({
    required this.calories,
    required this.targetCalories,
    required this.progress,
  });

  final int calories;
  final int targetCalories;
  final double progress;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;
    final overTarget = calories > targetCalories;

    return Row(
      children: [
        Expanded(
          child: ClipRRect(
            borderRadius: BorderRadius.circular(99),
            child: LinearProgressIndicator(
              minHeight: 5,
              value: progress,
              color: overTarget
                  ? LogMyPlateColors.destructive
                  : LogMyPlateColors.accent,
              backgroundColor: colors.mutedFill,
            ),
          ),
        ),
        const SizedBox(width: 8),
        Text(
          overTarget
              ? '+${calories - targetCalories} kCal'
              : '${targetCalories - calories} kCal left',
          style: Theme.of(context).textTheme.labelSmall?.copyWith(
            color: overTarget
                ? LogMyPlateColors.destructive
                : colors.textSecondary,
            letterSpacing: 0,
            fontFeatures: const [FontFeature.tabularFigures()],
          ),
        ),
      ],
    );
  }
}

class _DateBadge extends StatelessWidget {
  const _DateBadge({required this.date, required this.active});

  final DateTime? date;
  final bool active;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;
    final value = date;
    final badgeColor = active
        ? LogMyPlateColors.accent.withValues(alpha: 0.16)
        : colors.mutedFill;
    final borderColor = active
        ? LogMyPlateColors.accent.withValues(alpha: 0.55)
        : colors.border;

    return Container(
      width: 52,
      height: 58,
      decoration: BoxDecoration(
        color: badgeColor,
        borderRadius: BorderRadius.circular(LogMyPlateSpacing.elementBorderRadius),
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
          color: LogMyPlateColors.macroProtein,
          muted: muted,
        ),
        const SizedBox(width: 6),
        _MacroPill(
          label: 'C',
          value: '${totals.carbsG.round()}g',
          color: LogMyPlateColors.macroCarbs,
          muted: muted,
        ),
        const SizedBox(width: 6),
        _MacroPill(
          label: 'F',
          value: '${totals.fatG.round()}g',
          color: LogMyPlateColors.macroFat,
          muted: muted,
        ),
      ],
    );
  }
}

class _MacroPill extends StatelessWidget {
  const _MacroPill({
    required this.label,
    required this.value,
    required this.color,
    required this.muted,
  });

  final String label;
  final String value;
  final Color color;
  final bool muted;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;

    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 7),
        decoration: BoxDecoration(
          color: muted
              ? colors.mutedFill.withValues(alpha: 0.45)
              : color.withValues(alpha: 0.11),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: muted ? colors.border : color.withValues(alpha: 0.18),
            width: 0.5,
          ),
        ),
        child: Text(
          '$label $value',
          textAlign: TextAlign.center,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: Theme.of(context).textTheme.labelSmall?.copyWith(
            color: muted ? colors.textTertiary : colors.textPrimary,
            letterSpacing: 0,
            fontFeatures: const [FontFeature.tabularFigures()],
          ),
        ),
      ),
    );
  }
}

class _EmptyDayOverview extends StatelessWidget {
  const _EmptyDayOverview({required this.day});

  final JournalDayData day;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;

    return LiteGlassCard(
      padding: const EdgeInsets.all(LogMyPlateSpacing.sectionSpacing),
      borderRadius: BorderRadius.circular(LogMyPlateSpacing.heroCardBorderRadius),
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

class _EmptyDayCard extends StatelessWidget {
  const _EmptyDayCard();

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;

    return LiteGlassCard(
      padding: const EdgeInsets.all(LogMyPlateSpacing.sectionSpacing),
      borderRadius: BorderRadius.circular(LogMyPlateSpacing.cardBorderRadius),
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
        color: context.logmyplate.textSecondary,
        letterSpacing: 1.4,
      ),
    );
  }
}

String _rangeLabel(JournalRangeData range) {
  return '${_compactDate(range.startDate)} - ${_compactDate(range.endDate)}';
}

String _weekOffsetLabel(int offset) {
  return switch (offset) {
    0 => 'This week',
    1 => 'Last week',
    _ => '$offset weeks ago',
  };
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
