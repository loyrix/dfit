import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../models/meal.dart';
import '../theme/logmyplate_colors.dart';
import '../theme/logmyplate_surfaces.dart';
import '../theme/logmyplate_theme.dart';
import '../widgets/primitive_icons.dart';

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

class _HealthTargetScreenState extends State<HealthTargetScreen> {
  double _heightCm = 170;
  double _weightKg = 70;
  int _ageYears = 28;
  HealthSex _sex = HealthSex.notSpecified;
  ActivityLevel _activityLevel = ActivityLevel.light;
  HealthGoal _goal = HealthGoal.maintain;
  bool _saving = false;
  String? _error;
  late final TextEditingController _heightController;
  late final TextEditingController _weightController;

  @override
  void initState() {
    super.initState();
    _heightController = TextEditingController();
    _weightController = TextEditingController();
    final target = widget.initialTarget;
    if (target != null) {
      _heightCm = target.heightCm;
      _weightKg = target.weightKg;
      _ageYears = target.ageYears;
      _sex = target.sex;
      _activityLevel = target.activityLevel;
      _goal = target.goal;
    }
    _heightController.text = _formatMetric(_heightCm, decimalPlaces: 0);
    _weightController.text = _formatMetric(_weightKg, decimalPlaces: 1);
  }

  @override
  void dispose() {
    _heightController.dispose();
    _weightController.dispose();
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
      body: SafeArea(
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
                TextButton(
                  onPressed: _saving ? null : () => Navigator.of(context).pop(),
                  child: Text(
                    widget.initialTarget == null ? 'Set later' : 'Close',
                  ),
                ),
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
            const SizedBox(height: 18),
            _TargetPreviewCard(preview: preview),
            const SizedBox(height: 16),
            _MetricSlider(
              label: 'Height',
              value: _heightCm,
              min: 130,
              max: 210,
              unit: 'cm',
              controller: _heightController,
              decimalPlaces: 0,
              onChanged: _saving
                  ? null
                  : (value) => _setHeight(value.roundToDouble()),
              onTextChanged: _saving
                  ? null
                  : (value) => _setHeight(value, syncText: false),
              onTextComplete: _saving ? null : _normalizeHeightInput,
            ),
            const SizedBox(height: 10),
            _MetricSlider(
              label: 'Weight',
              value: _weightKg,
              min: 35,
              max: 160,
              unit: 'kg',
              controller: _weightController,
              decimalPlaces: 1,
              onChanged: _saving
                  ? null
                  : (value) => _setWeight(_roundTo(value, 1)),
              onTextChanged: _saving
                  ? null
                  : (value) => _setWeight(value, syncText: false),
              onTextComplete: _saving ? null : _normalizeWeightInput,
            ),
            const SizedBox(height: 10),
            _AgeStepper(
              age: _ageYears,
              onChanged: _saving
                  ? null
                  : (value) => setState(() => _ageYears = value),
            ),
            const SizedBox(height: 18),
            _ChoiceGroup<HealthSex>(
              label: 'Body profile',
              values: HealthSex.values,
              selected: _sex,
              labelFor: (value) => value.label,
              onSelected: _saving
                  ? null
                  : (value) => setState(() => _sex = value),
            ),
            const SizedBox(height: 16),
            _ChoiceGroup<ActivityLevel>(
              label: 'Typical movement',
              values: ActivityLevel.values,
              selected: _activityLevel,
              labelFor: (value) => value.label,
              onSelected: _saving
                  ? null
                  : (value) => setState(() => _activityLevel = value),
            ),
            const SizedBox(height: 16),
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
              const SizedBox(height: 16),
              _HealthError(message: _error!),
            ],
            const SizedBox(height: 16),
            Text(
              'BMI is a screening estimate, not medical advice.',
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                color: colors.textTertiary,
                letterSpacing: 0,
              ),
            ),
          ],
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
            child: FilledButton(
              onPressed: _saving || !canSave ? null : _save,
              style: FilledButton.styleFrom(
                backgroundColor: LogMyPlateColors.accent,
                foregroundColor: LogMyPlateColors.accentDeep,
                disabledBackgroundColor: colors.mutedFill,
                disabledForegroundColor: colors.textSecondary,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
              child: AnimatedSwitcher(
                duration: const Duration(milliseconds: 180),
                child: _saving
                    ? SizedBox(
                        key: const ValueKey('saving-target'),
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: colors.textSecondary,
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

  void _setHeight(double value, {bool syncText = true}) {
    setState(() {
      _heightCm = _clampMetric(value, 130, 210);
      if (syncText) {
        _heightController.text = _formatMetric(_heightCm, decimalPlaces: 0);
      }
    });
  }

  void _setWeight(double value, {bool syncText = true}) {
    setState(() {
      _weightKg = _roundTo(_clampMetric(value, 35, 160), 1);
      if (syncText) {
        _weightController.text = _formatMetric(_weightKg, decimalPlaces: 1);
      }
    });
  }

  void _normalizeHeightInput() {
    _setHeight(double.tryParse(_heightController.text) ?? _heightCm);
  }

  void _normalizeWeightInput() {
    _setWeight(double.tryParse(_weightController.text) ?? _weightKg);
  }

  Future<void> _save() async {
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
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _error = 'Could not save your target. Check connection and try again.';
      });
    } finally {
      if (mounted) setState(() => _saving = false);
    }
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
}

class _TargetPreviewCard extends StatelessWidget {
  const _TargetPreviewCard({required this.preview});

  final _HealthPreview preview;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;
    final surface = LogMyPlateHeroSurfaceStyle.of(context);

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: surface.decoration(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'BMI overview',
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
              color: surface.textSecondary,
              letterSpacing: 1.4,
            ),
          ),
          const SizedBox(height: 14),
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
                    const SizedBox(height: 14),
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
          const SizedBox(height: 14),
          _BmiLegend(surface: surface),
        ],
      ),
    );
  }
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
    return SizedBox(
      width: 132,
      height: 132,
      child: CustomPaint(
        painter: _BmiOrbitPainter(
          score: preview.normalizedBmi,
          trackColor: surface.track,
        ),
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                preview.bmi.toStringAsFixed(1),
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                  color: surface.textPrimary,
                  fontFeatures: const [FontFeature.tabularFigures()],
                ),
              ),
              Text(
                'BMI',
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  color: surface.textSecondary,
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
  const _BmiOrbitPainter({required this.score, required this.trackColor});

  final double score;
  final Color trackColor;

  @override
  void paint(Canvas canvas, Size size) {
    final rect = Offset.zero & size;
    final center = rect.center;
    final radius = math.min(size.width, size.height) / 2 - 10;
    final track = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 8
      ..strokeCap = StrokeCap.round
      ..color = trackColor;

    canvas.drawCircle(center, radius, track);

    const segmentGap = 0.04;
    final arcRect = Rect.fromCircle(center: center, radius: radius);
    for (final segment in _bmiSegments) {
      final start = -math.pi / 2 + math.pi * 2 * segment.start;
      final sweep = math.pi * 2 * (segment.end - segment.start) - segmentGap;
      if (sweep <= 0) continue;
      canvas.drawArc(
        arcRect,
        start,
        sweep,
        false,
        Paint()
          ..style = PaintingStyle.stroke
          ..strokeWidth = 8
          ..strokeCap = StrokeCap.round
          ..color = segment.color,
      );
    }

    final markerAngle = -math.pi / 2 + math.pi * 2 * score.clamp(0.0, 1.0);
    final marker = Offset(
      center.dx + math.cos(markerAngle) * radius,
      center.dy + math.sin(markerAngle) * radius,
    );
    canvas.drawCircle(marker, 5, Paint()..color = _bmiColorForScore(score));
  }

  @override
  bool shouldRepaint(covariant _BmiOrbitPainter oldDelegate) {
    return oldDelegate.score != score || oldDelegate.trackColor != trackColor;
  }
}

const _bmiLowColor = Color(0xFF7DB7D8);
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

class _BmiSegment {
  const _BmiSegment(this.start, this.end, this.color);

  final double start;
  final double end;
  final Color color;
}

Color _bmiColorForScore(double score) {
  final normalized = score.clamp(0.0, 1.0);
  for (final segment in _bmiSegments) {
    if (normalized <= segment.end) return segment.color;
  }
  return _bmiHighColor;
}

class _MetricSlider extends StatelessWidget {
  const _MetricSlider({
    required this.label,
    required this.value,
    required this.min,
    required this.max,
    required this.unit,
    required this.controller,
    required this.decimalPlaces,
    required this.onChanged,
    required this.onTextChanged,
    required this.onTextComplete,
  });

  final String label;
  final double value;
  final double min;
  final double max;
  final String unit;
  final TextEditingController controller;
  final int decimalPlaces;
  final ValueChanged<double>? onChanged;
  final ValueChanged<double>? onTextChanged;
  final VoidCallback? onTextComplete;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;
    final enabled = onChanged != null;

    return Container(
      padding: const EdgeInsets.fromLTRB(14, 12, 14, 10),
      decoration: BoxDecoration(
        color: colors.surfaceCard,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: colors.border, width: 0.6),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Text(label, style: Theme.of(context).textTheme.titleMedium),
              const Spacer(),
              SizedBox(
                width: 128,
                child: TextField(
                  key: ValueKey('metric-input-${label.toLowerCase()}'),
                  controller: controller,
                  enabled: enabled,
                  textAlign: TextAlign.right,
                  keyboardType: TextInputType.numberWithOptions(
                    decimal: decimalPlaces > 0,
                  ),
                  inputFormatters: [
                    FilteringTextInputFormatter.allow(
                      decimalPlaces > 0 ? RegExp(r'[0-9.]') : RegExp(r'[0-9]'),
                    ),
                    LengthLimitingTextInputFormatter(decimalPlaces > 0 ? 5 : 3),
                  ],
                  onChanged: enabled
                      ? (text) {
                          final parsed = double.tryParse(text);
                          if (parsed == null) return;
                          onTextChanged?.call(parsed);
                        }
                      : null,
                  onEditingComplete: onTextComplete,
                  onSubmitted: (_) => onTextComplete?.call(),
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    color: colors.accentText,
                    fontFeatures: const [FontFeature.tabularFigures()],
                  ),
                  decoration: InputDecoration(
                    isDense: true,
                    suffixText: unit,
                    suffixStyle: Theme.of(context).textTheme.bodySmall
                        ?.copyWith(color: colors.textSecondary),
                    filled: true,
                    fillColor: enabled
                        ? colors.mutedFill
                        : colors.mutedFill.withValues(alpha: 0.55),
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 10,
                    ),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(13),
                      borderSide: BorderSide(color: colors.border, width: 0.6),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(13),
                      borderSide: BorderSide(color: colors.border, width: 0.6),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(13),
                      borderSide: BorderSide(color: colors.accent, width: 1.1),
                    ),
                    disabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(13),
                      borderSide: BorderSide(color: colors.border, width: 0.6),
                    ),
                  ),
                ),
              ),
            ],
          ),
          SliderTheme(
            data: SliderTheme.of(context).copyWith(
              activeTrackColor: LogMyPlateColors.accent,
              inactiveTrackColor: colors.mutedFill,
              thumbColor: LogMyPlateColors.accent,
              overlayColor: LogMyPlateColors.accent.withValues(alpha: 0.12),
              trackHeight: 5,
            ),
            child: Slider(
              min: min,
              max: max,
              value: value.clamp(min, max),
              onChanged: onChanged,
            ),
          ),
        ],
      ),
    );
  }
}

class _AgeStepper extends StatelessWidget {
  const _AgeStepper({required this.age, required this.onChanged});

  final int age;
  final ValueChanged<int>? onChanged;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: colors.surfaceCard,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: colors.border, width: 0.6),
      ),
      child: Row(
        children: [
          Text('Age', style: Theme.of(context).textTheme.titleMedium),
          const Spacer(),
          _RoundIconButton(
            icon: Icons.remove_rounded,
            onTap: onChanged == null || age <= 18
                ? null
                : () => onChanged!(age - 1),
          ),
          SizedBox(
            width: 58,
            child: Text(
              '$age',
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontFeatures: const [FontFeature.tabularFigures()],
              ),
            ),
          ),
          _RoundIconButton(
            icon: Icons.add_rounded,
            onTap: onChanged == null || age >= 90
                ? null
                : () => onChanged!(age + 1),
          ),
        ],
      ),
    );
  }
}

class _RoundIconButton extends StatelessWidget {
  const _RoundIconButton({required this.icon, this.onTap});

  final IconData icon;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(99),
      child: Container(
        width: 36,
        height: 36,
        decoration: BoxDecoration(
          color: colors.mutedFill,
          shape: BoxShape.circle,
        ),
        child: Icon(
          icon,
          color: onTap == null ? colors.textTertiary : colors.textPrimary,
          size: 20,
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
          color: selected ? LogMyPlateColors.accent : colors.surfaceCard,
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
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: LogMyPlateColors.destructive.withValues(alpha: 0.10),
        borderRadius: BorderRadius.circular(14),
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
