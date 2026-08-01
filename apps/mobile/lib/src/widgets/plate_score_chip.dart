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
      label: 'Excellent',
    ),
    PlateScoreBand.good => const PlateScoreBandStyle(
      foreground: Color(0xFF4B7A3F),
      background: Color(0xFFE6F0DC),
      label: 'Good',
    ),
    PlateScoreBand.moderate => const PlateScoreBandStyle(
      foreground: LogMyPlateColors.accentWarm,
      background: Color(0xFFFAEDC0),
      label: 'Moderate',
    ),
    PlateScoreBand.heavy => const PlateScoreBandStyle(
      foreground: LogMyPlateColors.destructiveDeep,
      background: Color(0xFFF7DEDE),
      label: 'Heavy',
    ),
  };
}

/// Compact score pill used in dense rows such as the Today meal list.
///
/// Shows the number only. The meal row already carries calories and macros, so
/// adding a word here would crowd it; the colour conveys the band.
class PlateScoreChip extends StatelessWidget {
  const PlateScoreChip({super.key, required this.score, this.compact = true});

  final PlateScore score;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final style = PlateScoreBandStyle.of(score.band);

    return Container(
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
  }
}

/// Small circular indicator for very dense contexts, such as a weekly day row.
class PlateScoreDot extends StatelessWidget {
  const PlateScoreDot({super.key, required this.band, this.size = 8});

  final PlateScoreBand band;
  final double size;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: PlateScoreBandStyle.of(band).foreground,
        shape: BoxShape.circle,
      ),
    );
  }
}
