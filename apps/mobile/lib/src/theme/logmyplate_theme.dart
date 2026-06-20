import 'package:flutter/material.dart';

import 'glass_theme.dart';
import 'logmyplate_colors.dart';

class LogMyPlateTheme {
  const LogMyPlateTheme._();

  static ThemeData light() {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      scaffoldBackgroundColor: LogMyPlateColors.bgCream,
      colorScheme: ColorScheme.fromSeed(
        seedColor: LogMyPlateColors.accent,
        brightness: Brightness.light,
        surface: LogMyPlateColors.bgCream,
      ),
      fontFamily: 'SF Pro Text',
      textTheme: _textTheme(LogMyPlateColors.textPrimaryLight),
      iconTheme: const IconThemeData(color: LogMyPlateColors.textPrimaryLight),
      iconButtonTheme: _iconButtonTheme(LogMyPlateColors.textPrimaryLight),
      extensions: <ThemeExtension<dynamic>>[LogMyPlateThemeColors.light(), GlassTheme.light()],
    );
  }

  static ThemeData dark() {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: LogMyPlateColors.bgInk,
      colorScheme: ColorScheme.fromSeed(
        seedColor: LogMyPlateColors.accent,
        brightness: Brightness.dark,
        surface: LogMyPlateColors.bgInk,
      ),
      fontFamily: 'SF Pro Text',
      textTheme: _textTheme(Colors.white),
      iconTheme: const IconThemeData(color: Colors.white),
      iconButtonTheme: _iconButtonTheme(Colors.white),
      extensions: <ThemeExtension<dynamic>>[LogMyPlateThemeColors.dark(), GlassTheme.dark()],
    );
  }

  static IconButtonThemeData _iconButtonTheme(Color color) {
    return IconButtonThemeData(
      style: IconButton.styleFrom(foregroundColor: color),
    );
  }

  static TextTheme _textTheme(Color color) {
    return TextTheme(
      displayLarge: TextStyle(
        color: color,
        fontSize: 34,
        fontWeight: FontWeight.w500,
        letterSpacing: 0,
        height: 1,
      ),
      headlineMedium: TextStyle(
        color: color,
        fontSize: 30,
        fontWeight: FontWeight.w500,
        letterSpacing: 0,
        height: 1,
      ),
      titleLarge: TextStyle(
        color: color,
        fontSize: 24,
        fontWeight: FontWeight.w500,
        letterSpacing: 0,
      ),
      titleMedium: TextStyle(
        color: color,
        fontSize: 18,
        fontWeight: FontWeight.w500,
      ),
      bodyMedium: TextStyle(
        color: color,
        fontSize: 16,
        fontWeight: FontWeight.w400,
      ),
      bodySmall: TextStyle(
        color: color,
        fontSize: 14,
        fontWeight: FontWeight.w400,
      ),
      labelSmall: TextStyle(
        color: color,
        fontSize: 12,
        letterSpacing: 0,
        fontWeight: FontWeight.w500,
      ),
    );
  }
}

@immutable
class LogMyPlateThemeColors extends ThemeExtension<LogMyPlateThemeColors> {
  const LogMyPlateThemeColors({
    required this.background,
    required this.surfaceCard,
    required this.surfaceHero,
    required this.border,
    required this.textPrimary,
    required this.textSecondary,
    required this.textTertiary,
    required this.icon,
    required this.accent,
    required this.accentOn,
    required this.accentText,
    required this.primaryAction,
    required this.primaryActionText,
    required this.mutedFill,
  });

  final Color background;
  final Color surfaceCard;
  final Color surfaceHero;
  final Color border;
  final Color textPrimary;
  final Color textSecondary;
  final Color textTertiary;
  final Color icon;
  final Color accent;
  final Color accentOn;
  final Color accentText;
  final Color primaryAction;
  final Color primaryActionText;
  final Color mutedFill;

  static LogMyPlateThemeColors light() {
    return LogMyPlateThemeColors(
      background: LogMyPlateColors.bgCream,
      surfaceCard: LogMyPlateColors.surfaceCard,
      surfaceHero: LogMyPlateColors.surfaceHero,
      border: LogMyPlateColors.borderLight,
      textPrimary: LogMyPlateColors.textPrimaryLight,
      textSecondary: LogMyPlateColors.textSecondaryLight,
      textTertiary: LogMyPlateColors.textTertiaryLight,
      icon: LogMyPlateColors.textPrimaryLight,
      accent: LogMyPlateColors.accent,
      accentOn: LogMyPlateColors.accentDeep,
      accentText: LogMyPlateColors.accentWarm,
      primaryAction: LogMyPlateColors.textPrimaryLight,
      primaryActionText: Colors.white,
      mutedFill: LogMyPlateColors.textPrimaryLight.withValues(alpha: 0.06),
    );
  }

  static LogMyPlateThemeColors dark() {
    return LogMyPlateThemeColors(
      background: LogMyPlateColors.bgInk,
      surfaceCard: LogMyPlateColors.surfaceCardDark,
      surfaceHero: LogMyPlateColors.surfaceHero,
      border: Colors.white.withValues(alpha: 0.08),
      textPrimary: Colors.white,
      textSecondary: Colors.white.withValues(alpha: 0.58),
      textTertiary: Colors.white.withValues(alpha: 0.36),
      icon: Colors.white,
      accent: LogMyPlateColors.accent,
      accentOn: LogMyPlateColors.accentDeep,
      accentText: LogMyPlateColors.accent,
      primaryAction: LogMyPlateColors.accent,
      primaryActionText: LogMyPlateColors.accentDeep,
      mutedFill: Colors.white.withValues(alpha: 0.08),
    );
  }

  static LogMyPlateThemeColors of(BuildContext context) {
    return Theme.of(context).extension<LogMyPlateThemeColors>() ??
        (Theme.of(context).brightness == Brightness.dark
            ? LogMyPlateThemeColors.dark()
            : LogMyPlateThemeColors.light());
  }

  @override
  LogMyPlateThemeColors copyWith({
    Color? background,
    Color? surfaceCard,
    Color? surfaceHero,
    Color? border,
    Color? textPrimary,
    Color? textSecondary,
    Color? textTertiary,
    Color? icon,
    Color? accent,
    Color? accentOn,
    Color? accentText,
    Color? primaryAction,
    Color? primaryActionText,
    Color? mutedFill,
  }) {
    return LogMyPlateThemeColors(
      background: background ?? this.background,
      surfaceCard: surfaceCard ?? this.surfaceCard,
      surfaceHero: surfaceHero ?? this.surfaceHero,
      border: border ?? this.border,
      textPrimary: textPrimary ?? this.textPrimary,
      textSecondary: textSecondary ?? this.textSecondary,
      textTertiary: textTertiary ?? this.textTertiary,
      icon: icon ?? this.icon,
      accent: accent ?? this.accent,
      accentOn: accentOn ?? this.accentOn,
      accentText: accentText ?? this.accentText,
      primaryAction: primaryAction ?? this.primaryAction,
      primaryActionText: primaryActionText ?? this.primaryActionText,
      mutedFill: mutedFill ?? this.mutedFill,
    );
  }

  @override
  LogMyPlateThemeColors lerp(
    ThemeExtension<LogMyPlateThemeColors>? other,
    double t,
  ) {
    if (other is! LogMyPlateThemeColors) return this;

    return LogMyPlateThemeColors(
      background: Color.lerp(background, other.background, t)!,
      surfaceCard: Color.lerp(surfaceCard, other.surfaceCard, t)!,
      surfaceHero: Color.lerp(surfaceHero, other.surfaceHero, t)!,
      border: Color.lerp(border, other.border, t)!,
      textPrimary: Color.lerp(textPrimary, other.textPrimary, t)!,
      textSecondary: Color.lerp(textSecondary, other.textSecondary, t)!,
      textTertiary: Color.lerp(textTertiary, other.textTertiary, t)!,
      icon: Color.lerp(icon, other.icon, t)!,
      accent: Color.lerp(accent, other.accent, t)!,
      accentOn: Color.lerp(accentOn, other.accentOn, t)!,
      accentText: Color.lerp(accentText, other.accentText, t)!,
      primaryAction: Color.lerp(primaryAction, other.primaryAction, t)!,
      primaryActionText: Color.lerp(
        primaryActionText,
        other.primaryActionText,
        t,
      )!,
      mutedFill: Color.lerp(mutedFill, other.mutedFill, t)!,
    );
  }
}

extension LogMyPlateThemeContext on BuildContext {
  LogMyPlateThemeColors get logmyplate => LogMyPlateThemeColors.of(this);
}
