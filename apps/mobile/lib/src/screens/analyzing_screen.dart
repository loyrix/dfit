import 'dart:async';
import 'dart:math' as math;
import 'dart:ui' as ui;

import 'package:flutter/material.dart';

import '../models/captured_meal_photo.dart';
import '../models/meal.dart';
import '../services/logmyplate_api_client.dart';
import '../theme/logmyplate_colors.dart';
import '../theme/logmyplate_surfaces.dart';
import '../theme/logmyplate_theme.dart';

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
      body: Stack(
        children: [
          Positioned.fill(child: _AnalysisPhotoWash(photo: widget.photo)),
          SafeArea(
            child: LayoutBuilder(
              builder: (context, constraints) {
                final compact = constraints.maxHeight < 720;
                final horizontalPadding = compact ? 20.0 : 24.0;
                final imageWidth = math.min(
                  constraints.maxWidth - horizontalPadding * 2,
                  compact ? 300.0 : 340.0,
                );
                final imageHeight = math.max(
                  compact ? 188.0 : 230.0,
                  math.min(
                    constraints.maxHeight * (compact ? 0.32 : 0.38),
                    imageWidth * 0.9,
                  ),
                );

                return SingleChildScrollView(
                  physics: const BouncingScrollPhysics(),
                  child: ConstrainedBox(
                    constraints: BoxConstraints(
                      minHeight: constraints.maxHeight,
                    ),
                    child: Padding(
                      padding: EdgeInsets.fromLTRB(
                        horizontalPadding,
                        compact ? 14 : 20,
                        horizontalPadding,
                        compact ? 18 : 24,
                      ),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          _AnalyzingMealPreview(
                            photo: widget.photo,
                            animation: _controller,
                            width: imageWidth,
                            height: imageHeight,
                          ),
                          SizedBox(height: compact ? 16 : 22),
                          Text(
                            failure == null
                                ? 'Reading your plate'
                                : failure.title,
                            textAlign: TextAlign.center,
                            style: Theme.of(context).textTheme.titleLarge
                                ?.copyWith(
                                  color: colors.textPrimary,
                                  letterSpacing: 0,
                                ),
                          ),
                          SizedBox(height: compact ? 5 : 7),
                          AnimatedSwitcher(
                            duration: const Duration(milliseconds: 220),
                            child: Text(
                              failure == null
                                  ? _progressLabel(_activeStep)
                                  : failure.subtitle,
                              key: ValueKey(
                                failure == null ? _activeStep : failure.kind,
                              ),
                              textAlign: TextAlign.center,
                              style: Theme.of(context).textTheme.bodyMedium
                                  ?.copyWith(
                                    color: colors.textSecondary,
                                    letterSpacing: 0,
                                  ),
                            ),
                          ),
                          if (plateHint != null && plateHint.isNotEmpty) ...[
                            SizedBox(height: compact ? 10 : 14),
                            _HintPill(label: plateHint),
                          ],
                          SizedBox(height: compact ? 16 : 22),
                          _AnalysisStepTimeline(
                            steps: _steps,
                            activeStep: _activeStep,
                            failure: failure,
                          ),
                          if (failure != null) ...[
                            SizedBox(height: compact ? 12 : 18),
                            Text(
                              failure.message,
                              textAlign: TextAlign.center,
                              style: Theme.of(context).textTheme.bodySmall
                                  ?.copyWith(color: colors.textSecondary),
                            ),
                            SizedBox(height: compact ? 10 : 12),
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
                );
              },
            ),
          ),
        ],
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
      if (error.errorCode == 'no_food_detected') {
        return const _AnalysisFailure(
          kind: _AnalysisFailureKind.invalidImage,
          title: 'No food detected',
          subtitle: 'Try another plate photo',
          message:
              'Keep the full meal visible in a clear, well-lit top-down photo. We will not use a scan credit for this attempt.',
        );
      }
      if (error.errorCode == 'no_food_scan_limit_exceeded') {
        return const _AnalysisFailure(
          kind: _AnalysisFailureKind.invalidImage,
          title: 'Scan limit paused',
          subtitle: 'Too many non-food photos',
          message:
              'Try again later with a clear meal photo. This protects your scan credits and keeps AI costs under control.',
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
        return const _AnalysisFailure(
          kind: _AnalysisFailureKind.provider,
          title: 'Still thinking',
          subtitle: 'The AI took too long',
          message:
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

class _AnalysisPhotoWash extends StatelessWidget {
  const _AnalysisPhotoWash({required this.photo});

  final CapturedMealPhoto photo;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Stack(
      fit: StackFit.expand,
      children: [
        Opacity(
          opacity: isDark ? 0.18 : 0.12,
          child: ImageFiltered(
            imageFilter: ui.ImageFilter.blur(sigmaX: 34, sigmaY: 34),
            child: Image.memory(
              photo.bytes,
              fit: BoxFit.cover,
              gaplessPlayback: true,
              errorBuilder: (context, error, stackTrace) =>
                  const SizedBox.shrink(),
            ),
          ),
        ),
        DecoratedBox(
          decoration: BoxDecoration(
            gradient: RadialGradient(
              center: const Alignment(0, -0.12),
              radius: 0.86,
              colors: [
                LogMyPlateColors.accent.withValues(alpha: isDark ? 0.08 : 0.12),
                colors.background.withValues(alpha: isDark ? 0.84 : 0.78),
                colors.background,
              ],
              stops: const [0, 0.54, 1],
            ),
          ),
        ),
      ],
    );
  }
}

class _AnalyzingMealPreview extends StatelessWidget {
  const _AnalyzingMealPreview({
    required this.photo,
    required this.animation,
    required this.width,
    required this.height,
  });

  final CapturedMealPhoto photo;
  final Animation<double> animation;
  final double width;
  final double height;

  @override
  Widget build(BuildContext context) {
    final surface = LogMyPlateHeroSurfaceStyle.of(context);

    return AnimatedBuilder(
      animation: animation,
      builder: (context, _) {
        final t = animation.value;
        final scanY = 34 + (math.sin(t * math.pi * 2) + 1) * (height * 0.32);

        return SizedBox(
          width: width,
          height: height,
          child: Stack(
            children: [
              Positioned.fill(
                child: Container(
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(34),
                    boxShadow: [
                      BoxShadow(
                        color: surface.shadowColor,
                        blurRadius: surface.isDark ? 42 : 34,
                        offset: const Offset(0, 24),
                      ),
                    ],
                  ),
                ),
              ),
              Positioned.fill(
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(34),
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
                              Colors.black.withValues(alpha: 0.12),
                              Colors.transparent,
                              Colors.black.withValues(alpha: 0.38),
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
                    borderRadius: BorderRadius.circular(34),
                    border: Border.all(color: surface.border),
                  ),
                ),
              ),
              Positioned(
                left: 26,
                right: 26,
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
                top: 18,
                left: 18,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 13,
                    vertical: 8,
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

class _AnalysisStepTimeline extends StatelessWidget {
  const _AnalysisStepTimeline({
    required this.steps,
    required this.activeStep,
    required this.failure,
  });

  final List<String> steps;
  final int activeStep;
  final _AnalysisFailure? failure;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;
    final failed = failure != null;
    final activeLabel = failed
        ? 'Needs attention'
        : steps[activeStep.clamp(0, steps.length - 1)];

    return ConstrainedBox(
      constraints: const BoxConstraints(maxWidth: 356),
      child: Container(
        padding: const EdgeInsets.fromLTRB(14, 13, 14, 12),
        decoration: BoxDecoration(
          color: colors.surfaceCard.withValues(alpha: 0.74),
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: colors.border.withValues(alpha: 0.74)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              children: [
                for (var index = 0; index < steps.length; index++) ...[
                  _StepDot(
                    done: !failed && index < activeStep,
                    active: !failed && index == activeStep,
                    failed: failed && index == activeStep,
                  ),
                  if (index < steps.length - 1)
                    Expanded(
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 180),
                        height: 2,
                        margin: const EdgeInsets.symmetric(horizontal: 6),
                        decoration: BoxDecoration(
                          color: !failed && index < activeStep
                              ? LogMyPlateColors.accent
                              : colors.border.withValues(alpha: 0.72),
                          borderRadius: BorderRadius.circular(99),
                        ),
                      ),
                    ),
                ],
              ],
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: AnimatedSwitcher(
                    duration: const Duration(milliseconds: 180),
                    child: Text(
                      activeLabel,
                      key: ValueKey(activeLabel),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        color: failed
                            ? LogMyPlateColors.destructive
                            : colors.textPrimary,
                        letterSpacing: 0,
                      ),
                    ),
                  ),
                ),
                Text(
                  failed ? 'Paused' : '${activeStep + 1}/${steps.length}',
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    color: colors.textSecondary,
                    letterSpacing: 0,
                    fontFeatures: const [FontFeature.tabularFigures()],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _StepDot extends StatelessWidget {
  const _StepDot({this.done = false, this.active = false, this.failed = false});

  final bool done;
  final bool active;
  final bool failed;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;
    final dotColor = failed
        ? LogMyPlateColors.destructive
        : done || active
        ? LogMyPlateColors.accent
        : colors.surfaceCard;
    final borderColor = failed
        ? LogMyPlateColors.destructive
        : done || active
        ? LogMyPlateColors.accent
        : colors.border;

    return AnimatedContainer(
      duration: const Duration(milliseconds: 180),
      width: active ? 22 : 18,
      height: active ? 22 : 18,
      decoration: BoxDecoration(
        color: dotColor,
        shape: BoxShape.circle,
        border: Border.all(color: borderColor, width: active ? 2 : 1.4),
        boxShadow: active || failed
            ? [
                BoxShadow(
                  color: borderColor.withValues(alpha: 0.32),
                  blurRadius: 12,
                  spreadRadius: 1,
                ),
              ]
            : null,
      ),
      child: done
          ? const Icon(
              Icons.check_rounded,
              size: 12,
              color: LogMyPlateColors.accentDeep,
            )
          : null,
    );
  }
}
