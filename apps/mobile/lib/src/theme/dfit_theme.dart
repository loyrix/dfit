import 'package:flutter/material.dart';

import 'dfit_colors.dart';

class DFitTheme {
  const DFitTheme._();

  static ThemeData light() {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      scaffoldBackgroundColor: DFitColors.bgCream,
      colorScheme: ColorScheme.fromSeed(
        seedColor: DFitColors.accent,
        brightness: Brightness.light,
        surface: DFitColors.bgCream,
      ),
      fontFamily: 'SF Pro Text',
      textTheme: _textTheme(DFitColors.textPrimaryLight),
      iconTheme: const IconThemeData(color: DFitColors.textPrimaryLight),
      iconButtonTheme: _iconButtonTheme(DFitColors.textPrimaryLight),
      extensions: <ThemeExtension<dynamic>>[DFitThemeColors.light()],
    );
  }

  static ThemeData dark() {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: DFitColors.bgInk,
      colorScheme: ColorScheme.fromSeed(
        seedColor: DFitColors.accent,
        brightness: Brightness.dark,
        surface: DFitColors.bgInk,
      ),
      fontFamily: 'SF Pro Text',
      textTheme: _textTheme(Colors.white),
      iconTheme: const IconThemeData(color: Colors.white),
      iconButtonTheme: _iconButtonTheme(Colors.white),
      extensions: <ThemeExtension<dynamic>>[DFitThemeColors.dark()],
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
class DFitThemeColors extends ThemeExtension<DFitThemeColors> {
  const DFitThemeColors({
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

  static DFitThemeColors light() {
    return DFitThemeColors(
      background: DFitColors.bgCream,
      surfaceCard: DFitColors.surfaceCard,
      surfaceHero: DFitColors.surfaceHero,
      border: DFitColors.borderLight,
      textPrimary: DFitColors.textPrimaryLight,
      textSecondary: DFitColors.textSecondaryLight,
      textTertiary: DFitColors.textTertiaryLight,
      icon: DFitColors.textPrimaryLight,
      accent: DFitColors.accent,
      accentOn: DFitColors.accentDeep,
      accentText: DFitColors.accentWarm,
      primaryAction: DFitColors.textPrimaryLight,
      primaryActionText: Colors.white,
      mutedFill: DFitColors.textPrimaryLight.withValues(alpha: 0.06),
    );
  }

  static DFitThemeColors dark() {
    return DFitThemeColors(
      background: DFitColors.bgInk,
      surfaceCard: DFitColors.surfaceCardDark,
      surfaceHero: DFitColors.surfaceHero,
      border: Colors.white.withValues(alpha: 0.08),
      textPrimary: Colors.white,
      textSecondary: Colors.white.withValues(alpha: 0.58),
      textTertiary: Colors.white.withValues(alpha: 0.36),
      icon: Colors.white,
      accent: DFitColors.accent,
      accentOn: DFitColors.accentDeep,
      accentText: DFitColors.accent,
      primaryAction: DFitColors.accent,
      primaryActionText: DFitColors.accentDeep,
      mutedFill: Colors.white.withValues(alpha: 0.08),
    );
  }

  static DFitThemeColors of(BuildContext context) {
    return Theme.of(context).extension<DFitThemeColors>() ??
        (Theme.of(context).brightness == Brightness.dark
            ? DFitThemeColors.dark()
            : DFitThemeColors.light());
  }

  @override
  DFitThemeColors copyWith({
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
    return DFitThemeColors(
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
  DFitThemeColors lerp(ThemeExtension<DFitThemeColors>? other, double t) {
    if (other is! DFitThemeColors) return this;

    return DFitThemeColors(
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

extension DFitThemeContext on BuildContext {
  DFitThemeColors get dfit => DFitThemeColors.of(this);
}
