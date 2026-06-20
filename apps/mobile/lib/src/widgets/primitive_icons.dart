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
    return Icon(
      Icons.camera_alt_outlined,
      color: color,
      size: size * 1.3, // make it slightly larger to match previous bounding box
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
