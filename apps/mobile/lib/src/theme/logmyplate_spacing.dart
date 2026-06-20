import 'package:flutter/material.dart';

class LogMyPlateSpacing {
  const LogMyPlateSpacing._();

  /// Standard internal padding for cards and sections
  static const double cardPadding = 14.0;

  /// Standard padding for list screens
  static const EdgeInsets screenPadding = EdgeInsets.fromLTRB(16, 12, 16, 28);

  /// Standard spacing between major vertical sections
  static const double sectionSpacing = 16.0;

  /// Standard spacing between items within a section
  static const double itemSpacing = 12.0;

  /// Extra small spacing for tight clusters
  static const double xsSpacing = 4.0;
  
  /// Small spacing 
  static const double smSpacing = 8.0;

  /// Standard border radius for typical cards
  static const double cardBorderRadius = 16.0;

  /// Slightly larger border radius for hero/featured cards
  static const double heroCardBorderRadius = 18.0;

  /// Border radius for smaller interactive elements like dropdowns
  static const double elementBorderRadius = 14.0;
}
