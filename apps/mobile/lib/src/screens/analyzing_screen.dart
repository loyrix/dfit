import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../models/captured_meal_photo.dart';
import '../models/meal.dart';
import '../services/dfit_api_client.dart';
import '../theme/dfit_colors.dart';

class AnalyzingScreen extends StatefulWidget {
  const AnalyzingScreen({
    super.key,
    required this.photo,
    required this.onAnalyze,
    required this.onAnalyzed,
  });

  final CapturedMealPhoto photo;
  final Future<ScanAnalysis> Function(CapturedMealPhoto photo) onAnalyze;
  final ValueChanged<ScanAnalysis> onAnalyzed;

  @override
  State<AnalyzingScreen> createState() => _AnalyzingScreenState();
}

class _AnalyzingScreenState extends State<AnalyzingScreen>
    with SingleTickerProviderStateMixin {
  static const _steps = [
    'Captured',
    'Identifying items',
    'Estimating portions',
    'Balancing macros',
  ];

  String? _error;
  int _activeStep = 1;
  Timer? _stepTimer;
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 2400),
  )..repeat();

  @override
  void initState() {
    super.initState();
    _startStepTimer();
    _runAnalysis();
  }

  @override
  void dispose() {
    _stepTimer?.cancel();
    _controller.dispose();
    super.dispose();
  }

  Future<void> _runAnalysis() async {
    if (_error != null) {
      setState(() => _error = null);
    }
    _startStepTimer(reset: true);

    try {
      final analysis = await widget.onAnalyze(widget.photo);
      if (!mounted) return;
      widget.onAnalyzed(analysis);
    } catch (error) {
      if (!mounted) return;
      _stepTimer?.cancel();
      setState(() {
        _error = _analysisErrorMessage(error);
      });
    }
  }

  void _startStepTimer({bool reset = false}) {
    _stepTimer?.cancel();
    if (reset) {
      _activeStep = 1;
    }
    _stepTimer = Timer.periodic(const Duration(milliseconds: 1050), (_) {
      if (!mounted || _error != null) return;
      setState(() {
        _activeStep = math.min(_activeStep + 1, _steps.length - 1);
      });
    });
  }

  String _analysisErrorMessage(Object error) {
    if (error is DFitApiException) {
      if (error.isScanCreditRequired) {
        return 'No scan credits left today. Add manually for now or refresh after credits reset.';
      }
      if (error.statusCode >= 500) {
        return 'DFit API is taking longer than expected. Retry in a moment.';
      }
      return 'Could not analyze this meal (${error.statusCode}). Try again.';
    }
    return 'Could not analyze this meal. Check the API connection and try again.';
  }

  @override
  Widget build(BuildContext context) {
    final error = _error;

    return Scaffold(
      backgroundColor: DFitColors.bgInk,
      body: SafeArea(
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              _ScanMark(animation: _controller),
              const SizedBox(height: 36),
              Text(
                _error == null ? 'Reading your plate' : 'Scan paused',
                style: Theme.of(
                  context,
                ).textTheme.titleMedium?.copyWith(color: Colors.white),
              ),
              const SizedBox(height: 7),
              AnimatedSwitcher(
                duration: const Duration(milliseconds: 220),
                child: Text(
                  _error == null
                      ? _progressLabel(_activeStep)
                      : 'Ready when you are',
                  key: ValueKey(_error == null ? _activeStep : 'error'),
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Colors.white.withValues(alpha: 0.52),
                    letterSpacing: 0.2,
                  ),
                ),
              ),
              const SizedBox(height: 18),
              Container(
                margin: const EdgeInsets.symmetric(horizontal: 32),
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.03),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                    color: Colors.white.withValues(alpha: 0.06),
                  ),
                ),
                child: Column(
                  children: [
                    for (var index = 0; index < _steps.length; index++)
                      _StepRow(
                        label: _steps[index],
                        done: error == null && index < _activeStep,
                        active: error == null && index == _activeStep,
                      ),
                  ],
                ),
              ),
              if (error != null) ...[
                const SizedBox(height: 18),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 32),
                  child: Text(
                    error,
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Colors.white.withValues(alpha: 0.7),
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                FilledButton(
                  onPressed: _runAnalysis,
                  style: FilledButton.styleFrom(
                    backgroundColor: DFitColors.accent,
                    foregroundColor: DFitColors.accentDeep,
                  ),
                  child: const Text('Retry'),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  String _progressLabel(int step) {
    return switch (step) {
      1 => 'Finding foods and edges',
      2 => 'Checking portions and grams',
      3 => 'Preparing your macro review',
      _ => 'Securing the capture',
    };
  }
}

class _ScanMark extends StatelessWidget {
  const _ScanMark({required this.animation});

  final Animation<double> animation;

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: animation,
      builder: (context, _) {
        final t = animation.value;
        final scanY = 46 + (math.sin(t * math.pi * 2) + 1) * 38;

        return SizedBox(
          width: 196,
          height: 196,
          child: Stack(
            alignment: Alignment.center,
            children: [
              Transform.rotate(
                angle: t * math.pi * 2,
                child: CustomPaint(
                  size: const Size.square(196),
                  painter: _OrbitPainter(progress: t),
                ),
              ),
              Container(
                width: 116,
                height: 116,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.035),
                  border: Border.all(
                    color: DFitColors.accent.withValues(alpha: 0.22),
                  ),
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              Positioned(
                top: scanY,
                child: Container(
                  width: 116,
                  height: 2.5,
                  decoration: BoxDecoration(
                    color: DFitColors.accent,
                    borderRadius: BorderRadius.circular(99),
                    boxShadow: [
                      BoxShadow(
                        color: DFitColors.accent.withValues(alpha: 0.45),
                        blurRadius: 18,
                        spreadRadius: 1,
                      ),
                    ],
                  ),
                ),
              ),
              _PulseDot(top: 55, left: 73, animation: animation, delay: 0),
              _PulseDot(top: 90, left: 120, animation: animation, delay: 0.34),
              _PulseDot(top: 127, left: 85, animation: animation, delay: 0.68),
            ],
          ),
        );
      },
    );
  }
}

class _PulseDot extends StatelessWidget {
  const _PulseDot({
    required this.top,
    required this.left,
    required this.animation,
    required this.delay,
  });

  final double top;
  final double left;
  final Animation<double> animation;
  final double delay;

  @override
  Widget build(BuildContext context) {
    final t = (animation.value + delay) % 1;
    final scale = 0.82 + 0.38 * math.sin(t * math.pi);

    return Positioned(
      top: top,
      left: left,
      child: Transform.scale(
        scale: scale,
        child: Container(
          width: 8,
          height: 8,
          decoration: BoxDecoration(
            color: DFitColors.accent.withValues(alpha: 0.72 + 0.28 * t),
            shape: BoxShape.circle,
            boxShadow: [
              BoxShadow(
                color: DFitColors.accent.withValues(alpha: 0.32),
                blurRadius: 10,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _OrbitPainter extends CustomPainter {
  const _OrbitPainter({required this.progress});

  final double progress;

  @override
  void paint(Canvas canvas, Size size) {
    final center = size.center(Offset.zero);
    final radius = size.width / 2 - 5;
    final base = Paint()
      ..color = DFitColors.accent.withValues(alpha: 0.16)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1;
    final arc = Paint()
      ..shader = SweepGradient(
        colors: [
          Colors.transparent,
          DFitColors.accent.withValues(alpha: 0.2),
          DFitColors.accent.withValues(alpha: 0.8),
          Colors.transparent,
        ],
        stops: const [0.0, 0.45, 0.78, 1.0],
        transform: GradientRotation(progress * math.pi * 2),
      ).createShader(Rect.fromCircle(center: center, radius: radius))
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.4
      ..strokeCap = StrokeCap.round;

    canvas.drawCircle(center, radius, base);
    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      -math.pi / 2,
      math.pi * 1.25,
      false,
      arc,
    );
  }

  @override
  bool shouldRepaint(covariant _OrbitPainter oldDelegate) {
    return oldDelegate.progress != progress;
  }
}

class _StepRow extends StatelessWidget {
  const _StepRow({required this.label, this.done = false, this.active = false});

  final String label;
  final bool done;
  final bool active;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 7),
      child: Row(
        children: [
          Container(
            width: 18,
            height: 18,
            decoration: BoxDecoration(
              color: done ? DFitColors.accent : Colors.transparent,
              border: Border.all(
                color: done || active
                    ? DFitColors.accent
                    : Colors.white.withValues(alpha: 0.18),
                width: 1.5,
              ),
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 12),
          Text(
            label,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: active || done
                  ? Colors.white
                  : Colors.white.withValues(alpha: 0.35),
              fontWeight: active ? FontWeight.w500 : FontWeight.w400,
            ),
          ),
        ],
      ),
    );
  }
}
