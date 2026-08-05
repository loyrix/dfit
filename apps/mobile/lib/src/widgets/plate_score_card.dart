import 'package:flutter/material.dart';

import '../models/plate_score.dart';
import '../theme/logmyplate_spacing.dart';
import '../theme/logmyplate_theme.dart';
import 'plate_score_chip.dart';
import 'plate_score_copy.dart';
import 'plate_score_sheet.dart';

/// The Plate Score summary shown on the review and meal detail screens.
///
/// One widget for both so the score reads identically before and after saving.
/// It always shows the verdict in words and the scale, because a bare number
/// leaves people guessing what it is out of and whether it is good.
class PlateScoreCard extends StatelessWidget {
  const PlateScoreCard({
    super.key,
    required this.score,
    this.advice,
    this.mealLabel = PlateScoreMealLabel.fallback,
    this.showMealTypeNote = false,
    this.onPersonalise,
  });

  final PlateScore score;
  final MealAdvice? advice;
  final PlateScoreMealLabel mealLabel;
  final bool showMealTypeNote;
  final VoidCallback? onPersonalise;

  void _openSheet(BuildContext context) {
    PlateScoreSheet.show(
      context,
      score: score,
      advice: advice,
      mealLabel: mealLabel,
      showMealTypeNote: showMealTypeNote,
      onPersonalise: onPersonalise == null
          ? null
          : () {
              Navigator.of(context).pop();
              onPersonalise!();
            },
    );
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;
    final style = PlateScoreBandStyle.of(score.band);

    return LiteGlassCardShim(
      child: Material(
        type: MaterialType.transparency,
        child: InkWell(
          borderRadius: BorderRadius.circular(
            LogMyPlateSpacing.heroCardBorderRadius,
          ),
          onTap: () => _openSheet(context),
          child: Padding(
            padding: const EdgeInsets.all(LogMyPlateSpacing.itemSpacing),
            child: Row(
              children: [
                Semantics(
                  label:
                      'Plate score ${score.score} out of 100, '
                      '${PlateScoreCopy.bandTitle(score.band)}',
                  child: ExcludeSemantics(
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.baseline,
                      textBaseline: TextBaseline.alphabetic,
                      children: [
                        Text(
                          '${score.score}',
                          key: const ValueKey('plate-score-value'),
                          style: Theme.of(context).textTheme.headlineSmall
                              ?.copyWith(
                                color: style.foreground,
                                fontWeight: FontWeight.w700,
                                fontFeatures: const [
                                  FontFeature.tabularFigures(),
                                ],
                              ),
                        ),
                        Text(
                          '/100',
                          style: Theme.of(context).textTheme.labelSmall
                              ?.copyWith(color: colors.textTertiary),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        PlateScoreCopy.bandTitle(score.band),
                        style: Theme.of(context).textTheme.titleSmall,
                      ),
                      const SizedBox(height: 2),
                      Text(
                        PlateScoreCopy.tierHint(score),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: Theme.of(context).textTheme.labelSmall?.copyWith(
                          color: colors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
                Icon(Icons.chevron_right_rounded, color: colors.textSecondary),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// Thin wrapper so the card can sit on both the glass review surface and the
/// plain meal detail surface without either screen owning the decoration.
class LiteGlassCardShim extends StatelessWidget {
  const LiteGlassCardShim({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;

    return Container(
      decoration: BoxDecoration(
        color: colors.surfaceCard,
        border: Border.all(color: colors.border),
        borderRadius: BorderRadius.circular(
          LogMyPlateSpacing.heroCardBorderRadius,
        ),
      ),
      clipBehavior: Clip.antiAlias,
      child: child,
    );
  }
}
