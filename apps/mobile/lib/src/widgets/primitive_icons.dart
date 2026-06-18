import 'package:flutter/material.dart';

import '../theme/logmyplate_colors.dart';
import '../theme/logmyplate_theme.dart';

Color logmyplatePrimitiveIconColor(BuildContext context, Color? color) {
  if (color != null) return color;
  return IconTheme.of(context).color ?? context.logmyplate.icon;
}

class PrimitiveCameraIcon extends StatelessWidget {
  const PrimitiveCameraIcon({
    super.key,
    this.color = LogMyPlateColors.accent,
    this.size = 24,
  });

  final Color color;
  final double size;

  @override
  Widget build(BuildContext context) {
    final bodyTop = size * 0.18;
    final bodyHeight = size * 0.82;

    return SizedBox(
      width: size,
      height: bodyTop + bodyHeight,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Positioned(
            top: bodyTop,
            left: 0,
            right: 0,
            bottom: 0,
            child: DecoratedBox(
              decoration: BoxDecoration(
                border: Border.all(color: color, width: 1.6),
                borderRadius: BorderRadius.circular(size * 0.09),
              ),
            ),
          ),
          Positioned(
            top: 0,
            left: size * 0.32,
            right: size * 0.32,
            child: Container(
              height: size * 0.18,
              decoration: BoxDecoration(
                color: color,
                borderRadius: BorderRadius.vertical(
                  top: Radius.circular(size * 0.04),
                ),
              ),
            ),
          ),
          Positioned(
            top: bodyTop + bodyHeight * 0.12,
            right: size * 0.14,
            child: Container(
              width: size * 0.08,
              height: size * 0.08,
              decoration: BoxDecoration(
                color: color,
                shape: BoxShape.circle,
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
              alignment: Alignment.center,
              child: Container(
                width: size * 0.14,
                height: size * 0.14,
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.3),
                  shape: BoxShape.circle,
                ),
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
    final resolvedColor = logmyplatePrimitiveIconColor(context, color);

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
    final resolvedColor = logmyplatePrimitiveIconColor(context, color);

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
