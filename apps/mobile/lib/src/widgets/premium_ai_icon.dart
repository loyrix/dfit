import 'package:flutter/material.dart';

import '../theme/logmyplate_colors.dart';

class PremiumAiIcon extends StatelessWidget {
  const PremiumAiIcon({super.key, this.size = 28, this.iconSize = 16});

  final double size;
  final double iconSize;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: const LinearGradient(
          colors: [Color(0xFFFFE3A3), LogMyPlateColors.accent],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        boxShadow: [
          BoxShadow(
            color: LogMyPlateColors.accent.withValues(alpha: 0.3),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
        border: Border.all(
          color: Colors.white.withValues(alpha: 0.3),
          width: 0.5,
        ),
      ),
      child: Center(
        child: Icon(
          Icons.auto_awesome_rounded,
          size: iconSize,
          color: LogMyPlateColors.accentDeep,
        ),
      ),
    );
  }
}
