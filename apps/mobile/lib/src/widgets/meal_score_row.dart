import 'package:flutter/material.dart';

import '../models/score_rating.dart';
import '../theme/logmyplate_spacing.dart';
import '../theme/logmyplate_theme.dart';
import 'plate_score_card.dart' show LiteGlassCardShim;
import 'score_star_row.dart';

/// The per-meal rating, shown only after someone opens a specific meal.
///
/// Deliberately quieter than the daily card: smaller stars, no heading, one
/// line of copy. A single plate is supplementary detail, not the signal to act
/// on, and giving it the same visual weight as the day would undo the reason
/// the daily score is the primary surface at all.
class MealScoreRow extends StatelessWidget {
  const MealScoreRow({super.key, required this.rating, this.onTap});

  final ScoreRating rating;

  /// Opens the explanation behind the rating. The row is plain when absent.
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;
    final theme = Theme.of(context);

    final content = Padding(
      padding: const EdgeInsets.all(LogMyPlateSpacing.itemSpacing),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          ScoreStarRow(
            key: const ValueKey('meal-score-stars'),
            stars: rating.stars,
            size: 18,
            semanticsPrefix: 'This meal',
            // Still, on purpose. The meal rating is supporting detail reached
            // by tapping in; animating it would compete with the day.
            animate: false,
          ),
          const SizedBox(width: LogMyPlateSpacing.itemSpacing),
          Expanded(
            child: Text(
              rating.message,
              key: const ValueKey('meal-score-message'),
              style: theme.textTheme.bodySmall?.copyWith(
                color: colors.textSecondary,
                height: 1.3,
              ),
            ),
          ),
          if (onTap != null)
            Icon(Icons.chevron_right_rounded, color: colors.textSecondary),
        ],
      ),
    );

    return LiteGlassCardShim(
      child: onTap == null
          ? content
          : Semantics(
              button: true,
              hint: 'Shows why this meal got this rating',
              child: Material(
                type: MaterialType.transparency,
                child: InkWell(
                  key: const ValueKey('meal-score-open'),
                  onTap: onTap,
                  child: content,
                ),
              ),
            ),
    );
  }
}

/// The rating as a small tap target, for dense rows such as a meal list.
///
/// Stars only: the row already carries the meal's name and calories, and the
/// explanation is one tap away.
class MealStarsButton extends StatelessWidget {
  const MealStarsButton({super.key, required this.rating, this.onTap});

  final ScoreRating rating;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final stars = Padding(
      // Padded so the tap target is comfortably larger than the stars.
      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 6),
      child: ScoreStarRow(
        stars: rating.stars,
        size: 14,
        semanticsPrefix: 'This meal',
        animate: false,
      ),
    );

    if (onTap == null) {
      return stars;
    }

    return Semantics(
      button: true,
      hint: 'Shows why this meal got this rating',
      child: Material(
        type: MaterialType.transparency,
        child: InkWell(
          borderRadius: BorderRadius.circular(999),
          onTap: onTap,
          child: stars,
        ),
      ),
    );
  }
}
