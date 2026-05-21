import 'package:flutter/material.dart';

import '../theme/logmyplate_colors.dart';
import '../theme/logmyplate_theme.dart';

class LogMyPlateAmbientBackground extends StatelessWidget {
  const LogMyPlateAmbientBackground({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return DecoratedBox(
      decoration: BoxDecoration(
        color: colors.background,
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: isDark
              ? const [Color(0xFF111612), LogMyPlateColors.bgInk]
              : const [Color(0xFFFFFCF4), LogMyPlateColors.bgCream],
        ),
      ),
      child: child,
    );
  }
}
