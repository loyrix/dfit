import 'package:flutter/material.dart';

import '../models/plate_score.dart';
import '../theme/logmyplate_spacing.dart';
import '../theme/logmyplate_theme.dart';
import 'plate_score_chip.dart';
import 'plate_score_copy.dart';

/// Explains a Plate Score.
///
/// Presented as a bottom sheet rather than a route: when opened from the review
/// screen there is an unconfirmed meal behind it, and pushing a route risks
/// users dropping out before saving.
///
/// The ordering is deliberate — verdict, then what to do, then the detail behind
/// it. Most people read the first two lines and stop, so the actionable part
/// comes before the breakdown rather than after.
class PlateScoreSheet extends StatelessWidget {
  const PlateScoreSheet({
    super.key,
    required this.score,
    this.advice,
    this.mealLabel = PlateScoreMealLabel.fallback,
    this.showMealTypeNote = false,
    this.onPersonalise,
  });

  final PlateScore score;

  /// Optional commentary from the model. Absent when it had nothing to say.
  final MealAdvice? advice;

  /// Used so copy can say "a typical lunch" rather than "a typical meal".
  final PlateScoreMealLabel mealLabel;

  /// Only true on the review screen, where the meal type is still editable.
  final bool showMealTypeNote;

  final VoidCallback? onPersonalise;

  static Future<void> show(
    BuildContext context, {
    required PlateScore score,
    MealAdvice? advice,
    PlateScoreMealLabel mealLabel = PlateScoreMealLabel.fallback,
    bool showMealTypeNote = false,
    VoidCallback? onPersonalise,
  }) {
    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (sheetContext) => PlateScoreSheet(
        score: score,
        advice: advice,
        mealLabel: mealLabel,
        showMealTypeNote: showMealTypeNote,
        onPersonalise: onPersonalise,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;
    final style = PlateScoreBandStyle.of(score.band);
    final media = MediaQuery.of(context);

    return SafeArea(
      top: false,
      child: Container(
        margin: const EdgeInsets.all(LogMyPlateSpacing.itemSpacing),
        constraints: BoxConstraints(maxHeight: media.size.height * 0.85),
        decoration: BoxDecoration(
          color: colors.surfaceCard,
          borderRadius: BorderRadius.circular(
            LogMyPlateSpacing.heroCardBorderRadius,
          ),
        ),
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(LogMyPlateSpacing.sectionSpacing),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _Headline(score: score, style: style),
              const SizedBox(height: 6),
              Text(
                PlateScoreCopy.bandSummary(score.band),
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              if (advice?.summary != null) ...[
                const SizedBox(height: 10),
                Text(
                  advice!.summary!,
                  style: Theme.of(
                    context,
                  ).textTheme.bodyMedium?.copyWith(color: colors.textSecondary),
                ),
              ],

              // Actions first: most people read the top of a sheet and stop.
              if (advice != null && advice!.swaps.isNotEmpty) ...[
                const SizedBox(height: LogMyPlateSpacing.sectionSpacing),
                _AdviceList(
                  title: 'TRY THIS NEXT TIME',
                  lines: advice!.swaps,
                  icon: Icons.swap_horiz_rounded,
                ),
              ],
              // Warnings and the model's watch-outs answer the same question,
              // so they share one section rather than competing for attention.
              if (score.warnings.isNotEmpty ||
                  (advice?.watchOuts.isNotEmpty ?? false)) ...[
                const SizedBox(height: LogMyPlateSpacing.sectionSpacing),
                _SectionTitle(text: 'WORTH KNOWING'),
                const SizedBox(height: 8),
                for (final warning in score.warnings) ...[
                  _WarningRow(warning: warning),
                  const SizedBox(height: 6),
                ],
                for (final line in advice?.watchOuts ?? const <String>[])
                  Padding(
                    padding: const EdgeInsets.only(bottom: 6),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Padding(
                          padding: const EdgeInsets.only(top: 3),
                          child: Icon(
                            Icons.info_outline_rounded,
                            size: 15,
                            color: colors.textSecondary,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            line,
                            style: Theme.of(context).textTheme.bodySmall,
                          ),
                        ),
                      ],
                    ),
                  ),
              ],
              if (advice != null && advice!.positives.isNotEmpty) ...[
                const SizedBox(height: LogMyPlateSpacing.sectionSpacing),
                _AdviceList(
                  title: 'WHAT WORKS HERE',
                  lines: advice!.positives,
                  icon: Icons.check_rounded,
                ),
              ],

              const SizedBox(height: LogMyPlateSpacing.sectionSpacing),
              _SectionTitle(text: 'HOW THIS ADDS UP'),
              const SizedBox(height: 10),
              for (final axis in score.axes) ...[
                _AxisRow(axis: axis, mealLabel: mealLabel),
                const SizedBox(height: 14),
              ],

              if (showMealTypeNote &&
                  score.axes.any(
                    (axis) => axis.axis == PlateScoreAxis.calorieFit,
                  )) ...[
                Text(
                  PlateScoreCopy.mealTypeNote(mealLabel),
                  style: Theme.of(
                    context,
                  ).textTheme.labelSmall?.copyWith(color: colors.textSecondary),
                ),
                const SizedBox(height: LogMyPlateSpacing.itemSpacing),
              ],

              if (score.canPersonalise)
                _PersonalisePrompt(onTap: onPersonalise),

              const SizedBox(height: LogMyPlateSpacing.sectionSpacing),
              Text(
                PlateScoreCopy.disclaimer,
                style: Theme.of(
                  context,
                ).textTheme.labelSmall?.copyWith(color: colors.textTertiary),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Score, verdict, and what it was measured against.
class _Headline extends StatelessWidget {
  const _Headline({required this.score, required this.style});

  final PlateScore score;
  final PlateScoreBandStyle style;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // "/100" anchors the number: without it people do not know the scale.
        Semantics(
          label:
              '${score.score} out of 100, ${PlateScoreCopy.bandTitle(score.band)}',
          child: ExcludeSemantics(
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.baseline,
              textBaseline: TextBaseline.alphabetic,
              children: [
                Text(
                  '${score.score}',
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                    color: style.foreground,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                Text(
                  '/100',
                  style: Theme.of(
                    context,
                  ).textTheme.labelMedium?.copyWith(color: colors.textTertiary),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                PlateScoreCopy.bandTitle(score.band),
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: 2),
              Text(
                PlateScoreCopy.tierCaption(score),
                style: Theme.of(
                  context,
                ).textTheme.labelSmall?.copyWith(color: colors.textSecondary),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle({required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: Theme.of(context).textTheme.labelSmall?.copyWith(
        color: context.logmyplate.textSecondary,
        letterSpacing: 1.2,
      ),
    );
  }
}

/// One axis: label, bar, and a sentence explaining which way it leans.
class _AxisRow extends StatelessWidget {
  const _AxisRow({required this.axis, required this.mealLabel});

  final PlateScoreAxisResult axis;
  final PlateScoreMealLabel mealLabel;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;
    final fraction = (axis.score / 100).clamp(0.0, 1.0);
    final onTrack = axis.detail == PlateScoreAxisDetail.onTrack;

    return Semantics(
      label:
          '${PlateScoreCopy.axisLabel(axis.axis)}. '
          '${PlateScoreCopy.axisDetail(axis, mealLabel)}',
      child: ExcludeSemantics(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    PlateScoreCopy.axisLabel(axis.axis),
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                ),
                Icon(
                  onTrack ? Icons.check_circle_rounded : Icons.tune_rounded,
                  size: 15,
                  color: onTrack ? colors.textSecondary : colors.accent,
                ),
              ],
            ),
            const SizedBox(height: 6),
            ClipRRect(
              borderRadius: BorderRadius.circular(999),
              child: LinearProgressIndicator(
                value: fraction,
                minHeight: 6,
                backgroundColor: colors.border,
                valueColor: AlwaysStoppedAnimation<Color>(
                  onTrack ? colors.textPrimary : colors.textSecondary,
                ),
              ),
            ),
            const SizedBox(height: 5),
            Text(
              PlateScoreCopy.axisDetail(axis, mealLabel),
              style: Theme.of(
                context,
              ).textTheme.labelSmall?.copyWith(color: colors.textSecondary),
            ),
          ],
        ),
      ),
    );
  }
}

class _AdviceList extends StatelessWidget {
  const _AdviceList({
    required this.title,
    required this.lines,
    required this.icon,
  });

  final String title;
  final List<String> lines;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _SectionTitle(text: title),
        const SizedBox(height: 8),
        for (final line in lines)
          Padding(
            padding: const EdgeInsets.only(bottom: 6),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Padding(
                  padding: const EdgeInsets.only(top: 3),
                  child: Icon(icon, size: 15, color: colors.textSecondary),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    line,
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ),
              ],
            ),
          ),
      ],
    );
  }
}

class _WarningRow extends StatelessWidget {
  const _WarningRow({required this.warning});

  final PlateWarning warning;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(top: 3),
          child: Icon(
            Icons.info_outline_rounded,
            size: 15,
            color: colors.textSecondary,
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            warning.personalised
                ? '${warning.text} Flagged because of your health focus.'
                : warning.text,
            style: Theme.of(context).textTheme.bodySmall,
          ),
        ),
      ],
    );
  }
}

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
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      PlateScoreCopy.personaliseTitle,
                      style: Theme.of(context).textTheme.titleSmall,
                    ),
                    const SizedBox(height: 2),
                    Text(
                      PlateScoreCopy.personaliseBody,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: colors.textSecondary,
                      ),
                    ),
                  ],
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
