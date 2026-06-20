import 'package:flutter/material.dart';

import '../theme/logmyplate_colors.dart';
import 'glass/glass_cards.dart';
import 'primitive_icons.dart';

const logMyPlateAppIconAsset =
    'ios/Runner/Assets.xcassets/AppIcon.appiconset/Icon-App-1024x1024@1x.png';

class LogMyPlateBrandMark extends StatelessWidget {
  const LogMyPlateBrandMark({
    super.key,
    this.size = 72,
    this.showHalo = true,
    this.pulsing = false,
  });

  final double size;
  final bool showHalo;
  final bool pulsing;

  @override
  Widget build(BuildContext context) {
    final haloSize = size * 1.44;

    return SizedBox(
      width: showHalo ? haloSize : size,
      height: showHalo ? haloSize : size,
      child: Stack(
        alignment: Alignment.center,
        children: [
          if (showHalo) ...[
            _HaloRing(size: haloSize, opacity: 0.12),
            _HaloRing(size: size * 1.2, opacity: 0.18),
          ],
          AnimatedScale(
            duration: const Duration(milliseconds: 260),
            scale: pulsing ? 0.96 : 1,
            child: SizedBox(
              width: size,
              height: size,
              child: LiteGlassCard(
                borderRadius: BorderRadius.circular(size * 0.24),
                child: Padding(
                  padding: EdgeInsets.all(size * 0.05),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(size * 0.18),
                    child: Image.asset(
                      logMyPlateAppIconAsset,
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) =>
                          _BrandFallback(size: size),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _HaloRing extends StatelessWidget {
  const _HaloRing({required this.size, required this.opacity});

  final double size;
  final double opacity;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        border: Border.all(
          color: LogMyPlateColors.accent.withValues(alpha: opacity),
        ),
      ),
    );
  }
}

class _BrandFallback extends StatelessWidget {
  const _BrandFallback({required this.size});

  final double size;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: const BoxDecoration(color: LogMyPlateColors.surfaceHero),
      child: Center(
        child: PrimitiveCameraIcon(
          color: LogMyPlateColors.accent,
          size: size * 0.38,
        ),
      ),
    );
  }
}
