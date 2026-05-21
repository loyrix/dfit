import 'package:flutter/material.dart';

import 'logmyplate_colors.dart';
import 'logmyplate_theme.dart';

class LogMyPlateHeroSurfaceStyle {
  const LogMyPlateHeroSurfaceStyle({
    required this.isDark,
    required this.textPrimary,
    required this.textSecondary,
    required this.accentText,
    required this.border,
    required this.track,
    required this.ringLine,
    required this.chipFill,
    required this.chipBorder,
    required this.gradientColors,
    required this.shadowColor,
  });

  final bool isDark;
  final Color textPrimary;
  final Color textSecondary;
  final Color accentText;
  final Color border;
  final Color track;
  final Color ringLine;
  final Color chipFill;
  final Color chipBorder;
  final List<Color> gradientColors;
  final Color shadowColor;

  static LogMyPlateHeroSurfaceStyle of(BuildContext context) {
    final colors = context.logmyplate;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    if (isDark) {
      return LogMyPlateHeroSurfaceStyle(
        isDark: true,
        textPrimary: Colors.white,
        textSecondary: Colors.white.withValues(alpha: 0.58),
        accentText: LogMyPlateColors.accent,
        border: Colors.white.withValues(alpha: 0.08),
        track: Colors.white.withValues(alpha: 0.10),
        ringLine: LogMyPlateColors.accent.withValues(alpha: 0.14),
        chipFill: LogMyPlateColors.accent.withValues(alpha: 0.12),
        chipBorder: LogMyPlateColors.accent.withValues(alpha: 0.24),
        gradientColors: const [Color(0xFF18211C), Color(0xFF101412)],
        shadowColor: Colors.black.withValues(alpha: 0.24),
      );
    }

    return LogMyPlateHeroSurfaceStyle(
      isDark: false,
      textPrimary: colors.textPrimary,
      textSecondary: colors.textSecondary,
      accentText: LogMyPlateColors.accentWarm,
      border: LogMyPlateColors.accent.withValues(alpha: 0.22),
      track: colors.textPrimary.withValues(alpha: 0.08),
      ringLine: LogMyPlateColors.accent.withValues(alpha: 0.16),
      chipFill: LogMyPlateColors.accent.withValues(alpha: 0.11),
      chipBorder: LogMyPlateColors.accent.withValues(alpha: 0.24),
      gradientColors: const [Color(0xFFFFFCF4), Color(0xFFF7F0DF)],
      shadowColor: LogMyPlateColors.accentDeep.withValues(alpha: 0.08),
    );
  }

  BoxDecoration decoration({double radius = 22}) {
    return BoxDecoration(
      borderRadius: BorderRadius.circular(radius),
      border: Border.all(color: border, width: 0.7),
      gradient: LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: gradientColors,
      ),
      boxShadow: [
        BoxShadow(
          color: shadowColor,
          blurRadius: isDark ? 30 : 24,
          offset: Offset(0, isDark ? 16 : 12),
        ),
      ],
    );
  }
}
