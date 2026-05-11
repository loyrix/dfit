import 'package:flutter/material.dart';

import '../theme/dfit_colors.dart';
import 'primitive_icons.dart';

class DFitFab extends StatelessWidget {
  const DFitFab({super.key, required this.onPressed, this.pulsing = false});

  final VoidCallback onPressed;
  final bool pulsing;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: pulsing ? 92 : 72,
      height: pulsing ? 92 : 72,
      child: Stack(
        alignment: Alignment.center,
        children: [
          if (pulsing)
            Container(
              width: 92,
              height: 92,
              decoration: BoxDecoration(
                border: Border.all(
                  color: DFitColors.accent.withValues(alpha: 0.25),
                ),
                shape: BoxShape.circle,
              ),
            ),
          if (pulsing)
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                border: Border.all(
                  color: DFitColors.accent.withValues(alpha: 0.5),
                ),
                shape: BoxShape.circle,
              ),
            ),
          SizedBox(
            width: 64,
            height: 64,
            child: FloatingActionButton(
              elevation: 10,
              backgroundColor: DFitColors.textPrimaryLight,
              shape: const CircleBorder(),
              onPressed: onPressed,
              child: const PrimitiveCameraIcon(),
            ),
          ),
        ],
      ),
    );
  }
}
