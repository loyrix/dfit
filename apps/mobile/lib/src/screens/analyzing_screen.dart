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
    this.onScanCreditRequired,
    this.onAddManually,
  });

  final CapturedMealPhoto photo;
  final Future<ScanAnalysis> Function(CapturedMealPhoto photo) onAnalyze;
  final ValueChanged<ScanAnalysis> onAnalyzed;
  final Future<void> Function()? onScanCreditRequired;
  final VoidCallback? onAddManually;

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

  _AnalysisFailure? _failure;
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
    if (_failure != null) {
      setState(() => _failure = null);
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
        _failure = _AnalysisFailure.from(error);
      });
    }
  }

  void _startStepTimer({bool reset = false}) {
    _stepTimer?.cancel();
    if (reset) {
      _activeStep = 1;
    }
    _stepTimer = Timer.periodic(const Duration(milliseconds: 1050), (_) {
      if (!mounted || _failure != null) return;
      setState(() {
        _activeStep = math.min(_activeStep + 1, _steps.length - 1);
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    final failure = _failure;
    final plateHint = widget.photo.userHint?.trim();

    return Scaffold(
      backgroundColor: DFitColors.bgInk,
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) {
            return SingleChildScrollView(
              physics: const BouncingScrollPhysics(),
              child: ConstrainedBox(
                constraints: BoxConstraints(minHeight: constraints.maxHeight),
                child: Center(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 24),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        _ScanMark(animation: _controller),
                        const SizedBox(height: 36),
                        Text(
                          failure == null
                              ? 'Reading your plate'
                              : failure.title,
                          style: Theme.of(context).textTheme.titleMedium
                              ?.copyWith(color: Colors.white),
                        ),
                        const SizedBox(height: 7),
                        AnimatedSwitcher(
                          duration: const Duration(milliseconds: 220),
                          child: Text(
                            failure == null
                                ? _progressLabel(_activeStep)
                                : failure.subtitle,
                            key: ValueKey(
                              failure == null ? _activeStep : failure.kind,
                            ),
                            style: Theme.of(context).textTheme.bodySmall
                                ?.copyWith(
                                  color: Colors.white.withValues(alpha: 0.52),
                                  letterSpacing: 0.2,
                                ),
                          ),
                        ),
                        if (plateHint != null && plateHint.isNotEmpty) ...[
                          const SizedBox(height: 14),
                          _HintPill(label: plateHint),
                        ],
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
                              for (
                                var index = 0;
                                index < _steps.length;
                                index++
                              )
                                _StepRow(
                                  label: _steps[index],
                                  done: failure == null && index < _activeStep,
                                  active:
                                      failure == null && index == _activeStep,
                                ),
                            ],
                          ),
                        ),
                        if (failure != null) ...[
                          const SizedBox(height: 18),
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 32),
                            child: Text(
                              failure.message,
                              textAlign: TextAlign.center,
                              style: Theme.of(context).textTheme.bodySmall
                                  ?.copyWith(
                                    color: Colors.white.withValues(alpha: 0.7),
                                  ),
                            ),
                          ),
                          const SizedBox(height: 12),
                          _FailureActions(
                            failure: failure,
                            onRetry: _runAnalysis,
                            onScanCreditRequired: widget.onScanCreditRequired,
                            onAddManually: widget.onAddManually,
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
              ),
            );
          },
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

enum _AnalysisFailureKind { quota, provider, invalidImage, offline }

class _AnalysisFailure {
  const _AnalysisFailure({
    required this.kind,
    required this.title,
    required this.subtitle,
    required this.message,
  });

  final _AnalysisFailureKind kind;
  final String title;
  final String subtitle;
  final String message;

  factory _AnalysisFailure.from(Object error) {
    if (error is DFitApiException) {
      if (error.isScanCreditRequired) {
        return const _AnalysisFailure(
          kind: _AnalysisFailureKind.quota,
          title: 'Unlock scans',
          subtitle: 'Your free scans are used',
          message:
              'Create or open your account to keep this journal safe, then unlock more scans when credits are available.',
        );
      }
      if (error.errorCode == 'invalid_scan_image') {
        return const _AnalysisFailure(
          kind: _AnalysisFailureKind.invalidImage,
          title: 'Retake photo',
          subtitle: 'The image needs one more try',
          message:
              'Use a clear top view with the full plate visible. DFit does not store the food photo.',
        );
      }
      if (error.retryable || error.statusCode >= 500) {
        return _AnalysisFailure(
          kind: _AnalysisFailureKind.provider,
          title: 'Still thinking',
          subtitle: 'The AI took too long',
          message:
              error.message ??
              'DFit API is taking longer than expected. Retry in a moment.',
        );
      }
      return _AnalysisFailure(
        kind: _AnalysisFailureKind.provider,
        title: 'Scan paused',
        subtitle: 'Review needed',
        message:
            error.message ??
            'Could not analyze this meal (${error.statusCode}). Try again.',
      );
    }

    return const _AnalysisFailure(
      kind: _AnalysisFailureKind.offline,
      title: 'Connection paused',
      subtitle: 'Could not reach DFit',
      message: 'Check the API connection and try again.',
    );
  }
}

class _FailureActions extends StatelessWidget {
  const _FailureActions({
    required this.failure,
    required this.onRetry,
    this.onScanCreditRequired,
    this.onAddManually,
  });

  final _AnalysisFailure failure;
  final VoidCallback onRetry;
  final Future<void> Function()? onScanCreditRequired;
  final VoidCallback? onAddManually;

  @override
  Widget build(BuildContext context) {
    final isQuota = failure.kind == _AnalysisFailureKind.quota;

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        FilledButton(
          onPressed: isQuota ? _handleQuotaAction : onRetry,
          style: FilledButton.styleFrom(
            backgroundColor: DFitColors.accent,
            foregroundColor: DFitColors.accentDeep,
          ),
          child: Text(isQuota ? 'Open account' : 'Retry scan'),
        ),
        const SizedBox(height: 4),
        TextButton(
          onPressed: isQuota && onAddManually != null
              ? onAddManually
              : () => Navigator.of(context).pop(),
          child: Text(
            isQuota && onAddManually != null ? 'Add manually' : 'Back',
          ),
        ),
      ],
    );
  }

  void _handleQuotaAction() {
    final scanCreditAction = onScanCreditRequired;
    if (scanCreditAction != null) {
      unawaited(scanCreditAction());
      return;
    }
    onAddManually?.call();
  }
}

class _HintPill extends StatelessWidget {
  const _HintPill({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      constraints: const BoxConstraints(maxWidth: 280),
      padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 8),
      decoration: BoxDecoration(
        color: DFitColors.accent.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(99),
        border: Border.all(color: DFitColors.accent.withValues(alpha: 0.22)),
      ),
      child: Text(
        label,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
          color: DFitColors.accent,
          letterSpacing: 0.2,
        ),
      ),
    );
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
