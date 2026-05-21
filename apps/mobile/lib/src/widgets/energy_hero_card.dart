import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../models/meal.dart';
import '../theme/logmyplate_colors.dart';

class EnergyHeroCard extends StatelessWidget {
  const EnergyHeroCard({
    super.key,
    required this.totals,
    required this.mealCount,
    this.label = 'Energy',
    this.target,
  });

  final MacroTotals totals;
  final int mealCount;
  final String label;
  final MacroTotals? target;

  @override
  Widget build(BuildContext context) {
    final targetCalories = target?.calories;
    final hasTarget = targetCalories != null && targetCalories > 0;
    final remaining = hasTarget ? targetCalories - totals.calories : null;
    final progress = hasTarget
        ? (totals.calories / targetCalories).clamp(0.0, 1.25).toDouble()
        : 0.0;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: LogMyPlateColors.surfaceHero,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Stack(
        children: [
          Positioned(
            right: hasTarget ? -16 : -52,
            top: hasTarget ? 6 : -52,
            child: hasTarget
                ? _TargetRing(progress: progress, remaining: remaining!)
                : const _HeroRings(),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  color: Colors.white.withValues(alpha: 0.5),
                  letterSpacing: 1.8,
                ),
              ),
              const SizedBox(height: 10),
              Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    '${totals.calories}',
                    style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                      color: Colors.white,
                      fontSize: 38,
                      fontFeatures: const [FontFeature.tabularFigures()],
                    ),
                  ),
                  const SizedBox(width: 6),
                  Padding(
                    padding: const EdgeInsets.only(bottom: 4),
                    child: Text(
                      'kCal',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Colors.white.withValues(alpha: 0.5),
                      ),
                    ),
                  ),
                ],
              ),
              if (hasTarget) ...[
                const SizedBox(height: 8),
                Text(
                  remaining! >= 0
                      ? '$remaining kCal left today'
                      : '${remaining.abs()} kCal over target',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: remaining >= 0
                        ? LogMyPlateColors.accent
                        : const Color(0xFFFF8A8A),
                    fontFeatures: const [FontFeature.tabularFigures()],
                  ),
                ),
              ],
              const SizedBox(height: 16),
              Container(
                height: 1,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.10),
                  borderRadius: BorderRadius.circular(99),
                ),
              ),
              const SizedBox(height: 10),
              Text(
                hasTarget
                    ? 'Target $targetCalories kCal'
                    : mealCount == 0
                    ? 'No meals logged yet'
                    : '$mealCount ${mealCount == 1 ? 'meal' : 'meals'} logged',
                style: Theme.of(
                  context,
                ).textTheme.bodySmall?.copyWith(color: LogMyPlateColors.accent),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _TargetRing extends StatelessWidget {
  const _TargetRing({required this.progress, required this.remaining});

  final double progress;
  final int remaining;

  @override
  Widget build(BuildContext context) {
    final displayProgress = (progress * 100).clamp(0, 125).round();

    return SizedBox(
      width: 116,
      height: 116,
      child: CustomPaint(
        painter: _TargetRingPainter(progress: progress),
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                '$displayProgress%',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  color: Colors.white,
                  fontFeatures: const [FontFeature.tabularFigures()],
                ),
              ),
              Text(
                remaining >= 0 ? 'left' : 'over',
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  color: Colors.white.withValues(alpha: 0.48),
                  letterSpacing: 0,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _TargetRingPainter extends CustomPainter {
  const _TargetRingPainter({required this.progress});

  final double progress;

  @override
  void paint(Canvas canvas, Size size) {
    final rect = Offset.zero & size;
    final center = rect.center;
    final radius = math.min(size.width, size.height) / 2 - 9;
    final track = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 8
      ..strokeCap = StrokeCap.round
      ..color = Colors.white.withValues(alpha: 0.10);
    final arc = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 8
      ..strokeCap = StrokeCap.round
      ..shader = SweepGradient(
        startAngle: -math.pi / 2,
        endAngle: math.pi * 1.5,
        colors: progress > 1
            ? const [Color(0xFFFFC857), Color(0xFFFF8A8A), Color(0xFFFFC857)]
            : const [
                Color(0xFFFFE7A0),
                LogMyPlateColors.accent,
                Color(0xFFFFE7A0),
              ],
      ).createShader(rect);

    canvas.drawCircle(center, radius, track);
    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      -math.pi / 2,
      math.pi * 2 * progress.clamp(0.0, 1.0),
      false,
      arc,
    );
  }

  @override
  bool shouldRepaint(covariant _TargetRingPainter oldDelegate) {
    return oldDelegate.progress != progress;
  }
}

class _HeroRings extends StatelessWidget {
  const _HeroRings();

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 140,
      height: 140,
      child: Stack(
        alignment: Alignment.center,
        children: List.generate(3, (index) {
          final size = 76.0 + (index * 28);
          return Container(
            width: size,
            height: size,
            decoration: BoxDecoration(
              border: Border.all(
                color: LogMyPlateColors.accent.withValues(
                  alpha: 0.08 + index * 0.04,
                ),
              ),
              shape: BoxShape.circle,
            ),
          );
        }),
      ),
    );
  }
}
