import 'package:flutter/material.dart';

import '../models/meal.dart';
import '../theme/dfit_colors.dart';
import '../widgets/dfit_fab.dart';
import '../widgets/energy_hero_card.dart';
import '../widgets/macro_bar_group.dart';
import '../widgets/meal_card.dart';
import '../widgets/primitive_icons.dart';

class TodayScreen extends StatelessWidget {
  const TodayScreen({
    super.key,
    required this.meals,
    required this.target,
    this.loading = false,
    this.syncMessage,
    required this.onScan,
    required this.onAddManually,
    required this.onOpenSettings,
    required this.onOpenMeal,
  });

  final List<MealLog> meals;
  final MacroTotals target;
  final bool loading;
  final String? syncMessage;
  final VoidCallback onScan;
  final VoidCallback onAddManually;
  final VoidCallback onOpenSettings;
  final ValueChanged<MealLog> onOpenMeal;

  @override
  Widget build(BuildContext context) {
    final totals = meals.fold<MacroTotals>(
      MacroTotals.zero,
      (total, meal) => total + meal.totals,
    );
    final isEmpty = meals.isEmpty;

    return Scaffold(
      body: SafeArea(
        child: Stack(
          children: [
            ListView(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 120),
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      _dateLabel(DateTime.now()),
                      style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        color: DFitColors.textSecondaryLight,
                        letterSpacing: 1.4,
                      ),
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
                  const LinearProgressIndicator(
                    minHeight: 2,
                    color: DFitColors.accent,
                    backgroundColor: DFitColors.borderLight,
                  ),
                  const SizedBox(height: 10),
                ],
                if (syncMessage != null) ...[
                  _SyncBanner(message: syncMessage!),
                  const SizedBox(height: 10),
                ],
                EnergyHeroCard(totals: totals, target: target),
                const SizedBox(height: 12),
                MacroBarGroup(totals: totals, target: target),
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

class _SyncBanner extends StatelessWidget {
  const _SyncBanner({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
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
      child: Text(
        message,
        style: Theme.of(
          context,
        ).textTheme.bodySmall?.copyWith(color: DFitColors.accentWarm),
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
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('TODAY', style: Theme.of(context).textTheme.labelSmall),
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
              color: DFitColors.textSecondaryLight,
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
