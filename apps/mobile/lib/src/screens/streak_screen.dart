import 'package:flutter/material.dart';

import '../models/meal.dart';
import '../theme/logmyplate_colors.dart';
import '../theme/logmyplate_surfaces.dart';
import '../theme/logmyplate_theme.dart';
import '../widgets/glass/glass_backdrop.dart';
import '../widgets/glass/glass_cards.dart';
import '../widgets/primitive_icons.dart';

class StreakScreen extends StatelessWidget {
  const StreakScreen({
    super.key,
    required this.streak,
  });

  final StreakSummary streak;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBodyBehindAppBar: true,
      backgroundColor: Colors.transparent,
      body: GlassBackdrop(
        child: SafeArea(
          child: ListView(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 28),
          children: [
            _Header(),
            const SizedBox(height: 16),
            _StreakHero(streak: streak),
            const SizedBox(height: 22),
            _MilestoneSection(streak: streak),
            if (streak.achievedMilestoneTitle != null) ...[
              const SizedBox(height: 22),
              _AchievedMilestoneSection(streak: streak),
            ],
          ],
        ),
      ),
      ),
    );
  }
}

class _Header extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;

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
                'Milestones',
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  color: colors.textSecondary,
                  letterSpacing: 1.4,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'Your Streak',
                style: Theme.of(context).textTheme.titleLarge,
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _StreakHero extends StatelessWidget {
  const _StreakHero({required this.streak});

  final StreakSummary streak;

  @override
  Widget build(BuildContext context) {
    final surface = LogMyPlateHeroSurfaceStyle.of(context);

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: surface.decoration(radius: 18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.local_fire_department_rounded, color: surface.textPrimary),
              const SizedBox(width: 8),
              Text(
                'Current Streak',
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  color: surface.textSecondary,
                  letterSpacing: 1.8,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '${streak.currentStreakDays}',
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                  color: surface.textPrimary,
                  fontSize: 40,
                  fontFeatures: const [FontFeature.tabularFigures()],
                ),
              ),
              const SizedBox(width: 8),
              Padding(
                padding: const EdgeInsets.only(bottom: 6),
                child: Text(
                  streak.currentStreakDays == 1 ? 'day' : 'days',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(color: surface.textSecondary),
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),
          Row(
            children: [
              Expanded(
                child: _HeroStat(
                  label: 'Longest',
                  value: '${streak.longestStreakDays} days',
                  primaryText: surface.textPrimary,
                  secondaryText: surface.textSecondary,
                ),
              ),
              Expanded(
                child: _HeroStat(
                  label: 'Status',
                  value: streak.todayLogged ? 'Logged today' : 'Needs log today',
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
          label,
          style: Theme.of(context).textTheme.labelSmall?.copyWith(
            color: secondaryText,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: Theme.of(context).textTheme.titleSmall?.copyWith(
            color: primaryText,
            fontFeatures: const [FontFeature.tabularFigures()],
          ),
        ),
      ],
    );
  }
}

class _MilestoneSection extends StatelessWidget {
  const _MilestoneSection({required this.streak});

  final StreakSummary streak;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;

    if (streak.nextMilestoneDays == null) {
      return const SizedBox.shrink();
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Next Milestone',
          style: Theme.of(context).textTheme.titleMedium,
        ),
        const SizedBox(height: 10),
        LiteGlassCard(
          padding: const EdgeInsets.all(16),
          borderRadius: BorderRadius.circular(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(Icons.flag_rounded, color: colors.accent, size: 24),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      '${streak.nextMilestoneDays} days',
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                streak.nextRewardScans > 0
                    ? 'Only ${streak.daysUntilNextMilestone} days left to reach this milestone. Keep logging your meals daily to earn +${streak.nextRewardScans} scans as a reward!'
                    : 'Only ${streak.daysUntilNextMilestone} days left to reach this milestone. Keep logging your meals daily!',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: colors.textSecondary,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _AchievedMilestoneSection extends StatelessWidget {
  const _AchievedMilestoneSection({required this.streak});

  final StreakSummary streak;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Latest Achievement',
          style: Theme.of(context).textTheme.titleMedium,
        ),
        const SizedBox(height: 10),
        LiteGlassCard(
          padding: const EdgeInsets.all(16),
          borderRadius: BorderRadius.circular(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(Icons.emoji_events_rounded, color: LogMyPlateColors.accent, size: 24),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      streak.achievedMilestoneTitle ?? 'Achievement unlocked',
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                streak.achievedMilestoneBody ?? 'Great job on your consistency!',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: colors.textSecondary,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
