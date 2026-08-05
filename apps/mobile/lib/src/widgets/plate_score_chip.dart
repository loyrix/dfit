import 'package:flutter/material.dart';

import '../models/plate_score.dart';
import '../theme/logmyplate_colors.dart';

/// Presentation for a Plate Score band.
///
/// Colours reuse the existing palette rather than introducing new ones, so the
/// score reads as part of the app instead of a bolted-on widget.
class PlateScoreBandStyle {
  const PlateScoreBandStyle({
    required this.foreground,
    required this.background,
    required this.label,
  });

  final Color foreground;
  final Color background;
  final String label;

  static PlateScoreBandStyle of(PlateScoreBand band) => switch (band) {
    PlateScoreBand.excellent => const PlateScoreBandStyle(
      foreground: Color(0xFF2F7D57),
      background: Color(0xFFDDF0E6),
      label: 'Well balanced',
    ),
    PlateScoreBand.good => const PlateScoreBandStyle(
      foreground: Color(0xFF4B7A3F),
      background: Color(0xFFE6F0DC),
      label: 'Good balance',
    ),
    PlateScoreBand.moderate => const PlateScoreBandStyle(
      foreground: LogMyPlateColors.accentWarm,
      background: Color(0xFFFAEDC0),
      label: 'Room to improve',
    ),
    PlateScoreBand.heavy => const PlateScoreBandStyle(
      foreground: LogMyPlateColors.destructiveDeep,
      background: Color(0xFFF7DEDE),
      label: 'Unbalanced',
    ),
  };
}

/// Compact score pill used in dense rows such as the Today meal list.
///
/// Shows the number only. The meal row already carries calories and macros, so
/// adding a word here would crowd it; the colour conveys the band.
class PlateScoreChip extends StatelessWidget {
  const PlateScoreChip({
    super.key,
    required this.score,
    this.compact = true,
    this.onTap,
  });

  final PlateScore score;
  final bool compact;

  /// When supplied the chip becomes its own tap target, so the score can be
  /// explained without first navigating somewhere else.
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final style = PlateScoreBandStyle.of(score.band);

    final chip = Container(
      padding: EdgeInsets.symmetric(
        horizontal: compact ? 8 : 10,
        vertical: compact ? 3 : 5,
      ),
      decoration: BoxDecoration(
        color: style.background,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            '${score.score}',
            style: Theme.of(context).textTheme.labelMedium?.copyWith(
              color: style.foreground,
              fontWeight: FontWeight.w700,
              fontFeatures: const [FontFeature.tabularFigures()],
            ),
          ),
          if (!compact) ...[
            const SizedBox(width: 6),
            Text(
              style.label,
              style: Theme.of(
                context,
              ).textTheme.labelSmall?.copyWith(color: style.foreground),
            ),
          ],
        ],
      ),
    );

    // Screen readers would otherwise announce a bare number with no meaning.
    return Semantics(
      button: onTap != null,
      label: 'Plate score ${score.score} out of 100, ${style.label}',
      child: ExcludeSemantics(
        child: onTap == null
            ? chip
            : Material(
                type: MaterialType.transparency,
                child: InkWell(
                  borderRadius: BorderRadius.circular(999),
                  onTap: onTap,
                  child: chip,
                ),
              ),
      ),
    );
  }
}

/// Small circular indicator for very dense contexts, such as a weekly day row.
class PlateScoreDot extends StatelessWidget {
  const PlateScoreDot({
    super.key,
    required this.band,
    this.size = 8,
    this.score,
  });

  final PlateScoreBand band;
  final double size;

  /// Included in the screen-reader label when known.
  final int? score;

  @override
  Widget build(BuildContext context) {
    // Colour alone carries no meaning for colourblind or screen-reader users,
    // so the dot always announces the band in words.
    return Semantics(
      label: score == null
          ? 'Plate score: ${PlateScoreBandStyle.of(band).label}'
          : 'Plate score $score out of 100, ${PlateScoreBandStyle.of(band).label}',
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          color: PlateScoreBandStyle.of(band).foreground,
          shape: BoxShape.circle,
        ),
      ),
    );
  }
}
