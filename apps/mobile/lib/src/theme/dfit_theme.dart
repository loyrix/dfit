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
    );
  }

  static TextTheme _textTheme(Color color) {
    return TextTheme(
      displayLarge: TextStyle(
        color: color,
        fontSize: 32,
        fontWeight: FontWeight.w500,
        letterSpacing: -1.2,
        height: 1,
      ),
      headlineMedium: TextStyle(
        color: color,
        fontSize: 28,
        fontWeight: FontWeight.w500,
        letterSpacing: -0.8,
        height: 1,
      ),
      titleLarge: TextStyle(
        color: color,
        fontSize: 22,
        fontWeight: FontWeight.w500,
        letterSpacing: -0.2,
      ),
      titleMedium: TextStyle(
        color: color,
        fontSize: 16,
        fontWeight: FontWeight.w500,
      ),
      bodyMedium: TextStyle(
        color: color,
        fontSize: 13,
        fontWeight: FontWeight.w400,
      ),
      bodySmall: TextStyle(
        color: color,
        fontSize: 12,
        fontWeight: FontWeight.w400,
      ),
      labelSmall: TextStyle(
        color: color,
        fontSize: 10,
        letterSpacing: 1.2,
        fontWeight: FontWeight.w500,
      ),
    );
  }
}
