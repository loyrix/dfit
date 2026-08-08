import 'package:flutter/material.dart';

import '../models/macro_targets.dart';
import '../theme/logmyplate_spacing.dart';
import '../theme/logmyplate_theme.dart';

/// Part A9 — the user's own carb / fat / protein split.
///
/// Off by default. The computed centres from goal and activity are the better
/// answer for almost everyone, and a split is only worth overriding when someone
/// actually knows what they want. Turning the switch off restores the computed
/// bands rather than freezing the last manual values.
///
/// **The three always total 100%.** Dragging one redistributes the difference
/// across the other two in proportion to their current sizes, so the user can
/// never build an invalid split and there is no "must add to 100" error to hit.
/// That constraint lives here rather than in a validator because a slider that
/// simply refuses to move is a much worse experience than one that gives.
class MacroSplitSliders extends StatelessWidget {
  const MacroSplitSliders({
    super.key,
    required this.enabled,
    required this.split,
    required this.computed,
    required this.onEnabledChanged,
    required this.onChanged,
  });

  /// Whether the manual split is in use.
  final bool enabled;

  /// The current manual split. Shown greyed out when [enabled] is false.
  final MacroSplit split;

  /// What goal and activity would produce on their own, shown as the baseline
  /// so the user can see what they are overriding.
  final MacroSplit computed;

  final ValueChanged<bool> onEnabledChanged;
  final ValueChanged<MacroSplit> onChanged;

  static const _minPct = 10.0;
  static const _maxPct = 70.0;

  /// Moves one macro to [value] and absorbs the difference into the other two.
  ///
  /// The other two share the change in proportion to their current sizes, so
  /// the larger one moves more — dragging carbs down from a 50/25/25 split
  /// should not push fat and protein to lopsided extremes. Both are clamped to
  /// [_minPct], and whatever rounding is left over lands on the larger of them
  /// so the total is exactly 100 rather than 99.9.
  static MacroSplit redistribute(
    MacroSplit current,
    MacroKind kind,
    double value,
  ) {
    final target = value.clamp(_minPct, _maxPct).toDouble();

    final others = switch (kind) {
      MacroKind.carbs => [current.fatPct, current.proteinPct],
      MacroKind.fat => [current.carbsPct, current.proteinPct],
      MacroKind.protein => [current.carbsPct, current.fatPct],
    };

    final remaining = 100 - target;
    final othersTotal = others[0] + others[1];

    // A degenerate starting state (both at zero) has no proportion to preserve,
    // so split the remainder evenly rather than dividing by zero.
    var first = othersTotal <= 0
        ? remaining / 2
        : remaining * (others[0] / othersTotal);
    var second = remaining - first;

    if (first < _minPct) {
      first = _minPct;
      second = remaining - first;
    }
    if (second < _minPct) {
      second = _minPct;
      first = remaining - second;
    }

    first = double.parse(first.toStringAsFixed(1));
    second = double.parse((remaining - first).toStringAsFixed(1));

    return switch (kind) {
      MacroKind.carbs => MacroSplit(
        carbsPct: target,
        fatPct: first,
        proteinPct: second,
      ),
      MacroKind.fat => MacroSplit(
        carbsPct: first,
        fatPct: target,
        proteinPct: second,
      ),
      MacroKind.protein => MacroSplit(
        carbsPct: first,
        fatPct: second,
        proteinPct: target,
      ),
    };
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;
    final theme = Theme.of(context);
    final active = enabled ? split : computed;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Set my own macro split',
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: colors.textPrimary,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    enabled
                        ? 'Your split is used instead of the calculated one.'
                        : 'Calculated from your goal and activity.',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: colors.textTertiary,
                    ),
                  ),
                ],
              ),
            ),
            Switch(
              key: const ValueKey('macro-split-toggle'),
              value: enabled,
              onChanged: onEnabledChanged,
            ),
          ],
        ),
        const SizedBox(height: LogMyPlateSpacing.itemSpacing),
        _MacroSlider(
          key: const ValueKey('macro-split-carbs'),
          label: 'Carbs',
          value: active.carbsPct,
          enabled: enabled,
          onChanged: (value) =>
              onChanged(redistribute(split, MacroKind.carbs, value)),
        ),
        _MacroSlider(
          key: const ValueKey('macro-split-fat'),
          label: 'Fat',
          value: active.fatPct,
          enabled: enabled,
          onChanged: (value) =>
              onChanged(redistribute(split, MacroKind.fat, value)),
        ),
        _MacroSlider(
          key: const ValueKey('macro-split-protein'),
          label: 'Protein',
          value: active.proteinPct,
          enabled: enabled,
          onChanged: (value) =>
              onChanged(redistribute(split, MacroKind.protein, value)),
        ),
      ],
    );
  }
}

/// Public so the redistribution rule can be tested directly: the
/// always-totals-100 invariant is the part most worth pinning.
enum MacroKind { carbs, fat, protein }

class _MacroSlider extends StatelessWidget {
  const _MacroSlider({
    super.key,
    required this.label,
    required this.value,
    required this.enabled,
    required this.onChanged,
  });

  final String label;
  final double value;
  final bool enabled;
  final ValueChanged<double> onChanged;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;
    final theme = Theme.of(context);

    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(
        children: [
          SizedBox(
            width: 64,
            child: Text(
              label,
              style: theme.textTheme.bodySmall?.copyWith(
                color: enabled ? colors.textPrimary : colors.textTertiary,
              ),
            ),
          ),
          Expanded(
            child: Slider(
              value: value.clamp(
                MacroSplitSliders._minPct,
                MacroSplitSliders._maxPct,
              ),
              min: MacroSplitSliders._minPct,
              max: MacroSplitSliders._maxPct,
              divisions: (MacroSplitSliders._maxPct - MacroSplitSliders._minPct)
                  .round(),
              label: '${value.round()}%',
              onChanged: enabled ? onChanged : null,
            ),
          ),
          SizedBox(
            width: 44,
            child: Text(
              '${value.round()}%',
              textAlign: TextAlign.end,
              style: theme.textTheme.bodySmall?.copyWith(
                color: enabled ? colors.textPrimary : colors.textTertiary,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
