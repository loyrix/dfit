import 'package:flutter/material.dart';

import '../theme/dfit_colors.dart';
import '../widgets/primitive_icons.dart';

class CameraScreen extends StatelessWidget {
  const CameraScreen({super.key, required this.onCaptured});

  final VoidCallback onCaptured;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: DFitColors.bgInk,
      body: SafeArea(
        child: Stack(
          children: [
            Center(
              child: Container(
                width: 260,
                height: 260,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(
                    color: DFitColors.accent.withValues(alpha: 0.28),
                  ),
                  color: Colors.white.withValues(alpha: 0.03),
                ),
                child: Stack(
                  children: [
                    for (final alignment in [
                      Alignment.topLeft,
                      Alignment.topRight,
                      Alignment.bottomLeft,
                      Alignment.bottomRight,
                    ])
                      Align(alignment: alignment, child: const _CornerMark()),
                    Center(
                      child: Container(
                        width: 6,
                        height: 6,
                        decoration: const BoxDecoration(
                          color: DFitColors.accent,
                          shape: BoxShape.circle,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            Positioned(
              top: 16,
              left: 12,
              child: IconButton(
                onPressed: () => Navigator.of(context).pop(),
                icon: const BackMark(color: Colors.white),
              ),
            ),
            Positioned(
              left: 0,
              right: 0,
              bottom: 120,
              child: Column(
                children: [
                  Text(
                    'Center your plate',
                    style: Theme.of(
                      context,
                    ).textTheme.titleMedium?.copyWith(color: Colors.white),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Photo is analyzed, not stored',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Colors.white.withValues(alpha: 0.5),
                    ),
                  ),
                ],
              ),
            ),
            Positioned(
              left: 0,
              right: 0,
              bottom: 34,
              child: Center(
                child: GestureDetector(
                  onTap: onCaptured,
                  child: Container(
                    width: 76,
                    height: 76,
                    decoration: BoxDecoration(
                      border: Border.all(color: Colors.white, width: 2),
                      shape: BoxShape.circle,
                    ),
                    child: Center(
                      child: Container(
                        width: 58,
                        height: 58,
                        decoration: const BoxDecoration(
                          color: DFitColors.accent,
                          shape: BoxShape.circle,
                        ),
                        child: const Center(
                          child: PrimitiveCameraIcon(
                            color: DFitColors.accentDeep,
                            size: 26,
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CornerMark extends StatelessWidget {
  const _CornerMark();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 28,
      height: 28,
      margin: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        border: Border.all(color: DFitColors.accent, width: 2),
      ),
    );
  }
}
