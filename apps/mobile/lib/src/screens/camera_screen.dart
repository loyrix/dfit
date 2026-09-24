import 'dart:async';
import 'dart:math' as math;
import '../theme/logmyplate_spacing.dart';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:image_picker/image_picker.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

import '../models/captured_meal_photo.dart';
import '../services/meal_photo_optimizer.dart';
import '../theme/logmyplate_colors.dart';
import '../theme/logmyplate_surfaces.dart';
import '../theme/logmyplate_theme.dart';
import '../widgets/primitive_icons.dart';
import '../widgets/glass/glass_backdrop.dart';
import '../widgets/glass/glass_cards.dart';
import '../widgets/glass/glass_surface.dart';
import '../widgets/logmyplate_notice.dart';
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

enum CameraScanMode { photo, barcode }

class CameraScreen extends StatefulWidget {
  const CameraScreen({
    super.key,
    required this.onCaptured,
    this.onBarcodeScanned,
    this.initialMode = CameraScanMode.photo,
  });

  final ValueChanged<CapturedMealPhoto> onCaptured;
  final ValueChanged<String>? onBarcodeScanned;
  final CameraScanMode initialMode;

  @override
  State<CameraScreen> createState() => _CameraScreenState();
}

class _CameraScreenState extends State<CameraScreen>
    with SingleTickerProviderStateMixin {
  final _picker = ImagePicker();
  final _hintController = TextEditingController();
  late CameraScanMode _mode = widget.initialMode;
  MobileScannerController? _scannerController;
  bool _torchEnabled = false;
  bool _barcodeDetected = false;
  _CaptureSource? _activeSource;
  _PreparedCapture? _preparedCapture;
  String? _captureNotice;
  // Drives the scan-line sweep over the photo preview. Only runs while a
  // prepared capture is showing — nothing else on this screen animates, so
  // the loop stays stopped otherwise.
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 2600),
  );

  @override
  void initState() {
    super.initState();
    if (_mode == CameraScanMode.barcode) {
      _initBarcodeScanner();
    }
  }

  void _syncScanAnimation() {
    if (_mode == CameraScanMode.barcode) {
      if (!_controller.isAnimating) _controller.repeat();
      return;
    }
    if (_preparedCapture == null) {
      _controller.stop();
    } else if (!_controller.isAnimating) {
      _controller.repeat();
    }
  }

  void _setMode(CameraScanMode mode) {
    if (_mode == mode) return;
    unawaited(HapticFeedback.selectionClick());
    setState(() {
      _mode = mode;
      _barcodeDetected = false;
    });
    if (mode == CameraScanMode.barcode) {
      _initBarcodeScanner();
    } else {
      _stopBarcodeScanner();
    }
  }

  void _initBarcodeScanner() {
    _scannerController?.dispose();
    _scannerController = MobileScannerController(
      detectionSpeed: DetectionSpeed.normal,
      facing: CameraFacing.back,
      torchEnabled: false,
    );
    _torchEnabled = false;
    if (!_controller.isAnimating) {
      _controller.repeat();
    }
  }

  void _stopBarcodeScanner() {
    _scannerController?.dispose();
    _scannerController = null;
    _torchEnabled = false;
    _syncScanAnimation();
  }

  Future<void> _toggleTorch() async {
    final controller = _scannerController;
    if (controller == null) return;
    try {
      await controller.toggleTorch();
      if (mounted) {
        setState(() => _torchEnabled = !_torchEnabled);
      }
    } catch (_) {}
  }

  void _onBarcodeDetected(String barcode) {
    if (_barcodeDetected) return;
    setState(() => _barcodeDetected = true);
    unawaited(HapticFeedback.mediumImpact());
    widget.onBarcodeScanned?.call(barcode);
  }

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

      // Re-encode toward JPEG with a hard byte ceiling. The picker's
      // imageQuality only compresses JPEG, so PNG picks (screenshots, some
      // gallery sources) could exceed the API's upload body limit and fail
      // with a 413 after a full upload attempt.
      final optimized = await optimizeMealPhotoForUpload(
        bytes,
        _mimeTypeFor(image),
      );
      if (!mounted) return;
      if (optimized == null) {
        setState(() {
          _captureNotice =
              'That photo is too large to analyze. Try another photo.';
        });
        return;
      }

      setState(() {
        _preparedCapture = _PreparedCapture(
          bytes: optimized.bytes,
          mimeType: optimized.mimeType,
          fileName: image.name.isEmpty
              ? '${source.filePrefix}-meal.jpg'
              : image.name,
          source: source,
        );
        _captureNotice = null;
      });
      _syncScanAnimation();
      unawaited(HapticFeedback.lightImpact());
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
    _syncScanAnimation();
  }

  Future<void> _showManualBarcodeDialog(BuildContext context) async {
    final barcode = await showDialog<String>(
      context: context,
      builder: (_) => const _ManualBarcodeDialog(),
    );

    if (barcode != null && barcode.isNotEmpty && mounted) {
      _onBarcodeDetected(barcode);
    }
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
        child: Stack(
          children: [
            Positioned.fill(
              child: GlassBackdrop(child: const SizedBox.shrink()),
            ),
            Positioned(
              top: 12,
              left: 12,
              right: 12,
              child: Row(
                children: [
                  IconButton(
                    tooltip: 'Back',
                    onPressed: () => Navigator.of(context).pop(),
                    icon: const BackMark(),
                  ),
                  const Spacer(),
                  if (_preparedCapture == null && widget.onBarcodeScanned != null)
                    _ScanModeSelector(
                      selectedMode: _mode,
                      onModeChanged: _setMode,
                    ),
                  const Spacer(),
                  const SizedBox(width: 48),
                ],
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

                    if (_mode == CameraScanMode.barcode) {
                      return _BarcodeScannerView(
                        controller: _scannerController,
                        laserAnimation: _controller,
                        torchEnabled: _torchEnabled,
                        onToggleTorch: _toggleTorch,
                        onBarcodeDetected: _onBarcodeDetected,
                        onEnterManually: () => _showManualBarcodeDialog(context),
                        compact: compact,
                      );
                    }

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
                                  duration: const Duration(milliseconds: 260),
                                  child: preparedCapture == null
                                      ? _EmptyCaptureState(size: emptySize)
                                      : _PreparedMealPreview(
                                          key: ValueKey(
                                            preparedCapture.fileName,
                                          ),
                                          capture: preparedCapture,
                                          progress: _controller,
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
                          activeSource: activeSource,
                          prepared: hasPhoto,
                          canAnalyze: hasValidHint,
                          notice: _captureNotice,
                          onChanged: () =>
                              setState(() => _captureNotice = null),
                          onCamera: () => _captureFrom(_CaptureSource.camera),
                          onGallery: () => _captureFrom(_CaptureSource.gallery),
                          onAnalyze: _submitPreparedCapture,
                        ),
                      ],
                    );
                  },
                ),
              ),
            ),
          ],
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
  void paint(Canvas canvas, Size size) {}

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
  final Animation<double> progress;
  final VoidCallback onClear;
  final double frameWidth;
  final double frameHeight;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;
    final compactPreview = frameHeight < 170;
    final devicePixelRatio = MediaQuery.devicePixelRatioOf(context);

    return SizedBox(
      width: frameWidth,
      height: frameHeight,
      child: Stack(
        children: [
          // The photo and its scrim never change while the scan line sweeps;
          // the boundary keeps their raster cached instead of repainting the
          // image every animation frame.
          Positioned.fill(
            child: RepaintBoundary(
              child: DecoratedBox(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(
                    LogMyPlateSpacing.sheetBorderRadius,
                  ),
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
                  borderRadius: BorderRadius.circular(
                    LogMyPlateSpacing.sheetBorderRadius,
                  ),
                  child: Stack(
                    fit: StackFit.expand,
                    children: [
                      Image.memory(
                        capture.bytes,
                        fit: BoxFit.cover,
                        gaplessPlayback: true,
                        cacheWidth: (frameWidth * devicePixelRatio).round(),
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
          ),
          // Only this AnimatedBuilder re-runs per animation frame; the rest
          // of the screen builds once per state change.
          AnimatedBuilder(
            animation: progress,
            builder: (context, child) {
              final scanY =
                  26 +
                  (math.sin(progress.value * math.pi * 2) + 1) *
                      (frameHeight * 0.30);
              return Positioned(
                left: compactPreview ? 18 : 26,
                right: compactPreview ? 18 : 26,
                top: scanY,
                child: child!,
              );
            },
            child: Container(
              height: 2,
              decoration: BoxDecoration(
                color: LogMyPlateColors.accent,
                borderRadius: BorderRadius.circular(
                  LogMyPlateSpacing.pillBorderRadius,
                ),
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
        borderRadius: BorderRadius.circular(LogMyPlateSpacing.pillBorderRadius),
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
    // A fixed dark scrim (not a glass pill) so the light text stays legible over
    // any photo — a glass pill turns near-white in light mode, hiding the label.
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 7),
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.5),
        borderRadius: BorderRadius.circular(LogMyPlateSpacing.pillBorderRadius),
        border: Border.all(color: Colors.white.withValues(alpha: 0.16)),
      ),
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
          borderRadius: BorderRadius.circular(
            LogMyPlateSpacing.panelBorderRadius,
          ),
          child: _buildContent(context, colors, empty),
        );
      },
    );
  }

  Widget _buildContent(
    BuildContext context,
    LogMyPlateThemeColors colors,
    bool empty,
  ) {
    final text = controller.text.trim();
    final wordCount = empty
        ? 0
        : text.split(RegExp(r'\s+')).where((word) => word.isNotEmpty).length;
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
                textAlignVertical: TextAlignVertical.top,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: colors.textPrimary,
                  letterSpacing: 0,
                ),
                decoration: InputDecoration(
                  counterText: '',
                  alignLabelWithHint: true,
                  hintText: 'e.g. 2 eggs, toast, and orange juice',
                  labelText: 'Food note:*',
                  labelStyle: Theme.of(context).textTheme.labelSmall?.copyWith(
                    color: colors.textSecondary,
                    letterSpacing: 0.8,
                  ),
                  hintStyle: Theme.of(context).textTheme.bodyMedium?.copyWith(
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
                color: overLimit ? colors.accentText : colors.textSecondary,
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
      borderRadius: BorderRadius.circular(LogMyPlateSpacing.sheetBorderRadius),
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
        LogMyPlateNotice.show(
          context,
          tone: LogMyPlateNoticeTone.info,
          title: 'Coming soon',
          message: 'Voice input will be available in a future update.',
        );
      },
      child: Semantics(
        button: true,
        label: 'Voice input coming soon',
        child: GlassSurface(
          isPremium: false,
          borderRadius: BorderRadius.circular(
            LogMyPlateSpacing.cardBorderRadius,
          ),
          child: SizedBox(
            width: 42,
            height: 42,
            child: Icon(
              Icons.mic_rounded,
              color: colors.textTertiary,
              size: 20,
            ),
          ),
        ),
      ),
    );
  }
}

class _CaptureActionBar extends StatelessWidget {
  const _CaptureActionBar({
    required this.activeSource,
    required this.prepared,
    required this.canAnalyze,
    required this.compact,
    required this.onCamera,
    required this.onGallery,
    required this.onAnalyze,
  });

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
                SizedBox(
                  width: double.infinity,
                  child: _CaptureButton(
                    label: 'Analyze plate',
                    icon: const Icon(Icons.auto_awesome_rounded, size: 20),
                    primary: true,
                    loading: false,
                    disabled: disabled || !canAnalyze,
                    height: compact ? 52 : 58,
                    onTap: onAnalyze,
                  ),
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
                    icon: const PrimitiveCameraIcon(size: 22),
                    primary: true,
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
    required this.loading,
    required this.disabled,
    required this.onTap,
    this.height = 58,
  });

  final String label;
  final Widget icon;
  final bool primary;
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
          padding: const EdgeInsets.symmetric(vertical: 15, horizontal: 12),
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
        borderRadius: BorderRadius.circular(
          LogMyPlateSpacing.heroCardBorderRadius,
        ),
        child: GlassSurface(
          isPremium: false,
          borderRadius: BorderRadius.circular(
            LogMyPlateSpacing.heroCardBorderRadius,
          ),
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
        borderRadius: BorderRadius.circular(
          LogMyPlateSpacing.elementBorderRadius,
        ),
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

class _ScanModeSelector extends StatelessWidget {
  const _ScanModeSelector({
    required this.selectedMode,
    required this.onModeChanged,
  });

  final CameraScanMode selectedMode;
  final ValueChanged<CameraScanMode> onModeChanged;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;

    return GlassSurface(
      borderRadius: BorderRadius.circular(LogMyPlateSpacing.pillBorderRadius),
      child: Padding(
        padding: const EdgeInsets.all(3),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            _ModeTab(
              label: 'Plate Photo',
              icon: Icons.camera_alt_outlined,
              selected: selectedMode == CameraScanMode.photo,
              onTap: () => onModeChanged(CameraScanMode.photo),
              colors: colors,
            ),
            const SizedBox(width: 2),
            _ModeTab(
              label: 'Barcode',
              icon: Icons.qr_code_scanner_rounded,
              selected: selectedMode == CameraScanMode.barcode,
              onTap: () => onModeChanged(CameraScanMode.barcode),
              colors: colors,
            ),
          ],
        ),
      ),
    );
  }
}

class _ModeTab extends StatelessWidget {
  const _ModeTab({
    required this.label,
    required this.icon,
    required this.selected,
    required this.onTap,
    required this.colors,
  });

  final String label;
  final IconData icon;
  final bool selected;
  final VoidCallback onTap;
  final LogMyPlateThemeColors colors;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(LogMyPlateSpacing.pillBorderRadius),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: selected
                ? LogMyPlateColors.accent.withValues(alpha: 0.18)
                : Colors.transparent,
            borderRadius: BorderRadius.circular(
              LogMyPlateSpacing.pillBorderRadius,
            ),
            border: Border.all(
              color: selected
                  ? LogMyPlateColors.accent.withValues(alpha: 0.45)
                  : Colors.transparent,
              width: 0.5,
            ),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                icon,
                size: 15,
                color: selected ? colors.accentText : colors.textSecondary,
              ),
              const SizedBox(width: 5),
              Text(
                label,
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  color: selected ? colors.accentText : colors.textSecondary,
                  fontWeight: selected ? FontWeight.w600 : FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _BarcodeIntroCard extends StatelessWidget {
  const _BarcodeIntroCard({required this.compact});

  final bool compact;

  @override
  Widget build(BuildContext context) {
    final surface = LogMyPlateHeroSurfaceStyle.of(context);

    return Column(
      children: [
        Text(
          'Packaged food scanner',
          style: Theme.of(context).textTheme.labelSmall?.copyWith(
            color: surface.textSecondary,
            letterSpacing: 1.8,
          ),
        ),
        SizedBox(height: compact ? 4 : 8),
        Text(
          'Scan barcode to log food',
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
            color: surface.textPrimary,
            height: 1.1,
          ),
        ),
        SizedBox(height: compact ? 4 : 7),
        Text(
          'Instant nutrition from packaged foods and drinks via Open Food Facts.',
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
            color: surface.textSecondary,
            height: 1.28,
          ),
        ),
      ],
    );
  }
}

class _BarcodeScannerView extends StatelessWidget {
  const _BarcodeScannerView({
    required this.controller,
    required this.laserAnimation,
    required this.torchEnabled,
    required this.onToggleTorch,
    required this.onBarcodeDetected,
    required this.onEnterManually,
    required this.compact,
  });

  final MobileScannerController? controller;
  final Animation<double> laserAnimation;
  final bool torchEnabled;
  final VoidCallback onToggleTorch;
  final ValueChanged<String> onBarcodeDetected;
  final VoidCallback onEnterManually;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;

    return Column(
      children: [
        _BarcodeIntroCard(compact: compact),
        SizedBox(height: compact ? 12 : 20),
        Expanded(
          child: Center(
            child: AspectRatio(
              aspectRatio: 1.0,
              child: Container(
                constraints: const BoxConstraints(
                  maxWidth: 340,
                  maxHeight: 340,
                ),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(
                    LogMyPlateSpacing.cardBorderRadius,
                  ),
                  border: Border.all(
                    color: LogMyPlateColors.accent.withValues(alpha: 0.35),
                    width: 1.5,
                  ),
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(
                    LogMyPlateSpacing.cardBorderRadius - 1.5,
                  ),
                  child: Stack(
                    fit: StackFit.expand,
                    children: [
                      if (controller != null)
                        MobileScanner(
                          controller: controller,
                          fit: BoxFit.cover,
                          onDetect: (capture) {
                            for (final barcode in capture.barcodes) {
                              final raw =
                                  barcode.rawValue?.trim() ??
                                  barcode.displayValue?.trim();
                              if (raw != null && raw.isNotEmpty) {
                                onBarcodeDetected(raw);
                                break;
                              }
                            }
                          },
                          errorBuilder: (context, error, child) {
                            return Center(
                              child: Padding(
                                padding: const EdgeInsets.all(20),
                                child: Column(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    const Icon(
                                      Icons.camera_alt_outlined,
                                      size: 40,
                                      color: LogMyPlateColors.accent,
                                    ),
                                    const SizedBox(height: 12),
                                    Text(
                                      'Camera preview unavailable',
                                      style: Theme.of(
                                        context,
                                      ).textTheme.bodyMedium?.copyWith(
                                        color: colors.textSecondary,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        )
                      else
                        const Center(child: CircularProgressIndicator()),
                      const _BarcodeReticleOverlay(),
                      AnimatedBuilder(
                        animation: laserAnimation,
                        builder: (context, _) {
                          return CustomPaint(
                            painter: _LaserSweepPainter(
                              progress: laserAnimation.value,
                            ),
                          );
                        },
                      ),
                      Positioned(
                        top: 12,
                        right: 12,
                        child: GlassPill(
                          padding: const EdgeInsets.all(8),
                          child: InkWell(
                            onTap: onToggleTorch,
                            child: Icon(
                              torchEnabled
                                  ? Icons.flash_on_rounded
                                  : Icons.flash_off_rounded,
                              size: 20,
                              color: torchEnabled
                                  ? LogMyPlateColors.accent
                                  : colors.textSecondary,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
        SizedBox(height: compact ? 12 : 20),
        LiteGlassCard(
          borderRadius: BorderRadius.circular(
            LogMyPlateSpacing.elementBorderRadius,
          ),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Row(
            children: [
              const Icon(
                Icons.info_outline_rounded,
                size: 20,
                color: LogMyPlateColors.accent,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  'Align the barcode inside the frame. Only food items consume a scan credit.',
                  style: Theme.of(
                    context,
                  ).textTheme.bodySmall?.copyWith(color: colors.textSecondary),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        SizedBox(
          width: double.infinity,
          child: OutlinedButton.icon(
            onPressed: onEnterManually,
            icon: const Icon(Icons.keyboard_outlined, size: 18),
            label: const Text('Enter barcode manually'),
            style: OutlinedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 14),
              foregroundColor: colors.accentText,
              side: BorderSide(
                color: LogMyPlateColors.accent.withValues(alpha: 0.4),
              ),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(
                  LogMyPlateSpacing.pillBorderRadius,
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _BarcodeReticleOverlay extends StatelessWidget {
  const _BarcodeReticleOverlay();

  @override
  Widget build(BuildContext context) {
    return CustomPaint(painter: _ReticleCornerPainter());
  }
}

class _ReticleCornerPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = LogMyPlateColors.accent
      ..strokeWidth = 3.5
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    const cornerLength = 28.0;
    const padding = 16.0;

    // Top-left
    canvas.drawLine(
      const Offset(padding, padding + cornerLength),
      const Offset(padding, padding),
      paint,
    );
    canvas.drawLine(
      const Offset(padding, padding),
      const Offset(padding + cornerLength, padding),
      paint,
    );

    // Top-right
    canvas.drawLine(
      Offset(size.width - padding - cornerLength, padding),
      Offset(size.width - padding, padding),
      paint,
    );
    canvas.drawLine(
      Offset(size.width - padding, padding),
      Offset(size.width - padding, padding + cornerLength),
      paint,
    );

    // Bottom-left
    canvas.drawLine(
      Offset(padding, size.height - padding - cornerLength),
      Offset(padding, size.height - padding),
      paint,
    );
    canvas.drawLine(
      Offset(padding, size.height - padding),
      Offset(padding + cornerLength, size.height - padding),
      paint,
    );

    // Bottom-right
    canvas.drawLine(
      Offset(size.width - padding - cornerLength, size.height - padding),
      Offset(size.width - padding, size.height - padding),
      paint,
    );
    canvas.drawLine(
      Offset(size.width - padding, size.height - padding - cornerLength),
      Offset(size.width - padding, size.height - padding),
      paint,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class _LaserSweepPainter extends CustomPainter {
  const _LaserSweepPainter({required this.progress});

  final double progress;

  @override
  void paint(Canvas canvas, Size size) {
    final y = size.height * (0.1 + 0.8 * progress);
    final paint = Paint()
      ..shader = LinearGradient(
        colors: [
          LogMyPlateColors.accent.withValues(alpha: 0.0),
          LogMyPlateColors.accent.withValues(alpha: 0.85),
          LogMyPlateColors.accent.withValues(alpha: 0.0),
        ],
      ).createShader(Rect.fromLTWH(0, y - 1, size.width, 2))
      ..strokeWidth = 2.5
      ..style = PaintingStyle.stroke;

    canvas.drawLine(Offset(0, y), Offset(size.width, y), paint);

    final glowPaint = Paint()
      ..shader = LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [
          LogMyPlateColors.accent.withValues(alpha: 0.15),
          LogMyPlateColors.accent.withValues(alpha: 0.0),
        ],
      ).createShader(Rect.fromLTWH(0, y - 24, size.width, 24));

    canvas.drawRect(Rect.fromLTWH(0, y - 24, size.width, 24), glowPaint);
  }

  @override
  bool shouldRepaint(_LaserSweepPainter oldDelegate) =>
      oldDelegate.progress != progress;
}

class _ManualBarcodeDialog extends StatefulWidget {
  const _ManualBarcodeDialog();

  @override
  State<_ManualBarcodeDialog> createState() => _ManualBarcodeDialogState();
}

class _ManualBarcodeDialogState extends State<_ManualBarcodeDialog> {
  final _controller = TextEditingController();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;

    return AlertDialog(
      backgroundColor: colors.surfaceCard,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(LogMyPlateSpacing.cardBorderRadius),
        side: BorderSide(
          color: LogMyPlateColors.accent.withValues(alpha: 0.3),
          width: 0.5,
        ),
      ),
      title: Text(
        'Enter barcode',
        style: Theme.of(context).textTheme.titleMedium?.copyWith(
          color: colors.textPrimary,
        ),
      ),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Type the numbers printed below the barcode on the package (e.g. 737628064500).',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: colors.textSecondary,
            ),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _controller,
            autofocus: true,
            keyboardType: TextInputType.number,
            inputFormatters: [FilteringTextInputFormatter.digitsOnly],
            style: TextStyle(color: colors.textPrimary),
            decoration: InputDecoration(
              hintText: 'Barcode numbers',
              hintStyle: TextStyle(color: colors.textSecondary),
              filled: true,
              fillColor: LogMyPlateColors.accent.withValues(alpha: 0.08),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(
                  LogMyPlateSpacing.elementBorderRadius,
                ),
                borderSide: BorderSide(
                  color: LogMyPlateColors.accent.withValues(alpha: 0.3),
                ),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(
                  LogMyPlateSpacing.elementBorderRadius,
                ),
                borderSide: const BorderSide(color: LogMyPlateColors.accent),
              ),
            ),
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: Text('Cancel', style: TextStyle(color: colors.textSecondary)),
        ),
        PremiumButton(
          onPressed: () {
            final code = _controller.text.trim();
            if (code.isNotEmpty) {
              Navigator.of(context).pop(code);
            }
          },
          child: const Text('Look up'),
        ),
      ],
    );
  }
}

