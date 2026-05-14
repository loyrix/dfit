import 'dart:math' as math;
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:speech_to_text/speech_recognition_error.dart';
import 'package:speech_to_text/speech_recognition_result.dart';
import 'package:speech_to_text/speech_to_text.dart';

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
  final _speech = SpeechToText();
  final _hintController = TextEditingController();
  _CaptureSource? _activeSource;
  _PreparedCapture? _preparedCapture;
  bool _speechInitializing = false;
  bool _speechReady = false;
  bool _listening = false;
  String? _speechLocaleId;
  String? _hintStatus;
  String? _captureNotice;
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 2600),
  )..repeat();

  @override
  void dispose() {
    _speech.cancel();
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

    if (_speech.isListening || _listening) {
      await _speech.stop();
      if (!mounted) return;
      setState(() => _listening = false);
    }

    final hint = _hintController.text.trim();
    widget.onCaptured(preparedCapture.toMealPhoto(hint.isEmpty ? null : hint));
  }

  void _clearPreparedCapture() {
    if (_activeSource != null) return;
    setState(() {
      _preparedCapture = null;
      _captureNotice = null;
    });
  }

  Future<void> _toggleListening() async {
    if (_activeSource != null || _speechInitializing) return;
    FocusScope.of(context).unfocus();

    if (_speech.isListening || _listening) {
      await _speech.stop();
      if (!mounted) return;
      setState(() {
        _listening = false;
        _hintStatus = _hintController.text.trim().isEmpty
            ? null
            : 'Voice hint ready';
      });
      return;
    }

    setState(() {
      _speechInitializing = true;
      _hintStatus = 'Preparing microphone';
    });

    try {
      final ready = _speechReady
          ? true
          : await _speech.initialize(
              onStatus: _handleSpeechStatus,
              onError: _handleSpeechError,
              options: [SpeechToText.androidNoBluetooth],
            );
      if (!mounted) return;

      if (!ready) {
        setState(() {
          _speechReady = false;
          _listening = false;
          _hintStatus = 'Microphone unavailable. Type the hint instead.';
        });
        return;
      }

      _speechReady = true;
      _speechLocaleId ??= (await _speech.systemLocale())?.localeId;

      await _speech.listen(
        onResult: _handleSpeechResult,
        listenFor: const Duration(seconds: 14),
        pauseFor: const Duration(seconds: 3),
        localeId: _speechLocaleId,
        listenOptions: SpeechListenOptions(
          cancelOnError: true,
          partialResults: true,
          listenMode: ListenMode.dictation,
          autoPunctuation: true,
          enableHapticFeedback: true,
        ),
      );
      if (!mounted) return;
      setState(() {
        _listening = true;
        _hintStatus = 'Listening';
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _speechReady = false;
        _listening = false;
        _hintStatus = 'Voice hint paused. Type it in or try again.';
      });
    } finally {
      if (mounted) setState(() => _speechInitializing = false);
    }
  }

  void _handleSpeechResult(SpeechRecognitionResult result) {
    final words = result.recognizedWords.trim();
    if (words.isEmpty || !mounted) return;
    _hintController
      ..text = words
      ..selection = TextSelection.collapsed(offset: words.length);
    setState(() {
      _hintStatus = result.finalResult ? 'Voice hint ready' : 'Listening';
      if (result.finalResult) _listening = false;
    });
  }

  void _handleSpeechStatus(String status) {
    if (!mounted) return;
    if (status == 'listening') {
      setState(() {
        _listening = true;
        _hintStatus = 'Listening';
      });
      return;
    }

    if (status == 'done' || status == 'notListening') {
      setState(() {
        _listening = false;
        _hintStatus = _hintController.text.trim().isEmpty
            ? null
            : 'Voice hint ready';
      });
    }
  }

  void _handleSpeechError(SpeechRecognitionError error) {
    if (!mounted) return;
    final permissionIssue = error.errorMsg.toLowerCase().contains('permission');
    setState(() {
      _listening = false;
      _speechInitializing = false;
      _hintStatus = permissionIssue
          ? 'Microphone access is off. Type the hint instead.'
          : 'Voice hint paused. Type it in or try again.';
    });
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.dfit;
    final activeSource = _activeSource;
    final preparedCapture = _preparedCapture;
    final busy = activeSource != null;

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
                        activeSource?.title ??
                            (preparedCapture == null
                                ? 'Center your plate'
                                : 'Ready to analyze'),
                        textAlign: TextAlign.center,
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          color: colors.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 8),
                      AnimatedSwitcher(
                        duration: const Duration(milliseconds: 180),
                        child: Text(
                          activeSource?.subtitle ??
                              (preparedCapture == null
                                  ? 'Take a photo or upload one from your library'
                                  : 'Add context, then scan manually'),
                          key: ValueKey(
                            '$activeSource-${preparedCapture != null}',
                          ),
                          textAlign: TextAlign.center,
                          style: Theme.of(context).textTheme.bodySmall
                              ?.copyWith(color: colors.textSecondary),
                        ),
                      ),
                      const SizedBox(height: 16),
                      Expanded(
                        child: Center(
                          child: AnimatedSwitcher(
                            duration: const Duration(milliseconds: 260),
                            child: FittedBox(
                              key: ValueKey(
                                preparedCapture?.fileName ?? 'viewfinder',
                              ),
                              fit: BoxFit.scaleDown,
                              child: preparedCapture == null
                                  ? _LiveViewfinder(
                                      progress: _controller.value,
                                      capturing: busy,
                                    )
                                  : _PreparedMealPreview(
                                      capture: preparedCapture,
                                      progress: _controller.value,
                                      onClear: _clearPreparedCapture,
                                    ),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                      _PlateHintField(
                        controller: _hintController,
                        listening: _listening,
                        initializing: _speechInitializing,
                        statusText: _hintStatus,
                        onMicTap: _toggleListening,
                      ),
                      const SizedBox(height: 14),
                      AnimatedSwitcher(
                        duration: const Duration(milliseconds: 180),
                        child: preparedCapture == null
                            ? _CaptureReadiness(progress: _controller.value)
                            : _PreparedCaptureStatus(
                                source: preparedCapture.source,
                              ),
                      ),
                      AnimatedSwitcher(
                        duration: const Duration(milliseconds: 180),
                        child: _captureNotice == null
                            ? const SizedBox(height: 12)
                            : Padding(
                                padding: const EdgeInsets.only(top: 12),
                                child: _CaptureNotice(message: _captureNotice!),
                              ),
                      ),
                      const SizedBox(height: 16),
                      _CaptureActionBar(
                        progress: _controller.value,
                        activeSource: activeSource,
                        prepared: preparedCapture != null,
                        onCamera: () => _captureFrom(_CaptureSource.camera),
                        onGallery: () => _captureFrom(_CaptureSource.gallery),
                        onAnalyze: _submitPreparedCapture,
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
    final mimeType = image.mimeType?.toLowerCase();
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
                  ? 'PHOTO READY'
                  : 'UPLOAD READY',
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

class _PreparedCaptureStatus extends StatelessWidget {
  const _PreparedCaptureStatus({required this.source});

  final _CaptureSource source;

  @override
  Widget build(BuildContext context) {
    final colors = context.dfit;

    return Container(
      key: const ValueKey('prepared-capture-status'),
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
            child: _StaticStatusPill(
              label: source == _CaptureSource.camera
                  ? 'photo ready'
                  : 'upload ready',
              active: true,
            ),
          ),
          const SizedBox(width: 8),
          const Expanded(
            child: _StaticStatusPill(label: 'hint optional', active: false),
          ),
          const SizedBox(width: 8),
          const Expanded(
            child: _StaticStatusPill(label: 'not stored', active: false),
          ),
        ],
      ),
    );
  }
}

class _StaticStatusPill extends StatelessWidget {
  const _StaticStatusPill({required this.label, required this.active});

  final String label;
  final bool active;

  @override
  Widget build(BuildContext context) {
    final colors = context.dfit;

    return Container(
      height: 38,
      padding: const EdgeInsets.symmetric(horizontal: 9),
      decoration: BoxDecoration(
        color: active
            ? DFitColors.accent.withValues(alpha: 0.25)
            : colors.textPrimary.withValues(alpha: 0.06),
        borderRadius: BorderRadius.circular(99),
        border: Border.all(
          color: active
              ? DFitColors.accent.withValues(alpha: 0.38)
              : colors.border,
          width: 0.7,
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 6,
            height: 6,
            decoration: BoxDecoration(
              color: active ? DFitColors.accent : colors.textTertiary,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 6),
          Flexible(
            child: Text(
              label,
              overflow: TextOverflow.ellipsis,
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                color: active ? colors.accentText : colors.textSecondary,
                letterSpacing: 0,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _PlateHintField extends StatelessWidget {
  const _PlateHintField({
    required this.controller,
    required this.listening,
    required this.initializing,
    required this.onMicTap,
    this.statusText,
  });

  final TextEditingController controller;
  final bool listening;
  final bool initializing;
  final VoidCallback onMicTap;
  final String? statusText;

  @override
  Widget build(BuildContext context) {
    final colors = context.dfit;
    final status = statusText;

    return Container(
      constraints: const BoxConstraints(maxWidth: 330),
      padding: const EdgeInsets.fromLTRB(16, 10, 10, 10),
      decoration: BoxDecoration(
        color: colors.surfaceCard.withValues(alpha: 0.88),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: colors.border, width: 0.6),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: controller,
                  maxLength: 280,
                  maxLines: 1,
                  textInputAction: TextInputAction.done,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: colors.textPrimary,
                    letterSpacing: 0,
                  ),
                  decoration: InputDecoration(
                    counterText: '',
                    hintText: 'dal, rice, roti, sabzi',
                    labelText: "What's on the plate?",
                    labelStyle: Theme.of(context).textTheme.labelSmall
                        ?.copyWith(
                          color: colors.textSecondary,
                          letterSpacing: 0.8,
                        ),
                    hintStyle: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: colors.textTertiary,
                      letterSpacing: 0,
                    ),
                    border: InputBorder.none,
                    isDense: true,
                    contentPadding: EdgeInsets.zero,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              _VoiceHintButton(
                listening: listening,
                initializing: initializing,
                onTap: onMicTap,
              ),
            ],
          ),
          AnimatedSwitcher(
            duration: const Duration(milliseconds: 180),
            child: status == null
                ? const SizedBox.shrink()
                : Padding(
                    key: ValueKey(status),
                    padding: const EdgeInsets.only(top: 8),
                    child: Row(
                      children: [
                        Container(
                          width: 6,
                          height: 6,
                          decoration: BoxDecoration(
                            color: listening
                                ? DFitColors.accent
                                : colors.textTertiary,
                            shape: BoxShape.circle,
                          ),
                        ),
                        const SizedBox(width: 7),
                        Expanded(
                          child: Text(
                            status,
                            overflow: TextOverflow.ellipsis,
                            style: Theme.of(context).textTheme.bodySmall
                                ?.copyWith(
                                  color: colors.textSecondary,
                                  letterSpacing: 0,
                                ),
                          ),
                        ),
                      ],
                    ),
                  ),
          ),
        ],
      ),
    );
  }
}

class _VoiceHintButton extends StatelessWidget {
  const _VoiceHintButton({
    required this.listening,
    required this.initializing,
    required this.onTap,
  });

  final bool listening;
  final bool initializing;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colors = context.dfit;
    final background = listening
        ? DFitColors.accent
        : colors.textPrimary.withValues(alpha: 0.08);
    final foreground = listening ? DFitColors.accentDeep : colors.textPrimary;

    return Semantics(
      button: true,
      label: listening ? 'Stop voice hint' : 'Add voice hint',
      child: InkWell(
        onTap: initializing ? null : onTap,
        borderRadius: BorderRadius.circular(16),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          width: 42,
          height: 42,
          decoration: BoxDecoration(
            color: background,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: listening
                  ? DFitColors.accent.withValues(alpha: 0.7)
                  : colors.border,
              width: 0.7,
            ),
          ),
          child: Center(
            child: initializing
                ? SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(
                      strokeWidth: 1.8,
                      color: foreground,
                    ),
                  )
                : Icon(
                    listening ? Icons.stop_rounded : Icons.mic_rounded,
                    color: foreground,
                    size: 20,
                  ),
          ),
        ),
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

class _CaptureActionBar extends StatelessWidget {
  const _CaptureActionBar({
    required this.progress,
    required this.activeSource,
    required this.prepared,
    required this.onCamera,
    required this.onGallery,
    required this.onAnalyze,
  });

  final double progress;
  final _CaptureSource? activeSource;
  final bool prepared;
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
                    label: 'Analyze meal',
                    icon: const Icon(
                      Icons.auto_awesome_rounded,
                      color: DFitColors.accentDeep,
                      size: 20,
                    ),
                    primary: true,
                    progress: progress,
                    loading: false,
                    disabled: disabled,
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
