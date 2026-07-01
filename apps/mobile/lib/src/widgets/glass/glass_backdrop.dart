
import 'package:flutter/material.dart';

import '../../models/captured_meal_photo.dart';
import '../../theme/logmyplate_colors.dart';

class GlassBackdrop extends StatelessWidget {
  const GlassBackdrop({
    super.key,
    required this.child,
    this.photo,
  });

  final Widget child;
  final CapturedMealPhoto? photo;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    Widget background;
    if (photo != null) {
      background = Positioned.fill(
        child: Image.memory(
          photo!.bytes,
          fit: BoxFit.cover,
        ),
      );
    } else if (isDark) {
      // Subtle vertical gradient from bgInk to a slightly lighter surface tone
      // so the dark backdrop has depth instead of a flat black wash.
      background = Positioned.fill(
        child: const DecoratedBox(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                LogMyPlateColors.bgInk,
                LogMyPlateColors.surfaceCardDark,
              ],
              stops: [0.35, 1],
            ),
          ),
        ),
      );
    } else {
      // Warm radial glow centered slightly above the meal photo area, fading to
      // the standard cream background — gives the light backdrop visual depth.
      background = Positioned.fill(
        child: const DecoratedBox(
          decoration: BoxDecoration(
            gradient: RadialGradient(
              center: Alignment(0, -0.35),
              radius: 1.1,
              colors: [
                Color(0xFFFDF5E6), // Warm center glow
                LogMyPlateColors.bgCream, // Fades to base background
              ],
              stops: [0, 0.85],
            ),
          ),
        ),
      );
    }

    return Stack(
      children: [
        background,
        Positioned.fill(child: child),
      ],
    );
  }
}
