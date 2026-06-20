import 'dart:math' as math;
import '../theme/logmyplate_spacing.dart';
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import '../models/captured_meal_photo.dart';
import '../theme/logmyplate_colors.dart';
import '../theme/logmyplate_surfaces.dart';
import '../theme/logmyplate_theme.dart';
import '../widgets/primitive_icons.dart';
import '../widgets/glass/glass_backdrop.dart';
import '../widgets/glass/glass_cards.dart';
import '../widgets/glass/glass_surface.dart';
import '../widgets/premium_button.dart';

enum _CaptureSource {
  camera(
    ImageSource.camera,
    'camera',
    'Opening camera',
    'Hold steady. Keep the full plate in frame.',
  ),
  gallery(
    ImageSource.gallery,
    'library',
    'Opening photos',
    'Choose one clear plate photo.',
  );

  const _CaptureSource(
    this.imageSource,
    this.filePrefix,
    this.title,
    this.subtitle,
  );

  final ImageSource imageSource;
  final String filePrefix;
  final String title;
  final String subtitle;
}

class _PreparedCapture {
  const _PreparedCapture({
    required this.bytes,
    required this.mimeType,
    required this.fileName,
    required this.source,
  });

  final Uint8List bytes;
  final String mimeType;
  final String fileName;
  final _CaptureSource source;

  CapturedMealPhoto toMealPhoto(String? hint) {
    return CapturedMealPhoto(
      bytes: bytes,
      mimeType: mimeType,
      fileName: fileName,
      userHint: hint,
    );
  }
}

class CameraScreen extends StatefulWidget {
  const CameraScreen({super.key, required this.onCaptured});

  final ValueChanged<CapturedMealPhoto> onCaptured;

  @override
  State<CameraScreen> createState() => _CameraScreenState();
}

class _CameraScreenState extends State<CameraScreen>
    with SingleTickerProviderStateMixin {
  final _picker = ImagePicker();
  final _hintController = TextEditingController();
  _CaptureSource? _activeSource;
  _PreparedCapture? _preparedCapture;
  String? _captureNotice;
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 2600),
  )..repeat();

  @override
  void dispose() {
    _hintController.dispose();
    _controller.dispose();
    super.dispose();
  }

  Future<void> _captureFrom(_CaptureSource source) async {
    if (_activeSource != null) return;
    FocusScope.of(context).unfocus();
    setState(() {
      _activeSource = source;
      _captureNotice = null;
    });

    try {
      final image = await _picker.pickImage(
        source: source.imageSource,
        imageQuality: 82,
        maxWidth: 1600,
        maxHeight: 1600,
        requestFullMetadata: false,
      );
      if (image == null) return;

      final bytes = await image.readAsBytes();
      if (!mounted) return;
      setState(() {
        _preparedCapture = _PreparedCapture(
          bytes: bytes,
          mimeType: _mimeTypeFor(image),
          fileName: image.name.isEmpty
              ? '${source.filePrefix}-meal.jpg'
              : image.name,
          source: source,
        );
        _captureNotice = null;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _captureNotice = source == _CaptureSource.camera
            ? 'Camera is unavailable. Check permission or upload a meal photo.'
            : 'Could not open that photo. Try another image.';
      });
    } finally {
      if (mounted) setState(() => _activeSource = null);
    }
  }

  Future<void> _submitPreparedCapture() async {
    final preparedCapture = _preparedCapture;
    if (preparedCapture == null || _activeSource != null) return;
    FocusScope.of(context).unfocus();
    final hint = _hintController.text.trim();
    final hintWordCount = _wordCount(hint);
    if (hint.isEmpty || hintWordCount > 50) {
      setState(() {
        _captureNotice = hint.isEmpty
            ? 'Add a food note for better accuracy.'
            : 'Keep the food note within 50 words.';
      });
      return;
    }

    widget.onCaptured(preparedCapture.toMealPhoto(hint));
  }

  void _clearPreparedCapture() {
    if (_activeSource != null) return;
    setState(() {
      _preparedCapture = null;
      _captureNotice = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;
    final activeSource = _activeSource;
    final preparedCapture = _preparedCapture;
    final hintWordCount = _wordCount(_hintController.text);
    final hasValidHint =
        _hintController.text.trim().isNotEmpty && hintWordCount <= 50;

    return Scaffold(
      backgroundColor: colors.background,
      body: SafeArea(
        child: AnimatedBuilder(
          animation: _controller,
          builder: (context, _) {
            return Stack(
              children: [
                Positioned.fill(
                  child: GlassBackdrop(
                    child: const SizedBox.shrink(),
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
                Positioned.fill(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(24, 54, 24, 24),
                    child: LayoutBuilder(
                      builder: (context, constraints) {
                        final compact = constraints.maxHeight < 720;
                        final keyboardOpen =
                            MediaQuery.viewInsetsOf(context).bottom > 0;
                        final hasPhoto = preparedCapture != null;

                        return Column(
                          children: [
                            AnimatedSize(
                              duration: const Duration(milliseconds: 220),
                              curve: Curves.easeOutCubic,
                              child: keyboardOpen
                                  ? const SizedBox.shrink()
                                  : _ScanIntroCard(
                                      activeSource: activeSource,
                                      hasPhoto: hasPhoto,
                                    ),
                            ),
                            SizedBox(
                              height: keyboardOpen
                                  ? 8
                                  : compact
                                  ? 16
                                  : 22,
                            ),
                            Expanded(
                              child: LayoutBuilder(
                                builder: (context, previewConstraints) {
                                  final maxPreviewWidth = math.min(
                                    370.0,
                                    previewConstraints.maxWidth,
                                  );
                                  final emptySize = math.min(
                                    compact ? 214.0 : 292.0,
                                    math.min(
                                      previewConstraints.maxWidth,
                                      previewConstraints.maxHeight,
                                    ),
                                  );
                                  final preparedHeight = keyboardOpen
                                      ? math.min(
                                          126.0,
                                          previewConstraints.maxHeight,
                                        )
                                      : math.min(
                                          compact ? 252.0 : 330.0,
                                          previewConstraints.maxHeight,
                                        );

                                  return Center(
                                    child: AnimatedSwitcher(
                                      duration: const Duration(
                                        milliseconds: 260,
                                      ),
                                      child: preparedCapture == null
                                          ? _EmptyCaptureState(size: emptySize)
                                          : _PreparedMealPreview(
                                              key: ValueKey(
                                                preparedCapture.fileName,
                                              ),
                                              capture: preparedCapture,
                                              progress: _controller.value,
                                              onClear: _clearPreparedCapture,
                                              frameWidth: maxPreviewWidth,
                                              frameHeight: preparedHeight,
                                            ),
                                    ),
                                  );
                                },
                              ),
                            ),
                            SizedBox(
                              height: keyboardOpen
                                  ? 8
                                  : compact
                                  ? 12
                                  : 18,
                            ),
                            _CaptureComposerPanel(
                              controller: _hintController,
                              compact: compact,
                              keyboardOpen: keyboardOpen,
                              progress: _controller.value,
                              activeSource: activeSource,
                              prepared: hasPhoto,
                              canAnalyze: hasValidHint,
                              notice: _captureNotice,
                              onChanged: () =>
                                  setState(() => _captureNotice = null),
                              onCamera: () =>
                                  _captureFrom(_CaptureSource.camera),
                              onGallery: () =>
                                  _captureFrom(_CaptureSource.gallery),
                              onAnalyze: _submitPreparedCapture,
                            ),
                          ],
                        );
                      },
                    ),
                  ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }

  int _wordCount(String value) {
    return value.trim().isEmpty
        ? 0
        : value
              .trim()
              .split(RegExp(r'\s+'))
              .where((word) => word.isNotEmpty)
              .length;
  }

  String _mimeTypeFor(XFile image) {
    final mimeType = image.mimeType?.toLowerCase();
    if (mimeType == 'image/png' || mimeType == 'image/webp') return mimeType!;
    return 'image/jpeg';
  }
}

class _ScanIntroCard extends StatelessWidget {
  const _ScanIntroCard({required this.activeSource, required this.hasPhoto});

  final _CaptureSource? activeSource;
  final bool hasPhoto;

  @override
  Widget build(BuildContext context) {
    final surface = LogMyPlateHeroSurfaceStyle.of(context);

    return Column(
      children: [
        Text(
          'AI powered meal scan',
          style: Theme.of(context).textTheme.labelSmall?.copyWith(
            color: surface.textSecondary,
            letterSpacing: 1.8,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          activeSource?.title ??
              (hasPhoto ? 'Ready to analyze' : 'Add meal photo plus food note'),
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
            color: surface.textPrimary,
            height: 1.1,
          ),
        ),
        const SizedBox(height: 7),
        AnimatedSwitcher(
          duration: const Duration(milliseconds: 180),
          child: Text(
            activeSource?.subtitle ??
                (hasPhoto
                    ? 'Check the note before AI reads the plate.'
                    : 'Add a clear, well-lit photo of your entire meal then describe what you know in the food note.'),
            key: ValueKey('$activeSource-$hasPhoto'),
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: surface.textSecondary,
              height: 1.28,
            ),
          ),
        ),
      ],
    );
  }
}

class _EmptyCaptureState extends StatelessWidget {
  const _EmptyCaptureState({required this.size});

  final double size;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;
    final compact = size < 180;

    return SizedBox(
      width: size,
      height: size,
      child: Padding(
        padding: EdgeInsets.symmetric(horizontal: compact ? 12 : 28),
        child: Stack(
          alignment: Alignment.center,
          children: [
            Positioned.fill(
              child: CustomPaint(painter: _EmptyPlatePainter(colors)),
            ),
            FittedBox(
              fit: BoxFit.scaleDown,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    width: compact ? 44 : 52,
                    height: compact ? 44 : 52,
                    decoration: BoxDecoration(
                      color: LogMyPlateColors.accent.withValues(alpha: 0.18),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      Icons.restaurant_rounded,
                      color: LogMyPlateColors.accent,
                      size: compact ? 21 : 24,
                    ),
                  ),
                  if (!compact) ...[
                    const SizedBox(height: LogMyPlateSpacing.sectionSpacing),
                    Text(
                      'No photo yet',
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Use one clear plate image.',
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: colors.textSecondary,
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _EmptyPlatePainter extends CustomPainter {
  const _EmptyPlatePainter(this.colors);

  final LogMyPlateThemeColors colors;

  @override
  void paint(Canvas canvas, Size size) {
    final center = size.center(Offset.zero);
    final maxRadius = size.shortestSide / 2 - 10;
    final ringPaint = Paint()
      ..color = colors.textPrimary.withValues(alpha: 0.07)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.2;
    final accentPaint = Paint()
      ..color = LogMyPlateColors.accent.withValues(alpha: 0.22)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.2;

    canvas
      ..drawCircle(center, maxRadius, accentPaint)
      ..drawCircle(center, maxRadius * 0.72, ringPaint)
      ..drawCircle(center, maxRadius * 0.45, ringPaint);

    final guidePaint = Paint()
      ..color = colors.textPrimary.withValues(alpha: 0.045)
      ..strokeWidth = 1.1;
    final left = center.dx - maxRadius * 0.58;
    final right = center.dx + maxRadius * 0.58;
    canvas.drawLine(
      Offset(left, center.dy),
      Offset(right, center.dy),
      guidePaint,
    );
  }

  @override
  bool shouldRepaint(covariant _EmptyPlatePainter oldDelegate) {
    return oldDelegate.colors != colors;
  }
}

class _PreparedMealPreview extends StatelessWidget {
  const _PreparedMealPreview({
    super.key,
    required this.capture,
    required this.progress,
    required this.onClear,
    required this.frameWidth,
    required this.frameHeight,
  });

  final _PreparedCapture capture;
  final double progress;
  final VoidCallback onClear;
  final double frameWidth;
  final double frameHeight;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;
    final compactPreview = frameHeight < 170;
    final scanY =
        26 + (math.sin(progress * math.pi * 2) + 1) * (frameHeight * 0.30);

    return SizedBox(
      width: frameWidth,
      height: frameHeight,
      child: Stack(
        children: [
          Positioned.fill(
            child: DecoratedBox(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(28),
                border: Border.all(color: colors.border, width: 0.7),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.18),
                    blurRadius: 24,
                    offset: const Offset(0, 16),
                  ),
                ],
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(28),
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    Image.memory(
                      capture.bytes,
                      fit: BoxFit.cover,
                      gaplessPlayback: true,
                    ),
                    DecoratedBox(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          colors: [
                            Colors.black.withValues(alpha: 0.10),
                            Colors.transparent,
                            Colors.black.withValues(alpha: 0.48),
                          ],
                          stops: const [0, 0.42, 1],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          Positioned(
            left: compactPreview ? 18 : 26,
            right: compactPreview ? 18 : 26,
            top: scanY,
            child: Container(
              height: 2,
              decoration: BoxDecoration(
                color: LogMyPlateColors.accent,
                borderRadius: BorderRadius.circular(99),
                boxShadow: [
                  BoxShadow(
                    color: LogMyPlateColors.accent.withValues(alpha: 0.35),
                    blurRadius: 16,
                  ),
                ],
              ),
            ),
          ),
          if (!compactPreview)
            Positioned(
              top: 16,
              left: 16,
              child: _PreviewChip(
                label: capture.source == _CaptureSource.camera
                    ? 'Photo ready'
                    : 'Upload ready',
              ),
            ),
          Positioned(
            top: compactPreview ? 8 : 14,
            right: compactPreview ? 8 : 14,
            child: _PreviewClearButton(onTap: onClear),
          ),
        ],
      ),
    );
  }
}

class _PreviewClearButton extends StatelessWidget {
  const _PreviewClearButton({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: 'Remove selected photo',
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(99),
        child: Container(
          width: 38,
          height: 38,
          decoration: BoxDecoration(
            color: Colors.black.withValues(alpha: 0.42),
            shape: BoxShape.circle,
            border: Border.all(color: Colors.white.withValues(alpha: 0.16)),
          ),
          child: const Icon(Icons.close_rounded, color: Colors.white, size: 19),
        ),
      ),
    );
  }
}

class _PreviewChip extends StatelessWidget {
  const _PreviewChip({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return GlassPill(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
      child: Text(
        label,
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
          color: Colors.white,
          letterSpacing: 1.2,
        ),
      ),
    );
  }
}

class _PlateHintField extends StatelessWidget {
  const _PlateHintField({
    required this.controller,
    required this.compact,
    required this.keyboardOpen,
    required this.onChanged,
  });

  final TextEditingController controller;
  final bool compact;
  final bool keyboardOpen;
  final VoidCallback onChanged;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;

    return ValueListenableBuilder<TextEditingValue>(
      valueListenable: controller,
      builder: (context, value, _) {
        final text = value.text.trim();
        final empty = text.isEmpty;

        return LiteGlassCard(
          padding: const EdgeInsets.fromLTRB(15, 14, 12, 12),
          borderRadius: BorderRadius.circular(22),
          child: _buildContent(context, colors, empty),
        );
      },
    );
  }

  Widget _buildContent(BuildContext context, LogMyPlateThemeColors colors, bool empty) {
    final text = controller.text.trim();
    final wordCount = empty
        ? 0
        : text
              .split(RegExp(r'\s+'))
              .where((word) => word.isNotEmpty)
              .length;
    final overLimit = wordCount > 50;

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: TextField(
                controller: controller,
                maxLength: 280,
                minLines: keyboardOpen
                    ? 2
                    : compact
                    ? 3
                    : 4,
                maxLines: keyboardOpen ? 5 : 8,
                onChanged: (_) => onChanged(),
                textInputAction: TextInputAction.newline,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: colors.textPrimary,
                  letterSpacing: 0,
                ),
                decoration: InputDecoration(
                  counterText: '',
                  hintText: 'e.g. 2 eggs, toast, and orange juice',
                  labelText: 'Food note:*',
                  labelStyle: Theme.of(context).textTheme.labelSmall
                      ?.copyWith(
                        color: colors.textSecondary,
                        letterSpacing: 0.8,
                      ),
                  hintStyle: Theme.of(context).textTheme.bodyMedium
                      ?.copyWith(
                        color: colors.textTertiary,
                        letterSpacing: 0,
                        height: 1.3,
                      ),
                  border: InputBorder.none,
                  isDense: true,
                  contentPadding: EdgeInsets.zero,
                ),
              ),
            ),
            const SizedBox(width: 8),
            const _VoiceHintButton(),
          ],
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(
              child: Text(
                '*Required for accuracy',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: empty
                      ? colors.accentText
                      : overLimit
                      ? colors.accentText
                      : colors.textSecondary,
                ),
              ),
            ),
            const SizedBox(width: 8),
            Text(
              '$wordCount/ 50 words',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: overLimit
                    ? colors.accentText
                    : colors.textSecondary,
                fontFeatures: const [FontFeature.tabularFigures()],
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _CaptureComposerPanel extends StatelessWidget {
  const _CaptureComposerPanel({
    required this.controller,
    required this.compact,
    required this.keyboardOpen,
    required this.progress,
    required this.activeSource,
    required this.prepared,
    required this.canAnalyze,
    required this.notice,
    required this.onChanged,
    required this.onCamera,
    required this.onGallery,
    required this.onAnalyze,
  });

  final TextEditingController controller;
  final bool compact;
  final bool keyboardOpen;
  final double progress;
  final _CaptureSource? activeSource;
  final bool prepared;
  final bool canAnalyze;
  final String? notice;
  final VoidCallback onChanged;
  final VoidCallback onCamera;
  final VoidCallback onGallery;
  final VoidCallback onAnalyze;

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      padding: EdgeInsets.all(keyboardOpen ? 10 : 12),
      borderRadius: BorderRadius.circular(30),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          _PlateHintField(
            controller: controller,
            compact: compact,
            keyboardOpen: keyboardOpen,
            onChanged: onChanged,
          ),
          AnimatedSwitcher(
            duration: const Duration(milliseconds: 180),
            child: notice == null
                ? const SizedBox(height: 10)
                : Padding(
                    padding: const EdgeInsets.only(top: 10),
                    child: _CaptureNotice(message: notice!),
                  ),
          ),
          _CaptureActionBar(
            progress: progress,
            activeSource: activeSource,
            prepared: prepared,
            canAnalyze: canAnalyze,
            compact: compact,
            onCamera: onCamera,
            onGallery: onGallery,
            onAnalyze: onAnalyze,
          ),
        ],
      ),
    );
  }
}

class _VoiceHintButton extends StatelessWidget {
  const _VoiceHintButton();

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;
    return GestureDetector(
      onTap: () {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('Voice input coming soon'),
            behavior: SnackBarBehavior.floating,
            duration: const Duration(seconds: 2),
            margin: const EdgeInsets.fromLTRB(16, 0, 16, 24),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
        );
      },
      child: Semantics(
        button: true,
        label: 'Voice input coming soon',
        child: GlassSurface(
          isPremium: false,
          borderRadius: BorderRadius.circular(LogMyPlateSpacing.cardBorderRadius),
          child: SizedBox(
            width: 42,
            height: 42,
            child: Icon(Icons.mic_rounded, color: colors.textTertiary, size: 20),
          ),
        ),
      ),
    );
  }
}

class _CaptureActionBar extends StatelessWidget {
  const _CaptureActionBar({
    required this.progress,
    required this.activeSource,
    required this.prepared,
    required this.canAnalyze,
    required this.compact,
    required this.onCamera,
    required this.onGallery,
    required this.onAnalyze,
  });

  final double progress;
  final _CaptureSource? activeSource;
  final bool prepared;
  final bool canAnalyze;
  final bool compact;
  final VoidCallback onCamera;
  final VoidCallback onGallery;
  final VoidCallback onAnalyze;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;
    final disabled = activeSource != null;

    return AnimatedSize(
      duration: const Duration(milliseconds: 220),
      curve: Curves.easeOutCubic,
      child: prepared
          ? Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                _CaptureButton(
                  label: 'Analyze plate',
                  icon: const Icon(
                    Icons.auto_awesome_rounded,
                    size: 20,
                  ),
                  primary: true,
                  progress: progress,
                  loading: false,
                  disabled: disabled || !canAnalyze,
                  height: compact ? 52 : 58,
                  onTap: onAnalyze,
                ),
                SizedBox(height: compact ? 6 : 8),
                Row(
                  children: [
                    Expanded(
                      child: _CaptureButton(
                        label: 'Retake',
                        icon: Icon(
                          Icons.photo_camera_rounded,
                          color: colors.textPrimary,
                          size: 18,
                        ),
                        primary: false,
                        progress: progress,
                        loading: activeSource == _CaptureSource.camera,
                        disabled:
                            disabled && activeSource != _CaptureSource.camera,
                        height: compact ? 42 : 44,
                        onTap: onCamera,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: _CaptureButton(
                        label: 'Change',
                        icon: Icon(
                          Icons.photo_library_rounded,
                          color: colors.textPrimary,
                          size: 18,
                        ),
                        primary: false,
                        progress: progress,
                        loading: activeSource == _CaptureSource.gallery,
                        disabled:
                            disabled && activeSource != _CaptureSource.gallery,
                        height: compact ? 42 : 44,
                        onTap: onGallery,
                      ),
                    ),
                  ],
                ),
              ],
            )
          : Row(
              children: [
                Expanded(
                  child: _CaptureButton(
                    label: 'Take Photo',
                    icon: const PrimitiveCameraIcon(
                      size: 22,
                    ),
                    primary: true,
                    progress: progress,
                    loading: activeSource == _CaptureSource.camera,
                    disabled: disabled && activeSource != _CaptureSource.camera,
                    onTap: onCamera,
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: _CaptureButton(
                    label: 'Gallery',
                    icon: Icon(
                      Icons.photo_library_rounded,
                      color: colors.textPrimary,
                      size: 21,
                    ),
                    primary: false,
                    progress: progress,
                    loading: activeSource == _CaptureSource.gallery,
                    disabled:
                        disabled && activeSource != _CaptureSource.gallery,
                    onTap: onGallery,
                  ),
                ),
              ],
            ),
    );
  }
}

class _CaptureButton extends StatelessWidget {
  const _CaptureButton({
    required this.label,
    required this.icon,
    required this.primary,
    required this.progress,
    required this.loading,
    required this.disabled,
    required this.onTap,
    this.height = 58,
  });

  final String label;
  final Widget icon;
  final bool primary;
  final double progress;
  final bool loading;
  final bool disabled;
  final VoidCallback onTap;
  final double height;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;
    final foreground = primary
        ? LogMyPlateColors.accentDeep
        : colors.textPrimary;

    if (primary) {
      return Opacity(
        opacity: disabled ? 0.46 : 1,
        child: PremiumButton.icon(
          onPressed: disabled || loading ? null : onTap,
          icon: AnimatedSwitcher(
            duration: const Duration(milliseconds: 140),
            child: loading
                ? SizedBox(
                    key: const ValueKey('spinner'),
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: Theme.of(context).brightness == Brightness.dark 
                          ? LogMyPlateColors.accentDeep 
                          : colors.primaryActionText,
                    ),
                  )
                : SizedBox(key: const ValueKey('icon'), child: icon),
          ),
          label: Text(
            label,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              fontWeight: FontWeight.w600,
              letterSpacing: 0,
            ),
          ),
        ),
      );
    }

    return Opacity(
      opacity: disabled ? 0.46 : 1,
      child: InkWell(
        onTap: disabled || loading ? null : onTap,
        borderRadius: BorderRadius.circular(LogMyPlateSpacing.heroCardBorderRadius),
        child: GlassSurface(
          isPremium: false,
          borderRadius: BorderRadius.circular(LogMyPlateSpacing.heroCardBorderRadius),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 180),
            height: height,
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                IconTheme.merge(
                  data: IconThemeData(color: foreground),
                  child: AnimatedSwitcher(
                    duration: const Duration(milliseconds: 140),
                    child: loading
                        ? SizedBox(
                            key: const ValueKey('spinner'),
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: foreground,
                            ),
                          )
                        : SizedBox(key: const ValueKey('icon'), child: icon),
                  ),
                ),
                const SizedBox(width: 8),
                Flexible(
                  child: Text(
                    label,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      color: foreground,
                      fontWeight: FontWeight.w600,
                      letterSpacing: 0,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _CaptureNotice extends StatelessWidget {
  const _CaptureNotice({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;

    return Container(
      key: ValueKey(message),
      constraints: const BoxConstraints(maxWidth: 330),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
      decoration: BoxDecoration(
        color: colors.textPrimary.withValues(alpha: 0.06),
        borderRadius: BorderRadius.circular(LogMyPlateSpacing.elementBorderRadius),
        border: Border.all(color: colors.border, width: 0.6),
      ),
      child: Row(
        children: [
          Icon(
            Icons.info_outline_rounded,
            size: 16,
            color: colors.textSecondary,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              message,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: colors.textSecondary,
                letterSpacing: 0,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

