import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../models/meal.dart';
import '../theme/logmyplate_colors.dart';
import '../theme/logmyplate_surfaces.dart';
import '../widgets/glass/glass_cards.dart';

class EnergyHeroCard extends StatelessWidget {
  const EnergyHeroCard({
    super.key,
    required this.totals,
    required this.mealCount,
    this.label = 'Energy',
    this.target,
    this.onSetTarget,
  });

  final MacroTotals totals;
  final int mealCount;
  final String label;
  final MacroTotals? target;
  final VoidCallback? onSetTarget;

  @override
  Widget build(BuildContext context) {
    final targetCalories = target?.calories;
    final hasTarget = targetCalories != null && targetCalories > 0;
    final remaining = hasTarget ? targetCalories - totals.calories : null;
    final progress = hasTarget
        ? (totals.calories / targetCalories).clamp(0.0, 1.25).toDouble()
        : 0.0;
    final style = LogMyPlateHeroSurfaceStyle.of(context);

    return LiteGlassCard(
      padding: const EdgeInsets.all(18),
      borderRadius: BorderRadius.circular(20),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    color: style.textSecondary,
                    letterSpacing: 1.8,
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      '${totals.calories}',
                      style: Theme.of(context).textTheme.headlineMedium
                          ?.copyWith(
                            color: style.textPrimary,
                            fontSize: 42,
                            fontFeatures: const [FontFeature.tabularFigures()],
                          ),
                    ),
                    const SizedBox(width: 6),
                    Padding(
                      padding: const EdgeInsets.only(bottom: 5),
                      child: Text(
                        'kCal',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: style.textSecondary,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  hasTarget && remaining! >= 0
                      ? '$remaining kCal left today'
                      : hasTarget
                      ? '${remaining!.abs()} kCal over target'
                      : mealCount == 0
                      ? 'No meals logged yet'
                      : '$mealCount ${mealCount == 1 ? 'meal' : 'meals'} logged',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: !hasTarget || remaining! >= 0
                        ? style.accentText
                        : const Color(0xFFFF8A8A),
                    fontFeatures: const [FontFeature.tabularFigures()],
                  ),
                ),
                const SizedBox(height: 16),
                hasTarget
                    ? GestureDetector(
                        onTap: onSetTarget,
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 11,
                            vertical: 8,
                          ),
                          decoration: BoxDecoration(
                            color: style.chipFill,
                            borderRadius: BorderRadius.circular(99),
                            border: Border.all(color: style.chipBorder),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                'Target $targetCalories kCal',
                                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                                  color: style.accentText,
                                  letterSpacing: 0,
                                ),
                              ),
                              const SizedBox(width: 6),
                              Icon(
                                Icons.edit_rounded,
                                size: 14,
                                color: style.accentText,
                              ),
                            ],
                          ),
                        ),
                      )
                    : _TargetCTA(onSetTarget: onSetTarget, style: style, hasTarget: false),
              ],
            ),
          ),
          const SizedBox(width: 14),
          hasTarget
              ? _TargetRing(
                  progress: progress,
                  remaining: remaining!,
                  style: style,
                )
              : _HeroRings(style: style),
        ],
      ),
    );
  }
}

class _TargetRing extends StatelessWidget {
  const _TargetRing({
    required this.progress,
    required this.remaining,
    required this.style,
  });

  final double progress;
  final int remaining;
  final LogMyPlateHeroSurfaceStyle style;

  @override
  Widget build(BuildContext context) {
    final displayProgress = (progress * 100).clamp(0, 125).round();

    return SizedBox(
      width: 112,
      height: 112,
      child: CustomPaint(
        painter: _TargetRingPainter(
          progress: progress,
          trackColor: style.track,
        ),
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                '$displayProgress%',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  color: style.textPrimary,
                  fontFeatures: const [FontFeature.tabularFigures()],
                ),
              ),
              Text(
                remaining >= 0 ? 'Consumed' : 'Over',
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  color: style.textSecondary,
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
  const _TargetRingPainter({required this.progress, required this.trackColor});

  final double progress;
  final Color trackColor;

  @override
  void paint(Canvas canvas, Size size) {
    final rect = Offset.zero & size;
    final center = rect.center;
    final radius = math.min(size.width, size.height) / 2 - 9;
    final track = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 8
      ..strokeCap = StrokeCap.round
      ..color = trackColor;
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
    return oldDelegate.progress != progress ||
        oldDelegate.trackColor != trackColor;
  }
}

class _HeroRings extends StatelessWidget {
  const _HeroRings({required this.style});

  final LogMyPlateHeroSurfaceStyle style;

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
                  alpha: style.isDark
                      ? 0.08 + index * 0.04
                      : 0.10 + index * 0.035,
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

class _TargetCTA extends StatelessWidget {
  const _TargetCTA({required this.onSetTarget, required this.style, required this.hasTarget});

  final VoidCallback? onSetTarget;
  final LogMyPlateHeroSurfaceStyle style;
  final bool hasTarget;

  @override
  Widget build(BuildContext context) {
    if (onSetTarget == null) return const SizedBox.shrink();

    return GestureDetector(
      onTap: onSetTarget,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [
              style.accentText.withValues(alpha: 0.15),
              style.accentText.withValues(alpha: 0.05),
            ],
          ),
          borderRadius: BorderRadius.circular(99),
          border: Border.all(
            color: style.accentText.withValues(alpha: 0.3),
            width: 1,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              hasTarget ? Icons.edit_rounded : Icons.auto_awesome_rounded,
              size: 16,
              color: style.accentText,
            ),
            const SizedBox(width: 8),
            Text(
              hasTarget ? 'Edit daily target' : 'Set daily target',
              style: Theme.of(context).textTheme.labelMedium?.copyWith(
                    color: style.textPrimary,
                    fontWeight: FontWeight.w600,
                  ),
            ),
          ],
        ),
      ),
    );
  }
}
