
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
    } else {
      background = Positioned.fill(
        child: DecoratedBox(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: isDark
                  ? [
                      Colors.black,
                      Colors.black,
                    ]
                  : [
                      const Color(0xFFFDF5E6), // Subtle warm/amber tint
                      LogMyPlateColors.bgCream, // Fades to original background color
                    ],
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
