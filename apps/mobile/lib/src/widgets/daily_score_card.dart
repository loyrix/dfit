import 'package:flutter/material.dart';

import '../models/score_rating.dart';
import '../theme/logmyplate_spacing.dart';
import '../theme/logmyplate_theme.dart';
import 'plate_score_card.dart' show LiteGlassCardShim;
import 'score_star_row.dart';

/// The primary rating surface: how today is going, as stars.
///
/// This is the headline judgement, which is why it is the day and not a meal.
/// A single plate says very little on its own — a light breakfast is not a
/// failure — and putting one at the top of the screen invites people to read a
/// verdict into an ordinary meal.
///
/// There is no number anywhere on this card, by design. The 0-100 score exists
/// on the server for tuning and analytics; showing it would imply a precision
/// the underlying macro heuristic does not have.
class DailyScoreCard extends StatelessWidget {
  const DailyScoreCard({
    super.key,
    required this.rating,
    required this.mealsLogged,
    this.onTap,
  });

  final ScoreRating rating;

  /// Drives the in-progress caveat. A rating built from one meal has to say so.
  final int mealsLogged;

  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;
    final theme = Theme.of(context);
    final note = scoreProgressNote(rating, mealsLogged);

    final content = Padding(
      padding: const EdgeInsets.all(LogMyPlateSpacing.sectionSpacing),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  'Today',
                  style: theme.textTheme.labelLarge?.copyWith(
                    color: colors.textSecondary,
                    fontWeight: FontWeight.w600,
                    letterSpacing: 0.2,
                  ),
                ),
              ),
              if (onTap != null)
                Icon(
                  Icons.chevron_right_rounded,
                  size: 20,
                  color: colors.textTertiary,
                ),
            ],
          ),
          const SizedBox(height: LogMyPlateSpacing.itemSpacing),
          ScoreStarRow(
            key: const ValueKey('daily-score-stars'),
            stars: rating.stars,
            size: 28,
            semanticsPrefix: 'Today',
          ),
          const SizedBox(height: LogMyPlateSpacing.itemSpacing),
          Text(
            rating.message,
            key: const ValueKey('daily-score-message'),
            style: theme.textTheme.bodyMedium?.copyWith(
              color: colors.textPrimary,
              height: 1.35,
            ),
          ),
          if (note != null) ...[
            const SizedBox(height: 6),
            Text(
              note,
              key: const ValueKey('daily-score-progress-note'),
              style: theme.textTheme.bodySmall?.copyWith(
                color: colors.textTertiary,
              ),
            ),
          ],
        ],
      ),
    );

    return LiteGlassCardShim(
      child: onTap == null
          ? content
          : Material(
              type: MaterialType.transparency,
              child: InkWell(
                borderRadius: BorderRadius.circular(
                  LogMyPlateSpacing.heroCardBorderRadius,
                ),
                onTap: onTap,
                child: content,
              ),
            ),
    );
  }
}

/// The same rating, for a week.
///
/// Averages daily scores rather than meal scores, so neither one plate nor one
/// rough day defines the week. Days with nothing logged are excluded upstream
/// rather than scored zero — a gap in logging is not evidence of poor eating,
/// and this card must never imply otherwise.
class WeeklyScoreCard extends StatelessWidget {
  const WeeklyScoreCard({
    super.key,
    required this.rating,
    required this.trackedDays,
  });

  final ScoreRating rating;

  /// Days in the window with at least one meal. Named on the card so a
  /// four-star week built from two days is not mistaken for a full one.
  final int trackedDays;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;
    final theme = Theme.of(context);

    return LiteGlassCardShim(
      child: Padding(
        padding: const EdgeInsets.all(LogMyPlateSpacing.sectionSpacing),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'This week',
              style: theme.textTheme.labelLarge?.copyWith(
                color: colors.textSecondary,
                fontWeight: FontWeight.w600,
                letterSpacing: 0.2,
              ),
            ),
            const SizedBox(height: LogMyPlateSpacing.itemSpacing),
            ScoreStarRow(
              key: const ValueKey('weekly-score-stars'),
              stars: rating.stars,
              size: 28,
              semanticsPrefix: 'This week',
            ),
            const SizedBox(height: LogMyPlateSpacing.itemSpacing),
            Text(
              rating.message,
              key: const ValueKey('weekly-score-message'),
              style: theme.textTheme.bodyMedium?.copyWith(
                color: colors.textPrimary,
                height: 1.35,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              trackedDays == 1
                  ? 'From 1 day logged this week.'
                  : 'From $trackedDays days logged this week.',
              key: const ValueKey('weekly-score-tracked-days'),
              style: theme.textTheme.bodySmall?.copyWith(
                color: colors.textTertiary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
