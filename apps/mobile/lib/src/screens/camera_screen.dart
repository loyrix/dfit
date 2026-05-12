import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import '../models/captured_meal_photo.dart';
import '../theme/dfit_colors.dart';
import '../theme/dfit_theme.dart';
import '../widgets/primitive_icons.dart';

class CameraScreen extends StatefulWidget {
  const CameraScreen({super.key, required this.onCaptured});

  final ValueChanged<CapturedMealPhoto> onCaptured;

  @override
  State<CameraScreen> createState() => _CameraScreenState();
}

class _CameraScreenState extends State<CameraScreen>
    with SingleTickerProviderStateMixin {
  final _picker = ImagePicker();
  bool _capturing = false;
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 2600),
  )..repeat();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _capture() async {
    if (_capturing) return;
    setState(() => _capturing = true);

    try {
      final image = await _picker.pickImage(
        source: ImageSource.camera,
        imageQuality: 82,
        maxWidth: 1600,
      );
      if (image == null) return;

      final bytes = await image.readAsBytes();
      if (!mounted) return;
      widget.onCaptured(
        CapturedMealPhoto(
          bytes: bytes,
          mimeType: _mimeTypeFor(image),
          fileName: image.name,
        ),
      );
    } finally {
      if (mounted) setState(() => _capturing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.dfit;

    return Scaffold(
      backgroundColor: colors.background,
      body: SafeArea(
        child: AnimatedBuilder(
          animation: _controller,
          builder: (context, _) {
            return Stack(
              children: [
                Positioned.fill(
                  child: CustomPaint(
                    painter: _CameraBackdropPainter(
                      progress: _controller.value,
                      colors: colors,
                    ),
                  ),
                ),
                Positioned(
                  top: 16,
                  left: 12,
                  child: IconButton(
                    onPressed: () => Navigator.of(context).pop(),
                    icon: const BackMark(),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(24, 54, 24, 24),
                  child: Column(
                    children: [
                      Text(
                        'MEAL SCAN',
                        style: Theme.of(context).textTheme.labelSmall?.copyWith(
                          color: colors.textTertiary,
                          letterSpacing: 2.4,
                        ),
                      ),
                      const SizedBox(height: 10),
                      Text(
                        _capturing ? 'Opening camera' : 'Center your plate',
                        textAlign: TextAlign.center,
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          color: colors.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 8),
                      AnimatedSwitcher(
                        duration: const Duration(milliseconds: 180),
                        child: Text(
                          _capturing
                              ? 'Keep the app open'
                              : 'Photo is analyzed, not stored',
                          key: ValueKey(_capturing),
                          textAlign: TextAlign.center,
                          style: Theme.of(context).textTheme.bodySmall
                              ?.copyWith(color: colors.textSecondary),
                        ),
                      ),
                      const SizedBox(height: 16),
                      Expanded(
                        child: Center(
                          child: FittedBox(
                            fit: BoxFit.scaleDown,
                            child: _LiveViewfinder(
                              progress: _controller.value,
                              capturing: _capturing,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                      _CaptureReadiness(progress: _controller.value),
                      const SizedBox(height: 18),
                      _ShutterButton(
                        progress: _controller.value,
                        capturing: _capturing,
                        onTap: _capture,
                      ),
                    ],
                  ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }

  String _mimeTypeFor(XFile image) {
    final mimeType = image.mimeType;
    if (mimeType == 'image/png' || mimeType == 'image/webp') return mimeType!;
    return 'image/jpeg';
  }
}

class _LiveViewfinder extends StatelessWidget {
  const _LiveViewfinder({required this.progress, required this.capturing});

  final double progress;
  final bool capturing;

  @override
  Widget build(BuildContext context) {
    final colors = context.dfit;
    const frameSize = 292.0;
    const guideSize = 238.0;
    final scanY =
        guideSize * 0.16 +
        (math.sin(progress * math.pi * 2) + 1) * guideSize * 0.34;

    return SizedBox(
      width: frameSize,
      height: frameSize,
      child: Stack(
        alignment: Alignment.center,
        children: [
          CustomPaint(
            size: Size.square(frameSize),
            painter: _FocusRingPainter(progress: progress, colors: colors),
          ),
          Container(
            width: guideSize,
            height: guideSize,
            decoration: BoxDecoration(
              color: colors.surfaceCard.withValues(alpha: 0.62),
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: colors.border, width: 0.7),
            ),
            child: Stack(
              children: [
                Align(
                  alignment: Alignment.topLeft,
                  child: const _CornerMark(angle: 0),
                ),
                Align(
                  alignment: Alignment.topRight,
                  child: _CornerMark(angle: math.pi / 2),
                ),
                Align(
                  alignment: Alignment.bottomRight,
                  child: _CornerMark(angle: math.pi),
                ),
                Align(
                  alignment: Alignment.bottomLeft,
                  child: _CornerMark(angle: math.pi * 1.5),
                ),
                Positioned.fill(
                  child: CustomPaint(
                    painter: _PlateGuidePainter(colors: colors),
                  ),
                ),
                Positioned(
                  left: 24,
                  right: 24,
                  top: scanY,
                  child: Container(
                    height: 2,
                    decoration: BoxDecoration(
                      color: DFitColors.accent,
                      borderRadius: BorderRadius.circular(99),
                      boxShadow: [
                        BoxShadow(
                          color: DFitColors.accent.withValues(alpha: 0.35),
                          blurRadius: 16,
                        ),
                      ],
                    ),
                  ),
                ),
                Center(
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 180),
                    width: capturing ? 8 : 6,
                    height: capturing ? 8 : 6,
                    decoration: const BoxDecoration(
                      color: DFitColors.accent,
                      shape: BoxShape.circle,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _CaptureReadiness extends StatelessWidget {
  const _CaptureReadiness({required this.progress});

  final double progress;

  @override
  Widget build(BuildContext context) {
    final colors = context.dfit;

    return Container(
      constraints: const BoxConstraints(maxWidth: 330),
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: colors.surfaceCard.withValues(alpha: 0.86),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: colors.border, width: 0.6),
      ),
      child: Row(
        children: [
          Expanded(
            child: _ReadinessPill(label: 'light', progress: progress, delay: 0),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: _ReadinessPill(
              label: 'top view',
              progress: progress,
              delay: 0.28,
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: _ReadinessPill(
              label: 'full plate',
              progress: progress,
              delay: 0.56,
            ),
          ),
        ],
      ),
    );
  }
}

class _ReadinessPill extends StatelessWidget {
  const _ReadinessPill({
    required this.label,
    required this.progress,
    required this.delay,
  });

  final String label;
  final double progress;
  final double delay;

  @override
  Widget build(BuildContext context) {
    final colors = context.dfit;
    final t = (progress + delay) % 1;
    final glow = 0.18 + (math.sin(t * math.pi) * 0.1);

    return Container(
      height: 38,
      padding: const EdgeInsets.symmetric(horizontal: 9),
      decoration: BoxDecoration(
        color: DFitColors.accent.withValues(alpha: glow),
        borderRadius: BorderRadius.circular(99),
        border: Border.all(
          color: DFitColors.accent.withValues(alpha: 0.35),
          width: 0.7,
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 6,
            height: 6,
            decoration: const BoxDecoration(
              color: DFitColors.accent,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 6),
          Flexible(
            child: Text(
              label,
              overflow: TextOverflow.ellipsis,
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                color: colors.accentText,
                letterSpacing: 0,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ShutterButton extends StatelessWidget {
  const _ShutterButton({
    required this.progress,
    required this.capturing,
    required this.onTap,
  });

  final double progress;
  final bool capturing;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colors = context.dfit;
    final pulse = 1 + (math.sin(progress * math.pi * 2) + 1) * 0.045;

    return GestureDetector(
      onTap: capturing ? null : onTap,
      child: Transform.scale(
        scale: capturing ? 0.96 : pulse,
        child: Container(
          width: 86,
          height: 86,
          decoration: BoxDecoration(
            border: Border.all(color: colors.textPrimary, width: 1.8),
            shape: BoxShape.circle,
            boxShadow: [
              BoxShadow(
                color: DFitColors.accent.withValues(alpha: 0.16),
                blurRadius: 26,
                spreadRadius: 1,
              ),
            ],
          ),
          child: Center(
            child: Container(
              width: 64,
              height: 64,
              decoration: const BoxDecoration(
                color: DFitColors.accent,
                shape: BoxShape.circle,
              ),
              child: Center(
                child: capturing
                    ? const SizedBox(
                        width: 24,
                        height: 24,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: DFitColors.accentDeep,
                        ),
                      )
                    : const PrimitiveCameraIcon(
                        color: DFitColors.accentDeep,
                        size: 27,
                      ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _CameraBackdropPainter extends CustomPainter {
  const _CameraBackdropPainter({required this.progress, required this.colors});

  final double progress;
  final DFitThemeColors colors;

  @override
  void paint(Canvas canvas, Size size) {
    final line = Paint()
      ..color = colors.textPrimary.withValues(alpha: 0.035)
      ..strokeWidth = 1;
    final yShift = progress * 28;

    for (var y = -28.0 + yShift; y < size.height; y += 28) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), line);
    }

    final vignette = Paint()
      ..shader = RadialGradient(
        colors: [Colors.transparent, colors.background.withValues(alpha: 0.84)],
        stops: const [0.42, 1],
      ).createShader(Offset.zero & size);

    canvas.drawRect(Offset.zero & size, vignette);
  }

  @override
  bool shouldRepaint(covariant _CameraBackdropPainter oldDelegate) {
    return oldDelegate.progress != progress || oldDelegate.colors != colors;
  }
}

class _FocusRingPainter extends CustomPainter {
  const _FocusRingPainter({required this.progress, required this.colors});

  final double progress;
  final DFitThemeColors colors;

  @override
  void paint(Canvas canvas, Size size) {
    final center = size.center(Offset.zero);
    final radius = size.width / 2 - 5;
    final base = Paint()
      ..color = DFitColors.accent.withValues(alpha: 0.12)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1;
    final arc = Paint()
      ..shader = SweepGradient(
        colors: [
          Colors.transparent,
          DFitColors.accent.withValues(alpha: 0.08),
          DFitColors.accent.withValues(alpha: 0.64),
          Colors.transparent,
        ],
        stops: const [0, 0.48, 0.78, 1],
        transform: GradientRotation(progress * math.pi * 2),
      ).createShader(Rect.fromCircle(center: center, radius: radius))
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.6
      ..strokeCap = StrokeCap.round;

    canvas.drawCircle(center, radius, base);
    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      -math.pi / 2,
      math.pi * 1.35,
      false,
      arc,
    );
  }

  @override
  bool shouldRepaint(covariant _FocusRingPainter oldDelegate) {
    return oldDelegate.progress != progress || oldDelegate.colors != colors;
  }
}

class _PlateGuidePainter extends CustomPainter {
  const _PlateGuidePainter({required this.colors});

  final DFitThemeColors colors;

  @override
  void paint(Canvas canvas, Size size) {
    final center = size.center(Offset.zero);
    final paint = Paint()
      ..color = colors.textPrimary.withValues(alpha: 0.08)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1;

    canvas.drawCircle(center, size.shortestSide * 0.31, paint);
    canvas.drawCircle(center, size.shortestSide * 0.2, paint);

    final cross = Paint()
      ..color = colors.textPrimary.withValues(alpha: 0.06)
      ..strokeWidth = 1;
    final edge = size.shortestSide * 0.11;
    final inner = size.shortestSide * 0.24;
    canvas.drawLine(Offset(center.dx, edge), Offset(center.dx, inner), cross);
    canvas.drawLine(
      Offset(center.dx, size.height - edge),
      Offset(center.dx, size.height - inner),
      cross,
    );
    canvas.drawLine(Offset(edge, center.dy), Offset(inner, center.dy), cross);
    canvas.drawLine(
      Offset(size.width - edge, center.dy),
      Offset(size.width - inner, center.dy),
      cross,
    );
  }

  @override
  bool shouldRepaint(covariant _PlateGuidePainter oldDelegate) {
    return oldDelegate.colors != colors;
  }
}

class _CornerMark extends StatelessWidget {
  const _CornerMark({required this.angle});

  final double angle;

  @override
  Widget build(BuildContext context) {
    return Transform.rotate(
      angle: angle,
      child: Container(
        width: 32,
        height: 32,
        margin: const EdgeInsets.all(14),
        decoration: const BoxDecoration(
          border: Border(
            top: BorderSide(color: DFitColors.accent, width: 2),
            left: BorderSide(color: DFitColors.accent, width: 2),
          ),
        ),
      ),
    );
  }
}
