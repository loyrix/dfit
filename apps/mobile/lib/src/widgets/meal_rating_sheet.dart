import 'package:flutter/material.dart';

import '../models/meal.dart';
import '../models/plate_score.dart';
import '../models/score_rating.dart';
import '../theme/logmyplate_spacing.dart';
import '../theme/logmyplate_theme.dart';
import 'macro_profile_card.dart';
import 'plate_score_copy.dart';
import 'score_star_row.dart';

/// Explains a meal's star rating.
///
/// Three questions, in the order people ask them: why this rating, what is
/// worth knowing, and what to try next time. There is no number anywhere, for
/// the same reason the rating is stars: the figures behind it are estimates.
///
/// A bottom sheet rather than a route, so it can open from a list row without
/// taking the user away from the list.
class MealRatingSheet extends StatelessWidget {
  const MealRatingSheet({super.key, required this.meal, required this.rating});

  final MealLog meal;
  final ScoreRating rating;

  /// Does nothing for a meal with no rating: there is nothing to explain.
  static Future<void> show(BuildContext context, {required MealLog meal}) {
    final rating = meal.rating;
    if (rating == null) return Future<void>.value();

    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => MealRatingSheet(meal: meal, rating: rating),
    );
  }

  /// Warnings that add something the rating reasons have not already said.
  ///
  /// A reason and a warning can describe the same thing ("High in sodium" and
  /// "Sodium looks high for one meal"). Saying it twice under two headings
  /// reads as two problems.
  List<PlateWarning> get _warnings {
    final covered = rating.reasons.map((reason) => reason.code).toSet();
    if (covered.contains('empty_calories')) covered.add('high_sugar');
    return (meal.plateScore?.warnings ?? const <PlateWarning>[])
        .where((warning) => !covered.contains(warning.code))
        .toList(growable: false);
  }

  /// The model's swaps when the meal has them, otherwise the app's own
  /// rule-based line, so a barcode or older meal is not left with nothing.
  List<String> get _suggestions {
    final swaps = meal.advice?.swaps ?? const <String>[];
    if (swaps.isNotEmpty) return swaps;
    final fallback = MacroProfileCard.suggestionFor(meal);
    return fallback == null ? const [] : [fallback];
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;
    final theme = Theme.of(context);
    final media = MediaQuery.of(context);
    final warnings = _warnings;
    final watchOuts = meal.advice?.watchOuts ?? const <String>[];
    final suggestions = _suggestions;

    return SafeArea(
      top: false,
      child: Container(
        margin: const EdgeInsets.all(LogMyPlateSpacing.itemSpacing),
        constraints: BoxConstraints(maxHeight: media.size.height * 0.85),
        decoration: BoxDecoration(
          color: colors.surfaceCard,
          borderRadius: BorderRadius.circular(
            LogMyPlateSpacing.heroCardBorderRadius,
          ),
        ),
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(LogMyPlateSpacing.sectionSpacing),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ScoreStarRow(
                key: const ValueKey('meal-rating-sheet-stars'),
                stars: rating.stars,
                size: 26,
                semanticsPrefix: 'This meal',
              ),
              const SizedBox(height: 10),
              Text(rating.message, style: theme.textTheme.titleMedium),
              if (rating.reasons.isNotEmpty) ...[
                const SizedBox(height: LogMyPlateSpacing.sectionSpacing),
                const _SectionTitle(text: 'WHY THIS RATING'),
                const SizedBox(height: 8),
                for (final reason in rating.reasons)
                  _Line(
                    icon: reason.good
                        ? Icons.check_rounded
                        : Icons.tune_rounded,
                    text: reason.text,
                  ),
              ],
              if (warnings.isNotEmpty || watchOuts.isNotEmpty) ...[
                const SizedBox(height: LogMyPlateSpacing.sectionSpacing),
                const _SectionTitle(text: 'WORTH KNOWING'),
                const SizedBox(height: 8),
                for (final warning in warnings)
                  _Line(
                    icon: Icons.info_outline_rounded,
                    text: warning.personalised
                        ? '${warning.text} Flagged because of your health focus.'
                        : warning.text,
                  ),
                for (final line in watchOuts)
                  _Line(icon: Icons.info_outline_rounded, text: line),
              ],
              if (suggestions.isNotEmpty) ...[
                const SizedBox(height: LogMyPlateSpacing.sectionSpacing),
                const _SectionTitle(text: 'TRY THIS NEXT TIME'),
                const SizedBox(height: 8),
                for (final line in suggestions)
                  _Line(icon: Icons.swap_horiz_rounded, text: line),
              ],
              const SizedBox(height: LogMyPlateSpacing.sectionSpacing),
              Text(
                PlateScoreCopy.disclaimer,
                style: theme.textTheme.labelSmall?.copyWith(
                  color: colors.textTertiary,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle({required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: Theme.of(context).textTheme.labelSmall?.copyWith(
        color: context.logmyplate.textSecondary,
        letterSpacing: 1.2,
      ),
    );
  }
}

class _Line extends StatelessWidget {
  const _Line({required this.icon, required this.text});

  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;

    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(top: 3),
            child: Icon(icon, size: 15, color: colors.textSecondary),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(text, style: Theme.of(context).textTheme.bodySmall),
          ),
        ],
      ),
    );
  }
}
