import 'package:flutter/material.dart';

import '../models/score_rating.dart';
import '../theme/logmyplate_theme.dart';

/// Five stars, of which [stars] are filled.
///
/// The entire row is one semantics node reading "3 of 5 stars". Screen readers
/// would otherwise announce five separate icons, which is both noisy and
/// meaningless — the rating is the row, not any single star.
class ScoreStarRow extends StatelessWidget {
  const ScoreStarRow({
    super.key,
    required this.stars,
    this.size = 20,
    this.color,
    this.semanticsPrefix,
  });

  final int stars;
  final double size;
  final Color? color;

  /// Prefixed to the announcement, e.g. "Today". Keeps the same widget honest
  /// on three different surfaces without three different semantics strings.
  final String? semanticsPrefix;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;
    final filled = color ?? colors.accentOn;
    final empty = colors.textTertiary.withValues(alpha: 0.35);
    final prefix = semanticsPrefix == null ? '' : '$semanticsPrefix: ';

    return Semantics(
      label: '$prefix$stars of 5 stars',
      child: ExcludeSemantics(
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: List.generate(5, (index) {
            final isFilled = index < stars;
            return Padding(
              padding: EdgeInsets.only(right: index == 4 ? 0 : size * 0.1),
              child: Icon(
                isFilled ? Icons.star_rounded : Icons.star_outline_rounded,
                size: size,
                color: isFilled ? filled : empty,
              ),
            );
          }),
        ),
      ),
    );
  }
}

/// Copy for the in-progress caveat on a daily rating.
///
/// A provisional day is not a verdict. Someone who has logged only breakfast
/// would otherwise read a low rating as a judgement on their day rather than on
/// the two items they have entered so far.
String? scoreProgressNote(ScoreRating rating, int mealsLogged) {
  if (!rating.provisional) return null;
  if (mealsLogged <= 0) return null;
  if (mealsLogged == 1) return 'Based on 1 meal so far — this updates as you log.';
  return 'Based on $mealsLogged meals so far — this updates as you log.';
}
