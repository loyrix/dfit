import 'package:flutter/material.dart';

import '../models/plate_score.dart';
import '../theme/logmyplate_spacing.dart';
import '../theme/logmyplate_theme.dart';
import 'plate_score_chip.dart';

/// Explains how a Plate Score was reached.
///
/// Presented as a bottom sheet rather than a route: the review screen it is
/// most often opened from has an unfinished task on it, and pushing a route
/// risks users dropping out before confirming their meal.
class PlateScoreSheet extends StatelessWidget {
  const PlateScoreSheet({super.key, required this.score, this.onPersonalise});

  final PlateScore score;

  /// Invoked when a general-tier user taps the prompt to set up their profile.
  final VoidCallback? onPersonalise;

  static Future<void> show(
    BuildContext context, {
    required PlateScore score,
    VoidCallback? onPersonalise,
  }) {
    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (sheetContext) =>
          PlateScoreSheet(score: score, onPersonalise: onPersonalise),
    );
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;
    final style = PlateScoreBandStyle.of(score.band);

    return SafeArea(
      top: false,
      child: Container(
        margin: const EdgeInsets.all(LogMyPlateSpacing.itemSpacing),
        padding: const EdgeInsets.all(LogMyPlateSpacing.sectionSpacing),
        decoration: BoxDecoration(
          color: colors.surfaceCard,
          borderRadius: BorderRadius.circular(
            LogMyPlateSpacing.heroCardBorderRadius,
          ),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Text(
                  '${score.score}',
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                    color: style.foreground,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        style.label,
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      Text(
                        score.tier == PlateScoreTier.personal
                            ? 'Based on your goal'
                            : 'General balance',
                        style: Theme.of(context).textTheme.labelSmall?.copyWith(
                          color: colors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: LogMyPlateSpacing.sectionSpacing),
            Text(
              'WHAT WENT INTO THIS',
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                color: colors.textSecondary,
                letterSpacing: 1.2,
              ),
            ),
            const SizedBox(height: 10),
            for (final axis in score.axes) ...[
              _AxisRow(axis: axis),
              const SizedBox(height: 10),
            ],
            if (score.canPersonalise) ...[
              const SizedBox(height: 4),
              _PersonalisePrompt(onTap: onPersonalise),
            ],
            if (score.skipped.contains(PlateScoreAxis.fiber)) ...[
              const SizedBox(height: 10),
              Text(
                'Fiber was not recorded for this meal, so it was left out rather '
                'than counted as zero.',
                style: Theme.of(
                  context,
                ).textTheme.labelSmall?.copyWith(color: colors.textSecondary),
              ),
            ],
            const SizedBox(height: LogMyPlateSpacing.sectionSpacing),
            Text(
              'A guide to how balanced this meal is, not medical advice.',
              style: Theme.of(
                context,
              ).textTheme.labelSmall?.copyWith(color: colors.textTertiary),
            ),
          ],
        ),
      ),
    );
  }
}

class _AxisRow extends StatelessWidget {
  const _AxisRow({required this.axis});

  final PlateScoreAxisResult axis;

  String get _label => switch (axis.axis) {
    PlateScoreAxis.calorieFit => 'Portion for this meal',
    PlateScoreAxis.protein => 'Protein',
    PlateScoreAxis.macroBalance => 'Balance',
    PlateScoreAxis.fiber => 'Fiber',
  };

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;
    final fraction = (axis.score / 100).clamp(0.0, 1.0);

    return Row(
      children: [
        SizedBox(
          width: 150,
          child: Text(_label, style: Theme.of(context).textTheme.bodyMedium),
        ),
        Expanded(
          child: ClipRRect(
            borderRadius: BorderRadius.circular(999),
            child: LinearProgressIndicator(
              value: fraction,
              minHeight: 6,
              backgroundColor: colors.border,
              valueColor: AlwaysStoppedAnimation<Color>(colors.textPrimary),
            ),
          ),
        ),
        const SizedBox(width: 10),
        SizedBox(
          width: 32,
          child: Text(
            '${axis.score.round()}',
            textAlign: TextAlign.right,
            style: Theme.of(context).textTheme.labelMedium?.copyWith(
              color: colors.textSecondary,
              fontFeatures: const [FontFeature.tabularFigures()],
            ),
          ),
        ),
      ],
    );
  }
}

/// Shown when the calorie-fit axis was skipped: the user can get a score
/// tailored to their day by completing their health target.
class _PersonalisePrompt extends StatelessWidget {
  const _PersonalisePrompt({this.onTap});

  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;

    return Material(
      type: MaterialType.transparency,
      child: InkWell(
        borderRadius: BorderRadius.circular(
          LogMyPlateSpacing.elementBorderRadius,
        ),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            border: Border.all(color: colors.border),
            borderRadius: BorderRadius.circular(
              LogMyPlateSpacing.elementBorderRadius,
            ),
          ),
          child: Row(
            children: [
              Expanded(
                child: Text(
                  'Add your height, weight and goal to see how this meal fits '
                  'your day.',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ),
              if (onTap != null)
                Icon(Icons.chevron_right_rounded, color: colors.textSecondary),
            ],
          ),
        ),
      ),
    );
  }
}
