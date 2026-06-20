import 'package:logmyplate_mobile/src/widgets/premium_button.dart';
import 'dart:math' as math;
import '../theme/logmyplate_spacing.dart';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';

import '../models/meal.dart';
import '../services/logmyplate_api_client.dart';
import '../theme/logmyplate_colors.dart';
import '../theme/logmyplate_surfaces.dart';
import '../theme/logmyplate_theme.dart';
import '../widgets/glass/glass_backdrop.dart';
import '../widgets/glass/glass_cards.dart';
import '../widgets/primitive_icons.dart';
import 'package:logmyplate_mobile/src/widgets/glass/glass_wrapper.dart';

class HealthTargetScreen extends StatefulWidget {
  const HealthTargetScreen({
    super.key,
    required this.onSave,
    this.initialTarget,
  });

  final Future<HealthTarget> Function(HealthTargetInput input) onSave;
  final HealthTarget? initialTarget;

  @override
  State<HealthTargetScreen> createState() => _HealthTargetScreenState();
}

enum _HeightUnit { metric, imperial }

const _minHealthHeightCm = 90.0;
const _maxHealthHeightCm = 250.0;
const _minHealthWeightKg = 25.0;
const _maxHealthWeightKg = 300.0;
const _minHealthAgeYears = 18;
const _maxHealthAgeYears = 90;

class _HealthTargetScreenState extends State<HealthTargetScreen> {
  double _heightCm = 170;
  double _weightKg = 70;
  int _ageYears = 28;
  HealthSex _sex = HealthSex.notSpecified;
  ActivityLevel _activityLevel = ActivityLevel.light;
  HealthGoal _goal = HealthGoal.maintain;
  bool _saving = false;
  String? _error;
  _HeightUnit _heightUnit = _HeightUnit.metric;
  late final TextEditingController _heightCmController;
  late final TextEditingController _heightFeetController;
  late final TextEditingController _heightInchesController;
  late final TextEditingController _weightController;
  late final TextEditingController _ageController;

  @override
  void initState() {
    super.initState();
    _heightCmController = TextEditingController();
    _heightFeetController = TextEditingController();
    _heightInchesController = TextEditingController();
    _weightController = TextEditingController();
    _ageController = TextEditingController();
    final target = widget.initialTarget;
    if (target != null) {
      _heightCm = target.heightCm;
      _weightKg = target.weightKg;
      _ageYears = target.ageYears;
      _sex = target.sex;
      _activityLevel = target.activityLevel;
      _goal = target.goal;
    }
    _syncHeightText();
    _weightController.text = _formatMetric(_weightKg, decimalPlaces: 1);
    _ageController.text = _ageYears.toString();
  }

  @override
  void dispose() {
    _heightCmController.dispose();
    _heightFeetController.dispose();
    _heightInchesController.dispose();
    _weightController.dispose();
    _ageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;
    final preview = _HealthPreview.calculate(
      heightCm: _heightCm,
      weightKg: _weightKg,
      ageYears: _ageYears,
      sex: _sex,
      activityLevel: _activityLevel,
      goal: _goal,
    );
    final canSave = _canSave;

    return Scaffold(
      extendBodyBehindAppBar: true,
      backgroundColor: Colors.transparent,
      body: GlassBackdrop(
        child: SafeArea(
          child: ListView(
            padding: const EdgeInsets.fromLTRB(18, 12, 18, 128),
          children: [
            Row(
              children: [
                IconButton(
                  onPressed: _saving ? null : () => Navigator.of(context).pop(),
                  icon: const BackMark(),
                ),
                const Spacer(),
                GlassWrapper(child: TextButton(
                  onPressed: _saving ? null : () => Navigator.of(context).pop(),
                  child: Text(
                    widget.initialTarget == null ? 'Set later' : 'Close',
                  ),
                )),
              ],
            ),
            const SizedBox(height: 6),
            Text(
              widget.initialTarget == null
                  ? 'Set your daily target'
                  : 'Edit daily target',
              style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                color: colors.textPrimary,
                height: 1.04,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              widget.initialTarget == null
                  ? 'A quick BMI estimate helps tune calories for your journal.'
                  : 'Update your details when your body, routine or goal changes.',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: colors.textSecondary,
                height: 1.35,
              ),
            ),
            const SizedBox(height: LogMyPlateSpacing.sectionSpacing),
            _TargetPreviewCard(preview: preview),
            const SizedBox(height: LogMyPlateSpacing.sectionSpacing),
            _HeightInputCard(
              unit: _heightUnit,
              cmController: _heightCmController,
              feetController: _heightFeetController,
              inchesController: _heightInchesController,
              enabled: !_saving,
              onUnitChanged: _setHeightUnit,
              onCmChanged: _setHeightFromCentimeters,
              onCmComplete: _normalizeMetricHeightInput,
              onImperialChanged: _setHeightFromImperialText,
              onImperialComplete: _normalizeImperialHeightInput,
            ),
            const SizedBox(height: 10),
            _NumberInputCard(
              label: 'Weight',
              controller: _weightController,
              fieldKey: const ValueKey('target-weight-input'),
              suffix: 'kg',
              decimal: true,
              enabled: !_saving,
              onTextChanged: (value) => _setWeight(value, syncText: false),
              onTextComplete: _normalizeWeightInput,
            ),
            const SizedBox(height: 10),
            _NumberInputCard(
              label: 'Age',
              controller: _ageController,
              fieldKey: const ValueKey('target-age-input'),
              suffix: 'years',
              decimal: false,
              enabled: !_saving,
              onTextChanged: (value) => _setAge(value.round(), syncText: false),
              onTextComplete: _normalizeAgeInput,
            ),
            const SizedBox(height: LogMyPlateSpacing.sectionSpacing),
            _ChoiceGroup<HealthSex>(
              label: 'Body profile',
              values: HealthSex.values,
              selected: _sex,
              labelFor: (value) => value.label,
              onSelected: _saving
                  ? null
                  : (value) => setState(() => _sex = value),
            ),
            const SizedBox(height: LogMyPlateSpacing.sectionSpacing),
            _ChoiceGroup<ActivityLevel>(
              label: 'Typical movement',
              values: ActivityLevel.values,
              selected: _activityLevel,
              labelFor: (value) => value.label,
              onSelected: _saving
                  ? null
                  : (value) => setState(() => _activityLevel = value),
            ),
            const SizedBox(height: LogMyPlateSpacing.sectionSpacing),
            _ChoiceGroup<HealthGoal>(
              label: 'Goal',
              values: HealthGoal.values,
              selected: _goal,
              labelFor: (value) => value.label,
              onSelected: _saving
                  ? null
                  : (value) => setState(() => _goal = value),
            ),
            if (_error != null) ...[
              const SizedBox(height: LogMyPlateSpacing.sectionSpacing),
              _HealthError(message: _error!),
            ],
          ],
        ),
      ),
      ),
      bottomNavigationBar: SafeArea(
        top: false,
        child: Container(
          padding: const EdgeInsets.fromLTRB(18, 12, 18, 18),
          decoration: BoxDecoration(
            color: colors.background.withValues(alpha: 0.94),
            border: Border(top: BorderSide(color: colors.border, width: 0.5)),
          ),
          child: SizedBox(
            height: 54,
            child: PremiumButton(
              onPressed: _saving || !canSave ? null : _save,
              
              child: AnimatedSwitcher(
                duration: const Duration(milliseconds: 180),
                child: _saving
                    ? SizedBox(
                        key: const ValueKey('saving-target'),
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: colors.accentText,
                        ),
                      )
                    : const Text(
                        'Save target',
                        key: ValueKey('save-target-label'),
                      ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  void _setHeightUnit(_HeightUnit unit) {
    if (_heightUnit == unit) return;
    FocusScope.of(context).unfocus();
    setState(() => _heightUnit = unit);
  }

  void _setHeightFromCentimeters(double value, {bool syncText = false}) {
    setState(() {
      _heightCm = _roundTo(
        _clampMetric(value, _minHealthHeightCm, _maxHealthHeightCm),
        1,
      );
      if (syncText) {
        _heightCmController.text = _formatMetric(_heightCm, decimalPlaces: 0);
      }
      _syncImperialHeightText();
    });
  }

  void _setWeight(double value, {bool syncText = true}) {
    setState(() {
      _weightKg = _roundTo(
        _clampMetric(value, _minHealthWeightKg, _maxHealthWeightKg),
        1,
      );
      if (syncText) {
        _weightController.text = _formatMetric(_weightKg, decimalPlaces: 1);
      }
    });
  }

  void _setAge(int value, {bool syncText = true}) {
    setState(() {
      _ageYears = value.clamp(_minHealthAgeYears, _maxHealthAgeYears);
      if (syncText) {
        _ageController.text = _ageYears.toString();
      }
    });
  }

  void _setHeightFromImperialText({bool syncText = false}) {
    if (_heightFeetController.text.isEmpty) return;
    final feet = int.tryParse(_heightFeetController.text);
    final inches = int.tryParse(_heightInchesController.text);
    if (feet == null) return;

    _setHeightFromTotalInches(
      (feet * 12 + (inches ?? 0)).toDouble(),
      syncText: syncText,
    );
  }

  void _setHeightFromTotalInches(double totalInches, {bool syncText = true}) {
    if (totalInches <= 0) return;
    setState(() {
      _heightCm = _roundTo(
        _clampMetric(
          totalInches * 2.54,
          _minHealthHeightCm,
          _maxHealthHeightCm,
        ),
        1,
      );
      _heightCmController.text = _formatMetric(_heightCm, decimalPlaces: 0);
      if (syncText) {
        _syncImperialHeightText();
      }
    });
  }

  void _normalizeMetricHeightInput() {
    final parsed = double.tryParse(_heightCmController.text);
    if (parsed == null) {
      _heightCmController.text = _formatMetric(_heightCm, decimalPlaces: 0);
      return;
    }
    _setHeightFromCentimeters(parsed.roundToDouble(), syncText: true);
  }

  void _normalizeImperialHeightInput() {
    final feet = int.tryParse(_heightFeetController.text);
    if (feet == null) {
      _syncImperialHeightText();
      return;
    }
    final inches = int.tryParse(_heightInchesController.text) ?? 0;
    _setHeightFromTotalInches((feet * 12 + inches).toDouble(), syncText: true);
  }

  void _normalizeWeightInput() {
    _setWeight(double.tryParse(_weightController.text) ?? _weightKg);
  }

  void _normalizeAgeInput() {
    _setAge(int.tryParse(_ageController.text) ?? _ageYears);
  }

  void _syncHeightText() {
    _heightCmController.text = _formatMetric(_heightCm, decimalPlaces: 0);
    _syncImperialHeightText();
  }

  void _syncImperialHeightText() {
    final totalInches = math.max(1, (_heightCm / 2.54).round());
    final feet = totalInches ~/ 12;
    final inches = totalInches % 12;
    _heightFeetController.text = feet.toString();
    _heightInchesController.text = inches.toString();
  }

  Future<void> _save() async {
    FocusScope.of(context).unfocus();
    _normalizeCurrentInputs();
    if (!_canSave) return;

    setState(() {
      _saving = true;
      _error = null;
    });

    try {
      final target = await widget.onSave(
        HealthTargetInput(
          heightCm: _heightCm,
          weightKg: _weightKg,
          ageYears: _ageYears,
          sex: _sex,
          activityLevel: _activityLevel,
          goal: _goal,
        ),
      );
      if (!mounted) return;
      Navigator.of(context).pop(target);
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _error = _saveErrorMessage(error);
      });
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  void _normalizeCurrentInputs() {
    if (_heightUnit == _HeightUnit.metric) {
      _normalizeMetricHeightInput();
    } else {
      _normalizeImperialHeightInput();
    }
    _normalizeWeightInput();
    _normalizeAgeInput();
  }

  bool get _canSave {
    final initial = widget.initialTarget;
    if (initial == null) return true;

    return _heightCm != initial.heightCm ||
        _weightKg != initial.weightKg ||
        _ageYears != initial.ageYears ||
        _sex != initial.sex ||
        _activityLevel != initial.activityLevel ||
        _goal != initial.goal;
  }

  static double _clampMetric(double value, double min, double max) {
    return math.max(min, math.min(max, value)).toDouble();
  }

  static double _roundTo(double value, int decimals) {
    final factor = math.pow(10, decimals).toDouble();
    return (value * factor).round() / factor;
  }

  static String _formatMetric(double value, {required int decimalPlaces}) {
    if (decimalPlaces == 0 || value == value.roundToDouble()) {
      return value.round().toString();
    }
    return value.toStringAsFixed(decimalPlaces);
  }

  static String _saveErrorMessage(Object error) {
    if (error is LogMyPlateApiException) {
      final message = error.message;
      if (message != null && message.trim().isNotEmpty) return message.trim();
      if (error.errorCode == 'invalid_health_target') {
        return 'Check height, weight and age values, then try again.';
      }
    }
    return 'Could not save your target. Check connection and try again.';
  }
}

class _TargetPreviewCard extends StatelessWidget {
  const _TargetPreviewCard({required this.preview});

  final _HealthPreview preview;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;
    final surface = LogMyPlateHeroSurfaceStyle.of(context);

    return Container(
      padding: const EdgeInsets.all(LogMyPlateSpacing.sectionSpacing),
      decoration: surface.decoration(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(
                'BMI overview',
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  color: surface.textSecondary,
                  letterSpacing: 1.4,
                ),
              ),
              const Spacer(),
              _HealthSourcesButton(surface: surface),
            ],
          ),
          const SizedBox(height: LogMyPlateSpacing.cardPadding),
          Row(
            children: [
              _BmiOrbit(preview: preview, surface: surface),
              const SizedBox(width: 18),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Daily target',
                      style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        color: surface.textSecondary,
                        letterSpacing: 1.5,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      '${preview.targetCalories}',
                      style: Theme.of(context).textTheme.headlineMedium
                          ?.copyWith(
                            color: surface.textPrimary,
                            fontSize: 38,
                            fontFeatures: const [FontFeature.tabularFigures()],
                          ),
                    ),
                    Text(
                      'kCal per day',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: surface.textSecondary,
                      ),
                    ),
                    const SizedBox(height: LogMyPlateSpacing.cardPadding),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 8,
                      ),
                      decoration: BoxDecoration(
                        color: colors.accent.withValues(alpha: 0.16),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: colors.accent.withValues(alpha: 0.28),
                          width: 0.6,
                        ),
                      ),
                      child: Text(
                        preview.categoryLabel,
                        style: Theme.of(context).textTheme.labelSmall?.copyWith(
                          color: surface.accentText,
                          letterSpacing: 0,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: LogMyPlateSpacing.cardPadding),
          _BmiLegend(surface: surface),
        ],
      ),
    );
  }
}

class _HealthSourcesButton extends StatelessWidget {
  const _HealthSourcesButton({required this.surface});

  final LogMyPlateHeroSurfaceStyle surface;

  @override
  Widget build(BuildContext context) {
    return GlassWrapper(child: TextButton.icon(
      onPressed: () => _showHealthSources(context),
      style: TextButton.styleFrom(
        foregroundColor: surface.accentText,
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        minimumSize: Size.zero,
        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
        visualDensity: VisualDensity.compact,
        textStyle: Theme.of(context).textTheme.labelSmall?.copyWith(
          letterSpacing: 0,
          fontWeight: FontWeight.w600,
        ),
      ),
      icon: const Icon(Icons.open_in_new_rounded, size: 13),
      label: const Text('Sources'),
    ));
  }
}

class _HealthSourcesSheet extends StatelessWidget {
  const _HealthSourcesSheet();

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;

    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.only(top: 8),
        child: GlassCard(
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 22),
          borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      'Calculation sources',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        color: colors.textPrimary,
                        height: 1.1,
                      ),
                    ),
                  ),
                  IconButton(
                    tooltip: 'Close sources',
                    onPressed: () => Navigator.of(context).pop(),
                    icon: const Icon(Icons.close_rounded),
                    color: colors.textSecondary,
                    visualDensity: VisualDensity.compact,
                  ),
                ],
              ),
              const SizedBox(height: 4),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(LogMyPlateSpacing.cardPadding),
                decoration: BoxDecoration(
                  color: colors.accent.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(LogMyPlateSpacing.heroCardBorderRadius),
                  border: Border.all(
                    color: colors.accent.withValues(alpha: 0.16),
                    width: 0.7,
                  ),
                ),
                child: Text(
                  'Review the public references used for BMI ranges and calorie-target math.',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: colors.textSecondary,
                    height: 1.35,
                  ),
                ),
              ),
              const SizedBox(height: LogMyPlateSpacing.cardPadding),
              Text(
                'Open source',
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  color: colors.textSecondary,
                  letterSpacing: 1.1,
                ),
              ),
              const SizedBox(height: 10),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  for (final source in _healthSources)
                    _HealthSourceButton(source: source, accent: colors.accent),
                ],
              ),
              const SizedBox(height: 4),
            ],
          ),
        ),
      ),
    );
  }
}

void _showHealthSources(BuildContext context) {
  showModalBottomSheet<void>(
    context: context,
    showDragHandle: false,
    backgroundColor: Colors.transparent,
    barrierColor: Colors.black.withValues(alpha: 0.48),
    builder: (_) => const _HealthSourcesSheet(),
  );
}

class _HealthSourceButton extends StatelessWidget {
  const _HealthSourceButton({required this.source, required this.accent});

  final _HealthSource source;
  final Color accent;

  @override
  Widget build(BuildContext context) {
    return ActionChip(
      label: Text(source.label),
      onPressed: () => _openHealthSource(context, source.url),
      visualDensity: VisualDensity.compact,
      materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
      side: BorderSide(color: accent.withValues(alpha: 0.26), width: 0.7),
      backgroundColor: accent.withValues(alpha: 0.10),
      labelStyle: Theme.of(context).textTheme.labelSmall?.copyWith(
        color: accent,
        letterSpacing: 0,
        height: 1,
      ),
      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 0),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(99)),
      avatar: Icon(
        Icons.open_in_new_rounded,
        size: 13,
        color: accent.withValues(alpha: 0.86),
      ),
    );
  }
}

class _HealthSource {
  const _HealthSource(this.label, this.url);

  final String label;
  final Uri url;
}

class _BmiLegend extends StatelessWidget {
  const _BmiLegend({required this.surface});

  final LogMyPlateHeroSurfaceStyle surface;

  @override
  Widget build(BuildContext context) {
    const items = [
      _BmiLegendItem('Low', '< 18.5', _bmiLowColor),
      _BmiLegendItem('Balanced', '18.5-24.9', _bmiBalancedColor),
      _BmiLegendItem('Above', '25-29.9', _bmiAboveColor),
      _BmiLegendItem('High', '30+', _bmiHighColor),
    ];

    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: [
        for (final item in items)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 7),
            decoration: BoxDecoration(
              color: surface.chipFill,
              borderRadius: BorderRadius.circular(99),
              border: Border.all(color: surface.chipBorder, width: 0.5),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(
                    color: item.color,
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 6),
                Text(
                  '${item.label} ${item.range}',
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    color: surface.textSecondary,
                    fontSize: 11,
                    height: 1,
                    letterSpacing: 0,
                  ),
                ),
              ],
            ),
          ),
      ],
    );
  }
}

class _BmiLegendItem {
  const _BmiLegendItem(this.label, this.range, this.color);

  final String label;
  final String range;
  final Color color;
}

class _BmiOrbit extends StatelessWidget {
  const _BmiOrbit({required this.preview, required this.surface});

  final _HealthPreview preview;
  final LogMyPlateHeroSurfaceStyle surface;

  @override
  Widget build(BuildContext context) {
    final activeColor = _bmiColorForScore(preview.normalizedBmi);

    return SizedBox(
      width: 132,
      height: 132,
      child: CustomPaint(
        painter: _BmiOrbitPainter(
          score: preview.normalizedBmi,
          trackColor: surface.track,
          activeColor: activeColor,
          markerOutlineColor: surface.isDark
              ? const Color(0xFF101412)
              : const Color(0xFFFFFCF4),
        ),
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                preview.bmi.toStringAsFixed(1),
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                  color: surface.textPrimary,
                  fontSize: 32,
                  fontFeatures: const [FontFeature.tabularFigures()],
                ),
              ),
              const SizedBox(height: 2),
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 5,
                    height: 5,
                    decoration: BoxDecoration(
                      color: activeColor,
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 5),
                  Text(
                    'BMI',
                    style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      color: surface.textSecondary,
                      letterSpacing: 0.8,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              Text(
                _bmiShortLabel(preview.bmi),
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  color: activeColor,
                  fontSize: 9,
                  height: 1,
                  letterSpacing: 0.8,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _BmiOrbitPainter extends CustomPainter {
  const _BmiOrbitPainter({
    required this.score,
    required this.trackColor,
    required this.activeColor,
    required this.markerOutlineColor,
  });

  final double score;
  final Color trackColor;
  final Color activeColor;
  final Color markerOutlineColor;

  static const _startAngle = math.pi * 0.75;
  static const _totalSweep = math.pi * 1.5;

  @override
  void paint(Canvas canvas, Size size) {
    final rect = Offset.zero & size;
    final center = rect.center;
    final radius = math.min(size.width, size.height) / 2 - 16;
    final gaugeRect = Rect.fromCircle(center: center, radius: radius);
    final normalized = score.clamp(0.0, 1.0);
    final activeSweep = _totalSweep * normalized;

    canvas.drawArc(
      gaugeRect,
      _startAngle,
      _totalSweep,
      false,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = 12
        ..strokeCap = StrokeCap.round
        ..color = trackColor.withValues(alpha: 0.72),
    );

    final tickRect = Rect.fromCircle(center: center, radius: radius + 11);
    for (var index = 0; index < _bmiSegments.length; index++) {
      final segment = _bmiSegments[index];
      const tickGap = 0.014;
      final start = _startAngle + _totalSweep * segment.start + tickGap;
      final sweep = _totalSweep * (segment.end - segment.start) - tickGap * 2;
      if (sweep <= 0) continue;
      final isActive =
          normalized >= segment.start &&
          (normalized < segment.end || index == _bmiSegments.length - 1);
      canvas.drawArc(
        tickRect,
        start,
        sweep,
        false,
        Paint()
          ..style = PaintingStyle.stroke
          ..strokeWidth = isActive ? 4.5 : 3.5
          ..strokeCap = StrokeCap.round
          ..color = segment.color.withValues(alpha: isActive ? 0.44 : 0.22),
      );
    }

    if (activeSweep > 0) {
      canvas.drawArc(
        gaugeRect,
        _startAngle,
        activeSweep,
        false,
        Paint()
          ..style = PaintingStyle.stroke
          ..strokeWidth = 17
          ..strokeCap = StrokeCap.round
          ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 6)
          ..color = activeColor.withValues(alpha: 0.12),
      );
      canvas.drawArc(
        gaugeRect,
        _startAngle,
        activeSweep,
        false,
        Paint()
          ..style = PaintingStyle.stroke
          ..strokeWidth = 12
          ..strokeCap = StrokeCap.round
          ..color = activeColor,
      );
    }

    final markerAngle = _startAngle + _totalSweep * normalized;
    final marker = Offset(
      center.dx + math.cos(markerAngle) * radius,
      center.dy + math.sin(markerAngle) * radius,
    );
    canvas.drawCircle(marker, 7, Paint()..color = markerOutlineColor);
    canvas.drawCircle(marker, 4.2, Paint()..color = activeColor);
  }

  @override
  bool shouldRepaint(covariant _BmiOrbitPainter oldDelegate) {
    return oldDelegate.score != score ||
        oldDelegate.trackColor != trackColor ||
        oldDelegate.activeColor != activeColor ||
        oldDelegate.markerOutlineColor != markerOutlineColor;
  }
}

const _bmiLowColor = Color(0xFF4EA6D8);
const _bmiBalancedColor = LogMyPlateColors.macroProtein;
const _bmiAboveColor = LogMyPlateColors.accent;
const _bmiHighColor = LogMyPlateColors.destructive;

const _bmiSegments = [
  _BmiSegment(0, (18.5 - 16) / (34 - 16), _bmiLowColor),
  _BmiSegment(
    (18.5 - 16) / (34 - 16),
    (25 - 16) / (34 - 16),
    _bmiBalancedColor,
  ),
  _BmiSegment((25 - 16) / (34 - 16), (30 - 16) / (34 - 16), _bmiAboveColor),
  _BmiSegment((30 - 16) / (34 - 16), 1, _bmiHighColor),
];

final _healthSources = [
  _HealthSource(
    'CDC BMI ranges',
    Uri.parse('https://www.cdc.gov/bmi/adult-calculator/bmi-categories.html'),
  ),
  _HealthSource(
    'CDC BMI guide',
    Uri.parse('https://www.cdc.gov/bmi/adult-calculator/index.html'),
  ),
  _HealthSource(
    'Calorie formula',
    Uri.parse('https://pubmed.ncbi.nlm.nih.gov/2305711/'),
  ),
];

Future<void> _openHealthSource(BuildContext context, Uri url) async {
  final opened = await launchUrl(url, mode: LaunchMode.externalApplication);
  if (opened || !context.mounted) return;

  await Clipboard.setData(ClipboardData(text: url.toString()));
  if (!context.mounted) return;

  final messenger = ScaffoldMessenger.maybeOf(context);
  messenger?.showSnackBar(const SnackBar(content: Text('Source link copied')));
}

class _BmiSegment {
  const _BmiSegment(this.start, this.end, this.color);

  final double start;
  final double end;
  final Color color;
}

Color _bmiColorForScore(double score) {
  final normalized = score.clamp(0.0, 1.0);
  for (var index = 0; index < _bmiSegments.length; index++) {
    final segment = _bmiSegments[index];
    if (normalized >= segment.start &&
        (normalized < segment.end || index == _bmiSegments.length - 1)) {
      return segment.color;
    }
  }
  return _bmiHighColor;
}

String _bmiShortLabel(double bmi) {
  if (bmi < 18.5) return 'LOW';
  if (bmi < 25) return 'BALANCED';
  if (bmi < 30) return 'ABOVE';
  return 'HIGH';
}

class _HeightInputCard extends StatelessWidget {
  const _HeightInputCard({
    required this.unit,
    required this.cmController,
    required this.feetController,
    required this.inchesController,
    required this.enabled,
    required this.onUnitChanged,
    required this.onCmChanged,
    required this.onCmComplete,
    required this.onImperialChanged,
    required this.onImperialComplete,
  });

  final _HeightUnit unit;
  final TextEditingController cmController;
  final TextEditingController feetController;
  final TextEditingController inchesController;
  final bool enabled;
  final ValueChanged<_HeightUnit> onUnitChanged;
  final ValueChanged<double> onCmChanged;
  final VoidCallback onCmComplete;
  final VoidCallback onImperialChanged;
  final VoidCallback onImperialComplete;

  @override
  Widget build(BuildContext context) {
    return _InputSurface(
      enabled: enabled,
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Height', style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 10),
                _HeightUnitSegment(
                  unit: unit,
                  enabled: enabled,
                  onChanged: onUnitChanged,
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          AnimatedSwitcher(
            duration: const Duration(milliseconds: 160),
            switchInCurve: Curves.easeOutCubic,
            switchOutCurve: Curves.easeInCubic,
            child: unit == _HeightUnit.metric
                ? SizedBox(
                    key: const ValueKey('height-metric-field'),
                    width: 148,
                    child: _TargetTextField(
                      fieldKey: const ValueKey('target-height-cm-input'),
                      controller: cmController,
                      suffix: 'cm',
                      decimal: false,
                      maxLength: 3,
                      enabled: enabled,
                      onTextChanged: onCmChanged,
                      onTextComplete: onCmComplete,
                    ),
                  )
                : SizedBox(
                    key: const ValueKey('height-imperial-field'),
                    width: 180,
                    child: Row(
                      children: [
                        Expanded(
                          child: _TargetTextField(
                            fieldKey: const ValueKey(
                              'target-height-feet-input',
                            ),
                            controller: feetController,
                            suffix: 'ft',
                            decimal: false,
                            maxLength: 1,
                            enabled: enabled,
                            onTextChanged: (_) => onImperialChanged(),
                            onTextComplete: onImperialComplete,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: _TargetTextField(
                            fieldKey: const ValueKey(
                              'target-height-inches-input',
                            ),
                            controller: inchesController,
                            suffix: 'in',
                            decimal: false,
                            maxLength: 2,
                            enabled: enabled,
                            onTextChanged: (_) => onImperialChanged(),
                            onTextComplete: onImperialComplete,
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

class _HeightUnitSegment extends StatelessWidget {
  const _HeightUnitSegment({
    required this.unit,
    required this.enabled,
    required this.onChanged,
  });

  final _HeightUnit unit;
  final bool enabled;
  final ValueChanged<_HeightUnit> onChanged;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;

    return Container(
      padding: const EdgeInsets.all(3),
      decoration: BoxDecoration(
        color: colors.mutedFill,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _HeightUnitPill(
            key: const ValueKey('height-unit-metric'),
            label: 'cm',
            selected: unit == _HeightUnit.metric,
            enabled: enabled,
            onTap: () => onChanged(_HeightUnit.metric),
          ),
          _HeightUnitPill(
            key: const ValueKey('height-unit-imperial'),
            label: 'ft',
            selected: unit == _HeightUnit.imperial,
            enabled: enabled,
            onTap: () => onChanged(_HeightUnit.imperial),
          ),
        ],
      ),
    );
  }
}

class _HeightUnitPill extends StatelessWidget {
  const _HeightUnitPill({
    super.key,
    required this.label,
    required this.selected,
    required this.enabled,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final bool enabled;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;

    return InkWell(
      onTap: enabled ? onTap : null,
      borderRadius: BorderRadius.circular(9),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 160),
        constraints: const BoxConstraints(minWidth: 44),
        padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 7),
        decoration: BoxDecoration(
          color: selected ? LogMyPlateColors.accent : Colors.transparent,
          borderRadius: BorderRadius.circular(9),
          boxShadow: selected
              ? [
                  BoxShadow(
                    color: LogMyPlateColors.accent.withValues(alpha: 0.18),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ]
              : null,
        ),
        child: Text(
          label,
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.labelSmall?.copyWith(
            color: selected
                ? LogMyPlateColors.accentDeep
                : colors.textSecondary,
            letterSpacing: 0,
          ),
        ),
      ),
    );
  }
}

class _NumberInputCard extends StatelessWidget {
  const _NumberInputCard({
    required this.label,
    required this.controller,
    required this.fieldKey,
    required this.suffix,
    required this.decimal,
    required this.enabled,
    required this.onTextChanged,
    required this.onTextComplete,
  });

  final String label;
  final TextEditingController controller;
  final Key fieldKey;
  final String suffix;
  final bool decimal;
  final bool enabled;
  final ValueChanged<double> onTextChanged;
  final VoidCallback onTextComplete;

  @override
  Widget build(BuildContext context) {
    return _InputSurface(
      enabled: enabled,
      child: Row(
        children: [
          Expanded(
            child: Text(label, style: Theme.of(context).textTheme.titleMedium),
          ),
          SizedBox(
            width: label == 'Age' ? 132 : 148,
            child: _TargetTextField(
              fieldKey: fieldKey,
              controller: controller,
              suffix: suffix,
              decimal: decimal,
              maxLength: decimal ? 5 : 3,
              enabled: enabled,
              onTextChanged: onTextChanged,
              onTextComplete: onTextComplete,
            ),
          ),
        ],
      ),
    );
  }
}

class _InputSurface extends StatelessWidget {
  const _InputSurface({required this.enabled, required this.child});

  final bool enabled;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return LiteGlassCard(
      padding: const EdgeInsets.all(LogMyPlateSpacing.cardPadding),
      borderRadius: BorderRadius.circular(LogMyPlateSpacing.heroCardBorderRadius),
      child: child,
    );
  }
}

class _TargetTextField extends StatelessWidget {
  const _TargetTextField({
    required this.fieldKey,
    required this.controller,
    required this.suffix,
    required this.decimal,
    required this.maxLength,
    required this.enabled,
    required this.onTextChanged,
    required this.onTextComplete,
  });

  final Key fieldKey;
  final TextEditingController controller;
  final String suffix;
  final bool decimal;
  final int maxLength;
  final bool enabled;
  final ValueChanged<double> onTextChanged;
  final VoidCallback onTextComplete;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final fieldFill = enabled
        ? colors.mutedFill
        : LogMyPlateColors.accent.withValues(alpha: isDark ? 0.10 : 0.14);
    final fieldBorder = enabled
        ? colors.border
        : LogMyPlateColors.accent.withValues(alpha: isDark ? 0.18 : 0.26);

    return IgnorePointer(
      ignoring: !enabled,
      child: TextField(
        key: fieldKey,
        controller: controller,
        readOnly: !enabled,
        enableInteractiveSelection: enabled,
        textAlign: TextAlign.right,
        textInputAction: TextInputAction.done,
        keyboardType: TextInputType.numberWithOptions(decimal: decimal),
        inputFormatters: [
          FilteringTextInputFormatter.allow(
            decimal ? RegExp(r'[0-9.]') : RegExp(r'[0-9]'),
          ),
          LengthLimitingTextInputFormatter(maxLength),
        ],
        onChanged: enabled
            ? (text) {
                final parsed = double.tryParse(text);
                if (parsed == null) return;
                onTextChanged(parsed);
              }
            : null,
        onEditingComplete: onTextComplete,
        onSubmitted: (_) => onTextComplete(),
        style: Theme.of(context).textTheme.titleMedium?.copyWith(
          color: enabled
              ? colors.accentText
              : colors.accentText.withValues(alpha: 0.78),
          fontFeatures: const [FontFeature.tabularFigures()],
        ),
        decoration: InputDecoration(
          isDense: true,
          suffixText: suffix,
          suffixStyle: Theme.of(
            context,
          ).textTheme.bodySmall?.copyWith(color: colors.textSecondary),
          filled: true,
          fillColor: fieldFill,
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 12,
            vertical: 12,
          ),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(13),
            borderSide: BorderSide(color: fieldBorder, width: 0.6),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(13),
            borderSide: BorderSide(color: fieldBorder, width: 0.6),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(13),
            borderSide: BorderSide(color: colors.accent, width: 1.1),
          ),
        ),
      ),
    );
  }
}

class _ChoiceGroup<T> extends StatelessWidget {
  const _ChoiceGroup({
    required this.label,
    required this.values,
    required this.selected,
    required this.labelFor,
    required this.onSelected,
  });

  final String label;
  final List<T> values;
  final T selected;
  final String Function(T value) labelFor;
  final ValueChanged<T>? onSelected;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: Theme.of(context).textTheme.labelSmall?.copyWith(
            color: colors.textSecondary,
            letterSpacing: 1.2,
          ),
        ),
        const SizedBox(height: 9),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            for (final value in values)
              _ChoiceChipButton(
                label: labelFor(value),
                selected: selected == value,
                onTap: onSelected == null ? null : () => onSelected!(value),
              ),
          ],
        ),
      ],
    );
  }
}

class _ChoiceChipButton extends StatelessWidget {
  const _ChoiceChipButton({
    required this.label,
    required this.selected,
    this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(99),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 160),
        padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 10),
        decoration: BoxDecoration(
          color: selected ? LogMyPlateColors.accent : Colors.transparent,
          borderRadius: BorderRadius.circular(99),
          border: Border.all(
            color: selected ? LogMyPlateColors.accent : colors.border,
            width: 0.7,
          ),
        ),
        child: Text(
          label,
          style: Theme.of(context).textTheme.labelSmall?.copyWith(
            color: selected ? LogMyPlateColors.accentDeep : colors.textPrimary,
            letterSpacing: 0,
          ),
        ),
      ),
    );
  }
}

class _HealthError extends StatelessWidget {
  const _HealthError({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(LogMyPlateSpacing.itemSpacing),
      decoration: BoxDecoration(
        color: LogMyPlateColors.destructive.withValues(alpha: 0.10),
        borderRadius: BorderRadius.circular(LogMyPlateSpacing.elementBorderRadius),
        border: Border.all(
          color: LogMyPlateColors.destructive.withValues(alpha: 0.22),
        ),
      ),
      child: Row(
        children: [
          const Icon(
            Icons.error_outline_rounded,
            color: LogMyPlateColors.destructive,
            size: 18,
          ),
          const SizedBox(width: 9),
          Expanded(
            child: Text(
              message,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: LogMyPlateColors.destructive,
                height: 1.25,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _HealthPreview {
  const _HealthPreview({
    required this.bmi,
    required this.targetCalories,
    required this.categoryLabel,
  });

  final double bmi;
  final int targetCalories;
  final String categoryLabel;

  double get normalizedBmi {
    return ((bmi - 16) / (34 - 16)).clamp(0.0, 1.0).toDouble();
  }

  static _HealthPreview calculate({
    required double heightCm,
    required double weightKg,
    required int ageYears,
    required HealthSex sex,
    required ActivityLevel activityLevel,
    required HealthGoal goal,
  }) {
    final heightM = heightCm / 100;
    final bmi = _round(weightKg / (heightM * heightM), 1);
    final base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
    final bmr = switch (sex) {
      HealthSex.male => base + 5,
      HealthSex.female => base - 161,
      HealthSex.notSpecified => base - 78,
    };
    final maintenance = bmr * _activityFactor(activityLevel);
    final target = math.max(
      _calorieFloor(sex),
      (maintenance + _goalAdjustment(goal)).round(),
    );

    return _HealthPreview(
      bmi: bmi,
      targetCalories: target,
      categoryLabel: _categoryLabel(bmi),
    );
  }

  static double _activityFactor(ActivityLevel level) {
    return switch (level) {
      ActivityLevel.sedentary => 1.2,
      ActivityLevel.light => 1.375,
      ActivityLevel.moderate => 1.55,
      ActivityLevel.active => 1.725,
    };
  }

  static int _goalAdjustment(HealthGoal goal) {
    return switch (goal) {
      HealthGoal.maintain => 0,
      HealthGoal.loseGently => -300,
      HealthGoal.gainGently => 250,
    };
  }

  static int _calorieFloor(HealthSex sex) {
    return switch (sex) {
      HealthSex.male => 1500,
      HealthSex.female => 1200,
      HealthSex.notSpecified => 1300,
    };
  }

  static String _categoryLabel(double bmi) {
    if (bmi < 18.5) return 'Below BMI range';
    if (bmi < 25) return 'Balanced BMI range';
    if (bmi < 30) return 'Above BMI range';
    return 'High BMI range';
  }

  static double _round(double value, int decimals) {
    final factor = math.pow(10, decimals).toDouble();
    return (value * factor).round() / factor;
  }
}
