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
  const MealScoreRow({super.key, required this.rating});

  final ScoreRating rating;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;
    final theme = Theme.of(context);

    return LiteGlassCardShim(
      child: Padding(
        padding: const EdgeInsets.all(LogMyPlateSpacing.itemSpacing),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            ScoreStarRow(
              key: const ValueKey('meal-score-stars'),
              stars: rating.stars,
              size: 18,
              semanticsPrefix: 'This meal',
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
          ],
        ),
      ),
    );
  }
}
