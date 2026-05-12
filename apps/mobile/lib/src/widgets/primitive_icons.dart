import 'package:flutter/material.dart';

import '../theme/dfit_colors.dart';
import '../theme/dfit_theme.dart';

Color dfitPrimitiveIconColor(BuildContext context, Color? color) {
  if (color != null) return color;
  return IconTheme.of(context).color ?? context.dfit.icon;
}

class PrimitiveCameraIcon extends StatelessWidget {
  const PrimitiveCameraIcon({
    super.key,
    this.color = DFitColors.accent,
    this.size = 24,
  });

  final Color color;
  final double size;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size * 0.72,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Positioned.fill(
            top: size * 0.16,
            child: DecoratedBox(
              decoration: BoxDecoration(
                border: Border.all(color: color, width: 1.6),
                borderRadius: BorderRadius.circular(3),
              ),
            ),
          ),
          Positioned(
            top: 0,
            left: size * 0.28,
            right: size * 0.28,
            child: Container(
              height: 3,
              decoration: BoxDecoration(
                color: color,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          Center(
            child: Container(
              width: size * 0.34,
              height: size * 0.34,
              decoration: BoxDecoration(
                border: Border.all(color: color, width: 1.3),
                shape: BoxShape.circle,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class PrimitiveGearIcon extends StatelessWidget {
  const PrimitiveGearIcon({super.key, this.color});

  final Color? color;

  @override
  Widget build(BuildContext context) {
    final resolvedColor = dfitPrimitiveIconColor(context, color);

    return SizedBox(
      width: 20,
      height: 20,
      child: Stack(
        alignment: Alignment.center,
        children: [
          Container(
            width: 18,
            height: 18,
            decoration: BoxDecoration(
              border: Border.all(color: resolvedColor, width: 1.5),
              shape: BoxShape.circle,
            ),
          ),
          Container(
            width: 6,
            height: 6,
            decoration: BoxDecoration(
              color: resolvedColor,
              shape: BoxShape.circle,
            ),
          ),
        ],
      ),
    );
  }
}

class BackMark extends StatelessWidget {
  const BackMark({super.key, this.color});

  final Color? color;

  @override
  Widget build(BuildContext context) {
    final resolvedColor = dfitPrimitiveIconColor(context, color);

    return Transform.rotate(
      angle: 0.785398,
      child: Container(
        width: 15,
        height: 15,
        decoration: BoxDecoration(
          border: Border(
            left: BorderSide(color: resolvedColor, width: 2),
            bottom: BorderSide(color: resolvedColor, width: 2),
          ),
        ),
      ),
    );
  }
}
