import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../models/captured_meal_photo.dart';
import '../models/meal.dart';
import '../services/logmyplate_api_client.dart';
import '../theme/logmyplate_colors.dart';
import '../theme/logmyplate_surfaces.dart';
import '../theme/logmyplate_theme.dart';
import '../widgets/logmyplate_background.dart';

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
    'Identifying visible foods',
    'Estimating portions',
    'Calculating macro nutrients',
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
    final colors = context.logmyplate;

    return Scaffold(
      backgroundColor: colors.background,
      body: LogMyPlateAmbientBackground(
        child: SafeArea(
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
                          _AnalyzingMealPreview(
                            photo: widget.photo,
                            animation: _controller,
                          ),
                          const SizedBox(height: 28),
                          Text(
                            failure == null
                                ? 'Reading your plate'
                                : failure.title,
                            style: Theme.of(context).textTheme.titleMedium
                                ?.copyWith(color: colors.textPrimary),
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
                                    color: colors.textSecondary,
                                    letterSpacing: 0.2,
                                  ),
                            ),
                          ),
                          if (plateHint != null && plateHint.isNotEmpty) ...[
                            const SizedBox(height: 14),
                            _HintPill(label: plateHint),
                          ],
                          const SizedBox(height: 18),
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 32),
                            child: Column(
                              children: [
                                for (
                                  var index = 0;
                                  index < _steps.length;
                                  index++
                                )
                                  _StepRow(
                                    label: _steps[index],
                                    done:
                                        failure == null && index < _activeStep,
                                    active:
                                        failure == null && index == _activeStep,
                                  ),
                              ],
                            ),
                          ),
                          if (failure != null) ...[
                            const SizedBox(height: 18),
                            Padding(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 32,
                              ),
                              child: Text(
                                failure.message,
                                textAlign: TextAlign.center,
                                style: Theme.of(context).textTheme.bodySmall
                                    ?.copyWith(color: colors.textSecondary),
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
      ),
    );
  }

  String _progressLabel(int step) {
    return switch (step) {
      1 => 'Reading visible foods',
      2 => 'Estimating portions and grams',
      3 => 'Calculating macro nutrients',
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
    if (error is LogMyPlateApiException) {
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
              'Keep the full plate visible in a clear, well-lit photo. Photos are saved with meal logs.',
        );
      }
      if (error.retryable || error.statusCode >= 500) {
        return _AnalysisFailure(
          kind: _AnalysisFailureKind.provider,
          title: 'Still thinking',
          subtitle: 'The AI took too long',
          message:
              error.message ??
              'LogMyPlate is taking longer than expected. Retry in a moment.',
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
      subtitle: 'Could not reach LogMyPlate',
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
            backgroundColor: LogMyPlateColors.accent,
            foregroundColor: LogMyPlateColors.accentDeep,
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
    final colors = context.logmyplate;

    return Container(
      constraints: const BoxConstraints(maxWidth: 280),
      padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 8),
      decoration: BoxDecoration(
        color: LogMyPlateColors.accent.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(99),
        border: Border.all(
          color: LogMyPlateColors.accent.withValues(alpha: 0.22),
        ),
      ),
      child: Text(
        label,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
          color: colors.accentText,
          letterSpacing: 0.2,
        ),
      ),
    );
  }
}

class _AnalyzingMealPreview extends StatelessWidget {
  const _AnalyzingMealPreview({required this.photo, required this.animation});

  final CapturedMealPhoto photo;
  final Animation<double> animation;

  @override
  Widget build(BuildContext context) {
    final surface = LogMyPlateHeroSurfaceStyle.of(context);

    return AnimatedBuilder(
      animation: animation,
      builder: (context, _) {
        final t = animation.value;
        final scanY = 24 + (math.sin(t * math.pi * 2) + 1) * 81;

        return SizedBox(
          width: 252,
          height: 252,
          child: Stack(
            children: [
              Positioned.fill(
                child: Container(
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(28),
                    boxShadow: [
                      BoxShadow(
                        color: surface.shadowColor,
                        blurRadius: 26,
                        offset: const Offset(0, 18),
                      ),
                    ],
                  ),
                ),
              ),
              Positioned.fill(
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(28),
                  child: Stack(
                    fit: StackFit.expand,
                    children: [
                      Image.memory(
                        photo.bytes,
                        fit: BoxFit.cover,
                        gaplessPlayback: true,
                        errorBuilder: (context, error, stackTrace) =>
                            const _AnalyzingMealFallback(),
                      ),
                      DecoratedBox(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                            colors: [
                              Colors.black.withValues(alpha: 0.10),
                              Colors.transparent,
                              Colors.black.withValues(alpha: 0.46),
                            ],
                            stops: const [0, 0.42, 1],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              Positioned.fill(
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(28),
                    border: Border.all(color: surface.border),
                  ),
                ),
              ),
              Positioned(
                left: 18,
                right: 18,
                top: scanY,
                child: Container(
                  height: 2.5,
                  decoration: BoxDecoration(
                    color: LogMyPlateColors.accent,
                    borderRadius: BorderRadius.circular(99),
                    boxShadow: [
                      BoxShadow(
                        color: LogMyPlateColors.accent.withValues(alpha: 0.45),
                        blurRadius: 18,
                        spreadRadius: 1,
                      ),
                    ],
                  ),
                ),
              ),
              Positioned(
                top: 16,
                left: 16,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 7,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.black.withValues(alpha: 0.42),
                    borderRadius: BorderRadius.circular(99),
                    border: Border.all(
                      color: Colors.white.withValues(alpha: 0.12),
                    ),
                  ),
                  child: Text(
                    'Analyzing',
                    style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      color: Colors.white,
                      letterSpacing: 0.5,
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _AnalyzingMealFallback extends StatelessWidget {
  const _AnalyzingMealFallback();

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;
    return DecoratedBox(
      decoration: BoxDecoration(color: colors.surfaceCard),
      child: Center(
        child: Icon(
          Icons.restaurant_rounded,
          color: colors.accentText,
          size: 42,
        ),
      ),
    );
  }
}

class _StepRow extends StatelessWidget {
  const _StepRow({required this.label, this.done = false, this.active = false});

  final String label;
  final bool done;
  final bool active;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 7),
      child: Row(
        children: [
          Container(
            width: 18,
            height: 18,
            decoration: BoxDecoration(
              color: done ? LogMyPlateColors.accent : Colors.transparent,
              border: Border.all(
                color: done || active ? LogMyPlateColors.accent : colors.border,
                width: 1.5,
              ),
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 12),
          Text(
            label,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: active || done ? colors.textPrimary : colors.textSecondary,
              fontWeight: active ? FontWeight.w500 : FontWeight.w400,
            ),
          ),
        ],
      ),
    );
  }
}
