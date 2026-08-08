import 'dart:math' as math;

import 'package:flutter/material.dart';

import 'score_visuals.dart';

/// A short confetti burst behind a strong rating.
///
/// Plays **once**, when a 4- or 5-star rating first appears, and never loops.
/// A celebration that repeats on every rebuild stops reading as a reward and
/// starts reading as a bug, and an ambient animation on the home screen is a
/// battery cost the user never asked for. The controller is discarded the
/// moment it finishes.
///
/// Drawn on a canvas rather than assembled from widgets: forty independently
/// transformed widgets would rebuild the tree every frame, where this is one
/// repaint of one layer.
class ScoreCelebration extends StatefulWidget {
  const ScoreCelebration({
    super.key,
    required this.tone,
    required this.trigger,
    required this.child,
  });

  final ScoreTone tone;

  /// Changing this value replays the burst. Pass something derived from the
  /// rating so it fires on a genuine change and not on an incidental rebuild.
  final Object? trigger;

  final Widget child;

  @override
  State<ScoreCelebration> createState() => _ScoreCelebrationState();
}

class _ScoreCelebrationState extends State<ScoreCelebration>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1500),
  );

  List<_Particle> _particles = const [];

  @override
  void initState() {
    super.initState();
    if (widget.tone == ScoreTone.great) _play();
  }

  @override
  void didUpdateWidget(covariant ScoreCelebration oldWidget) {
    super.didUpdateWidget(oldWidget);
    final changed = oldWidget.trigger != widget.trigger;
    if (changed && widget.tone == ScoreTone.great) _play();
  }

  void _play() {
    // Seeded from the trigger so a given rating always bursts the same way.
    // Reproducible output makes the widget testable and stops the card looking
    // subtly different every time it scrolls back into view.
    final random = math.Random(widget.trigger.hashCode);
    _particles = List.generate(28, (index) => _Particle.random(random, index));
    _controller.forward(from: 0);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final reduceMotion = MediaQuery.maybeDisableAnimationsOf(context) ?? false;
    if (widget.tone != ScoreTone.great || reduceMotion || _particles.isEmpty) {
      return widget.child;
    }

    final style = ScoreToneStyle.of(context, widget.tone);

    return Stack(
      children: [
        widget.child,
        Positioned.fill(
          child: IgnorePointer(
            child: RepaintBoundary(
              child: AnimatedBuilder(
                animation: _controller,
                builder: (context, _) {
                  if (_controller.isDismissed || _controller.isCompleted) {
                    return const SizedBox.shrink();
                  }
                  return CustomPaint(
                    painter: _ConfettiPainter(
                      particles: _particles,
                      progress: _controller.value,
                      colors: style.confetti,
                    ),
                  );
                },
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _Particle {
  _Particle({
    required this.originX,
    required this.angle,
    required this.speed,
    required this.spin,
    required this.width,
    required this.height,
    required this.colorIndex,
    required this.delay,
  });

  /// Fraction of the card's width the particle launches from.
  final double originX;
  final double angle;
  final double speed;
  final double spin;
  final double width;
  final double height;
  final int colorIndex;
  final double delay;

  factory _Particle.random(math.Random random, int index) {
    // Launched upward across a spread, not in a full circle: confetti that
    // starts by falling reads as debris rather than celebration.
    final spread = -math.pi / 2 + (random.nextDouble() - 0.5) * 1.9;
    return _Particle(
      originX: 0.18 + random.nextDouble() * 0.34,
      angle: spread,
      speed: 0.55 + random.nextDouble() * 0.75,
      spin: (random.nextDouble() - 0.5) * 10,
      width: 3.5 + random.nextDouble() * 3.5,
      height: 6.0 + random.nextDouble() * 5.0,
      colorIndex: index,
      delay: random.nextDouble() * 0.16,
    );
  }
}

class _ConfettiPainter extends CustomPainter {
  _ConfettiPainter({
    required this.particles,
    required this.progress,
    required this.colors,
  });

  final List<_Particle> particles;
  final double progress;
  final List<Color> colors;

  @override
  void paint(Canvas canvas, Size size) {
    if (colors.isEmpty) return;
    final paint = Paint()..style = PaintingStyle.fill;
    final originY = size.height * 0.42;

    for (final particle in particles) {
      final local = ((progress - particle.delay) / (1 - particle.delay)).clamp(
        0.0,
        1.0,
      );
      if (local <= 0) continue;

      // Ballistic: constant launch velocity with gravity pulling it back down.
      final distance = particle.speed * local * size.width * 0.5;
      final gravity = 1.9 * local * local * size.height * 0.55;

      final x =
          size.width * particle.originX + math.cos(particle.angle) * distance;
      final y = originY + math.sin(particle.angle) * distance + gravity;

      // Hold full opacity through the first half, then fade — fading from the
      // start makes the burst look weak at the moment it should read strongest.
      final opacity = local < 0.5
          ? 1.0
          : (1 - (local - 0.5) / 0.5).clamp(0.0, 1.0);
      if (opacity <= 0) continue;

      paint.color = colors[particle.colorIndex % colors.length].withValues(
        alpha: opacity,
      );

      canvas.save();
      canvas.translate(x, y);
      canvas.rotate(particle.spin * local);
      canvas.drawRRect(
        RRect.fromRectAndRadius(
          Rect.fromCenter(
            center: Offset.zero,
            width: particle.width,
            height: particle.height,
          ),
          const Radius.circular(1.2),
        ),
        paint,
      );
      canvas.restore();
    }
  }

  @override
  bool shouldRepaint(covariant _ConfettiPainter oldDelegate) =>
      oldDelegate.progress != progress || oldDelegate.particles != particles;
}
