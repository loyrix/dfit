import 'package:flutter/material.dart';

import '../models/score_rating.dart';
import '../theme/logmyplate_spacing.dart';
import '../theme/logmyplate_theme.dart';
import 'score_celebration.dart';
import 'score_star_row.dart';
import 'score_visuals.dart';

/// Shared shell so the daily and weekly cards carry identical tone treatment.
///
/// The tint and border are drawn from the tone rather than the theme: a strong
/// rating should feel warmer than the surface around it, and a weak one should
/// feel different without feeling like an error.
class _ToneCard extends StatelessWidget {
  const _ToneCard({required this.style, required this.child, this.onTap});

  final ScoreToneStyle style;
  final Widget child;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;
    final radius = BorderRadius.circular(
      LogMyPlateSpacing.heroCardBorderRadius,
    );

    return DecoratedBox(
      decoration: BoxDecoration(
        // The wash sits over the normal card surface, never replaces it, so the
        // card still belongs to the screen it is on.
        color: colors.surfaceCard,
        borderRadius: radius,
        border: Border.all(
          color: style.edge == const Color(0x00000000)
              ? colors.border
              : style.edge,
        ),
      ),
      child: DecoratedBox(
        decoration: BoxDecoration(color: style.wash, borderRadius: radius),
        child: ClipRRect(
          borderRadius: radius,
          child: onTap == null
              ? child
              : Material(
                  type: MaterialType.transparency,
                  child: InkWell(
                    borderRadius: radius,
                    onTap: onTap,
                    child: child,
                  ),
                ),
        ),
      ),
    );
  }
}

/// The primary rating surface: how today is going, as stars.
///
/// This is the headline judgement, which is why it is the day and not a meal.
/// A single plate says very little on its own — a light breakfast is not a
/// failure — and putting one at the top of the screen invites people to read a
/// verdict into an ordinary meal.
///
/// There is no number anywhere on this card, by design. The 0–100 score exists
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
    final tone = scoreToneFor(rating.stars);
    final style = ScoreToneStyle.of(context, tone);
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
              if (tone == ScoreTone.great)
                _ToneBadge(
                  key: const ValueKey('daily-score-badge'),
                  label: rating.stars == 5 ? 'Excellent' : 'On track',
                  style: style,
                ),
              if (onTap != null) ...[
                const SizedBox(width: 4),
                Icon(
                  Icons.chevron_right_rounded,
                  size: 20,
                  color: colors.textTertiary,
                ),
              ],
            ],
          ),
          const SizedBox(height: LogMyPlateSpacing.itemSpacing),
          ScoreStarRow(
            key: const ValueKey('daily-score-stars'),
            stars: rating.stars,
            size: 30,
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

    return ScoreCelebration(
      tone: tone,
      // Keyed on the rating itself so the burst fires when the day genuinely
      // reaches four stars, not every time the home screen rebuilds.
      trigger: '${rating.level.name}-${rating.stars}-$mealsLogged',
      child: _ToneCard(style: style, onTap: onTap, child: content),
    );
  }
}

/// Small pill naming the tone in words.
///
/// The stars carry the signal, but a count alone is easy to misread at a
/// glance; a word removes the ambiguity without adding a number.
class _ToneBadge extends StatelessWidget {
  const _ToneBadge({super.key, required this.label, required this.style});

  final String label;
  final ScoreToneStyle style;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3),
      decoration: BoxDecoration(
        color: style.wash,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: style.edge),
      ),
      child: Text(
        label,
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
          color: style.accentText,
          fontWeight: FontWeight.w700,
          letterSpacing: 0.3,
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
    final tone = scoreToneFor(rating.stars);
    final style = ScoreToneStyle.of(context, tone);

    final content = Padding(
      padding: const EdgeInsets.all(LogMyPlateSpacing.sectionSpacing),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  'This week',
                  style: theme.textTheme.labelLarge?.copyWith(
                    color: colors.textSecondary,
                    fontWeight: FontWeight.w600,
                    letterSpacing: 0.2,
                  ),
                ),
              ),
              if (tone == ScoreTone.great)
                _ToneBadge(
                  key: const ValueKey('weekly-score-badge'),
                  label: rating.stars == 5 ? 'Excellent' : 'Strong',
                  style: style,
                ),
            ],
          ),
          const SizedBox(height: LogMyPlateSpacing.itemSpacing),
          ScoreStarRow(
            key: const ValueKey('weekly-score-stars'),
            stars: rating.stars,
            size: 30,
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
    );

    return ScoreCelebration(
      tone: tone,
      trigger: 'weekly-${rating.stars}-$trackedDays',
      child: _ToneCard(style: style, child: content),
    );
  }
}
