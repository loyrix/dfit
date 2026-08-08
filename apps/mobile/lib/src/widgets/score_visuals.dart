import 'package:flutter/material.dart';

import '../theme/logmyplate_colors.dart';
import '../theme/logmyplate_theme.dart';

/// Visual language for the star rating.
///
/// The rating is the most emotionally loaded surface in the app — it is the app
/// telling someone how they ate. So the treatment is tiered rather than uniform:
/// a strong day is celebrated, a weak one is met with warmth rather than alarm.
///
/// **Why a poor rating is not red.** On real usage most days land at one or two
/// stars, so an alarm state would fire almost every day and the app would read
/// as scolding. A warm coral says "here's where to aim next" without implying
/// something is wrong with the person. Red is reserved for things that are
/// actually broken.
enum ScoreTone {
  /// 1–2 stars. Supportive, never alarming.
  needsWork,

  /// 3 stars. Calm and neutral — a fine day needs no decoration.
  steady,

  /// 4–5 stars. Worth celebrating.
  great,
}

ScoreTone scoreToneFor(int stars) {
  if (stars >= 4) return ScoreTone.great;
  if (stars == 3) return ScoreTone.steady;
  return ScoreTone.needsWork;
}

/// The palette for one tone, resolved for the current theme.
///
/// Both themes are defined explicitly rather than derived by lightening or
/// darkening one set: gold that reads rich on cream turns muddy on ink, and a
/// glow that reads as a soft halo on ink becomes dirty smudge on cream.
@immutable
class ScoreToneStyle {
  const ScoreToneStyle({
    required this.starGradient,
    required this.glow,
    required this.wash,
    required this.edge,
    required this.emptyStar,
    required this.accentText,
    required this.confetti,
  });

  /// Applied across the whole row of filled stars, so the gradient runs through
  /// the group rather than repeating identically in each one.
  final List<Color> starGradient;

  /// Halo behind the filled stars. Transparent for the calm tones.
  final Color glow;

  /// Very low-alpha background tint on the card.
  final Color wash;

  /// Border tint, a touch stronger than the wash.
  final Color edge;

  final Color emptyStar;

  /// For the small supporting label, when a tone has one.
  final Color accentText;

  final List<Color> confetti;

  static ScoreToneStyle of(BuildContext context, ScoreTone tone) {
    // Read from the app's own palette, not Theme.of(context).brightness --
    // MaterialApp reports light brightness even when handed the dark theme.
    final dark = LogMyPlateThemeColors.of(context).isDark;
    switch (tone) {
      case ScoreTone.great:
        return dark
            ? const ScoreToneStyle(
                // Brighter and more saturated than the light palette: on ink,
                // mid-gold loses its metallic read and flattens to brown.
                starGradient: [
                  Color(0xFFFFE9A8),
                  Color(0xFFF5C451),
                  Color(0xFFD79A2B),
                ],
                glow: Color(0x40F5C451),
                wash: Color(0x14F5C451),
                edge: Color(0x33F5C451),
                emptyStar: Color(0x24FFFFFF),
                accentText: Color(0xFFF5C451),
                confetti: [
                  Color(0xFFF5C451),
                  Color(0xFFFFE9A8),
                  Color(0xFF77C79D),
                  Color(0xFFFF9E8A),
                  Color(0xFFFFFFFF),
                ],
              )
            : const ScoreToneStyle(
                starGradient: [
                  Color(0xFFF7CE6B),
                  Color(0xFFE8B547),
                  Color(0xFFC08A2E),
                ],
                glow: Color(0x33E8B547),
                wash: Color(0x14E8B547),
                edge: Color(0x33D9A63C),
                emptyStar: Color(0x1F1A1F1C),
                accentText: LogMyPlateColors.accentWarm,
                confetti: [
                  Color(0xFFE8B547),
                  Color(0xFFF7CE6B),
                  Color(0xFF77C79D),
                  Color(0xFFFF8A7A),
                  Color(0xFFC08A2E),
                ],
              );

      case ScoreTone.steady:
        return dark
            ? const ScoreToneStyle(
                starGradient: [
                  Color(0xFFF2D79A),
                  Color(0xFFDCB765),
                  Color(0xFFBE9440),
                ],
                glow: Color(0x00000000),
                wash: Color(0x00000000),
                edge: Color(0x00000000),
                emptyStar: Color(0x24FFFFFF),
                accentText: Color(0xFFDCB765),
                confetti: [],
              )
            : const ScoreToneStyle(
                starGradient: [
                  Color(0xFFEFC97E),
                  Color(0xFFDDAE55),
                  Color(0xFFB98F3B),
                ],
                glow: Color(0x00000000),
                wash: Color(0x00000000),
                edge: Color(0x00000000),
                emptyStar: Color(0x1F1A1F1C),
                accentText: LogMyPlateColors.accentWarm,
                confetti: [],
              );

      case ScoreTone.needsWork:
        return dark
            ? const ScoreToneStyle(
                // Warm coral, not red. This is guidance, not a failure state.
                starGradient: [
                  Color(0xFFFFC2A8),
                  Color(0xFFFF9E8A),
                  Color(0xFFE0705C),
                ],
                glow: Color(0x00000000),
                wash: Color(0x12FF9E8A),
                edge: Color(0x2BFF9E8A),
                emptyStar: Color(0x24FFFFFF),
                accentText: Color(0xFFFFAE99),
                confetti: [],
              )
            : const ScoreToneStyle(
                starGradient: [
                  Color(0xFFFFB49E),
                  Color(0xFFF58A72),
                  Color(0xFFD2654F),
                ],
                glow: Color(0x00000000),
                wash: Color(0x12FF8A7A),
                edge: Color(0x2BE07A66),
                emptyStar: Color(0x1F1A1F1C),
                accentText: Color(0xFFB4523C),
                confetti: [],
              );
    }
  }
}
