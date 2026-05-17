import 'dart:math' as math;
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import '../models/captured_meal_photo.dart';
import '../theme/dfit_colors.dart';
import '../theme/dfit_theme.dart';
import '../widgets/primitive_icons.dart';

enum _CaptureSource {
  camera(
    ImageSource.camera,
    'camera',
    'Opening camera',
    'Keep the plate steady',
  ),
  gallery(
    ImageSource.gallery,
    'library',
    'Opening library',
    'Choose a clear meal photo',
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
            ? 'Add a short food note before scanning.'
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
    final colors = context.dfit;
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
                Positioned.fill(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(24, 54, 24, 24),
                    child: LayoutBuilder(
                      builder: (context, constraints) {
                        final previewHeight = constraints.maxHeight < 680
                            ? 210.0
                            : 292.0;
                        final hasPhoto = preparedCapture != null;

                        return Column(
                          children: [
                            Expanded(
                              child: ListView(
                                physics: const BouncingScrollPhysics(),
                                children: [
                                  Text(
                                    'Meal Scan',
                                    style: Theme.of(context)
                                        .textTheme
                                        .labelSmall
                                        ?.copyWith(
                                          color: colors.textTertiary,
                                          letterSpacing: 2.4,
                                        ),
                                  ),
                                  const SizedBox(height: 10),
                                  Text(
                                    activeSource?.title ??
                                        'Tell us what is on the plate',
                                    textAlign: TextAlign.center,
                                    style: Theme.of(context)
                                        .textTheme
                                        .titleLarge
                                        ?.copyWith(color: colors.textPrimary),
                                  ),
                                  const SizedBox(height: 8),
                                  AnimatedSwitcher(
                                    duration: const Duration(milliseconds: 180),
                                    child: Text(
                                      activeSource?.subtitle ??
                                          'A short note helps DFit tell similar dishes apart.',
                                      key: ValueKey(
                                        '$activeSource-${preparedCapture != null}',
                                      ),
                                      textAlign: TextAlign.center,
                                      style: Theme.of(context)
                                          .textTheme
                                          .bodySmall
                                          ?.copyWith(
                                            color: colors.textSecondary,
                                          ),
                                    ),
                                  ),
                                  const SizedBox(height: 16),
                                  _PlateHintField(
                                    controller: _hintController,
                                    onChanged: () =>
                                        setState(() => _captureNotice = null),
                                  ),
                                  SizedBox(height: hasPhoto ? 18 : 22),
                                  SizedBox(
                                    height: previewHeight,
                                    child: Center(
                                      child: AnimatedSwitcher(
                                        duration: const Duration(
                                          milliseconds: 260,
                                        ),
                                        child: FittedBox(
                                          key: ValueKey(
                                            preparedCapture?.fileName ??
                                                'viewfinder',
                                          ),
                                          fit: BoxFit.scaleDown,
                                          child: preparedCapture == null
                                              ? const _EmptyCaptureState()
                                              : _PreparedMealPreview(
                                                  capture: preparedCapture,
                                                  progress: _controller.value,
                                                  onClear:
                                                      _clearPreparedCapture,
                                                ),
                                        ),
                                      ),
                                    ),
                                  ),
                                  AnimatedSwitcher(
                                    duration: const Duration(milliseconds: 180),
                                    child: _captureNotice == null
                                        ? const SizedBox(height: 12)
                                        : Padding(
                                            padding: const EdgeInsets.only(
                                              top: 12,
                                            ),
                                            child: _CaptureNotice(
                                              message: _captureNotice!,
                                            ),
                                          ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 16),
                            _CaptureActionBar(
                              progress: _controller.value,
                              activeSource: activeSource,
                              prepared: preparedCapture != null,
                              canAnalyze: hasValidHint,
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

class _EmptyCaptureState extends StatelessWidget {
  const _EmptyCaptureState();

  @override
  Widget build(BuildContext context) {
    final colors = context.dfit;

    return Container(
      width: 292,
      height: 210,
      padding: const EdgeInsets.symmetric(horizontal: 28),
      decoration: BoxDecoration(
        color: colors.surfaceCard.withValues(alpha: 0.62),
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: colors.border, width: 0.7),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(
              color: DFitColors.accent.withValues(alpha: 0.18),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.restaurant_rounded,
              color: DFitColors.accent,
              size: 24,
            ),
          ),
          const SizedBox(height: 16),
          Text(
            'Add a meal photo',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 6),
          Text(
            'Keep the full plate visible for better accuracy.',
            textAlign: TextAlign.center,
            style: Theme.of(
              context,
            ).textTheme.bodySmall?.copyWith(color: colors.textSecondary),
          ),
        ],
      ),
    );
  }
}

class _PreparedMealPreview extends StatelessWidget {
  const _PreparedMealPreview({
    required this.capture,
    required this.progress,
    required this.onClear,
  });

  final _PreparedCapture capture;
  final double progress;
  final VoidCallback onClear;

  @override
  Widget build(BuildContext context) {
    final colors = context.dfit;
    const frameSize = 292.0;
    final scanY = 40 + (math.sin(progress * math.pi * 2) + 1) * 94;

    return SizedBox(
      width: frameSize,
      height: frameSize,
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
          Positioned(
            top: 16,
            left: 16,
            child: _PreviewChip(
              label: capture.source == _CaptureSource.camera
                  ? 'Photo Ready'
                  : 'Upload Ready',
            ),
          ),
          Positioned(
            top: 14,
            right: 14,
            child: _PreviewClearButton(onTap: onClear),
          ),
          Positioned(
            left: 18,
            right: 18,
            bottom: 18,
            child: Row(
              children: [
                Container(
                  width: 34,
                  height: 34,
                  decoration: BoxDecoration(
                    color: DFitColors.accent,
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Icon(
                    capture.source == _CaptureSource.camera
                        ? Icons.photo_camera_rounded
                        : Icons.photo_library_rounded,
                    color: DFitColors.accentDeep,
                    size: 18,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    'Review hint before scan',
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Colors.white,
                      fontWeight: FontWeight.w600,
                      letterSpacing: 0,
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
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.42),
        borderRadius: BorderRadius.circular(99),
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
  const _PlateHintField({required this.controller, required this.onChanged});

  final TextEditingController controller;
  final VoidCallback onChanged;

  @override
  Widget build(BuildContext context) {
    final colors = context.dfit;

    return Container(
      constraints: const BoxConstraints(maxWidth: 330),
      padding: const EdgeInsets.fromLTRB(16, 16, 10, 14),
      decoration: BoxDecoration(
        color: colors.surfaceCard.withValues(alpha: 0.88),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: colors.border, width: 0.6),
      ),
      child: ValueListenableBuilder<TextEditingValue>(
        valueListenable: controller,
        builder: (context, value, _) {
          final text = value.text.trim();
          final wordCount = text.isEmpty
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
                      minLines: 4,
                      maxLines: null,
                      onChanged: (_) => onChanged(),
                      textInputAction: TextInputAction.newline,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: colors.textPrimary,
                        letterSpacing: 0,
                      ),
                      decoration: InputDecoration(
                        counterText: '',
                        hintText:
                            'Example: 2 rotis, dal, jeera rice and mixed veg sabzi',
                        labelText: 'Food note',
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
                      'Required',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: overLimit
                            ? colors.accentText
                            : colors.textSecondary,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    '$wordCount / 50 words',
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
        },
      ),
    );
  }
}

class _VoiceHintButton extends StatelessWidget {
  const _VoiceHintButton();

  @override
  Widget build(BuildContext context) {
    final colors = context.dfit;
    return Tooltip(
      message: 'Voice input coming soon',
      child: Semantics(
        button: true,
        enabled: false,
        label: 'Voice input coming soon',
        child: Container(
          width: 42,
          height: 42,
          decoration: BoxDecoration(
            color: colors.textPrimary.withValues(alpha: 0.05),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: colors.border, width: 0.7),
          ),
          child: Icon(Icons.mic_rounded, color: colors.textTertiary, size: 20),
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
    required this.onCamera,
    required this.onGallery,
    required this.onAnalyze,
  });

  final double progress;
  final _CaptureSource? activeSource;
  final bool prepared;
  final bool canAnalyze;
  final VoidCallback onCamera;
  final VoidCallback onGallery;
  final VoidCallback onAnalyze;

  @override
  Widget build(BuildContext context) {
    final colors = context.dfit;
    final disabled = activeSource != null;

    return AnimatedSize(
      duration: const Duration(milliseconds: 220),
      curve: Curves.easeOutCubic,
      child: Container(
        constraints: const BoxConstraints(maxWidth: 330),
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: colors.surfaceCard.withValues(alpha: 0.84),
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: colors.border, width: 0.6),
        ),
        child: prepared
            ? Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  _CaptureButton(
                    label: 'Analyze plate',
                    icon: const Icon(
                      Icons.auto_awesome_rounded,
                      color: DFitColors.accentDeep,
                      size: 20,
                    ),
                    primary: true,
                    progress: progress,
                    loading: false,
                    disabled: disabled || !canAnalyze,
                    onTap: onAnalyze,
                  ),
                  const SizedBox(height: 8),
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
                          height: 44,
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
                              disabled &&
                              activeSource != _CaptureSource.gallery,
                          height: 44,
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
                      label: 'Take photo',
                      icon: const PrimitiveCameraIcon(
                        color: DFitColors.accentDeep,
                        size: 22,
                      ),
                      primary: true,
                      progress: progress,
                      loading: activeSource == _CaptureSource.camera,
                      disabled:
                          disabled && activeSource != _CaptureSource.camera,
                      onTap: onCamera,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: _CaptureButton(
                      label: 'Upload',
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
    final colors = context.dfit;
    final pulse = primary
        ? 0.02 + math.sin(progress * math.pi * 2) * 0.018
        : 0.0;
    final background = primary
        ? DFitColors.accent
        : colors.textPrimary.withValues(alpha: 0.06);
    final foreground = primary ? DFitColors.accentDeep : colors.textPrimary;

    return Opacity(
      opacity: disabled ? 0.46 : 1,
      child: InkWell(
        onTap: disabled || loading ? null : onTap,
        borderRadius: BorderRadius.circular(18),
        child: AnimatedScale(
          duration: const Duration(milliseconds: 180),
          scale: loading ? 0.98 : 1 + pulse,
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 180),
            height: height,
            padding: const EdgeInsets.symmetric(horizontal: 12),
            decoration: BoxDecoration(
              color: background,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(
                color: primary
                    ? DFitColors.accent.withValues(alpha: 0.66)
                    : colors.border,
                width: 0.7,
              ),
              boxShadow: primary
                  ? [
                      BoxShadow(
                        color: DFitColors.accent.withValues(alpha: 0.16),
                        blurRadius: 18,
                        offset: const Offset(0, 8),
                      ),
                    ]
                  : null,
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                AnimatedSwitcher(
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
                const SizedBox(width: 8),
                Flexible(
                  child: Text(
                    label,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
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
    final colors = context.dfit;

    return Container(
      key: ValueKey(message),
      constraints: const BoxConstraints(maxWidth: 330),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
      decoration: BoxDecoration(
        color: colors.textPrimary.withValues(alpha: 0.06),
        borderRadius: BorderRadius.circular(14),
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
