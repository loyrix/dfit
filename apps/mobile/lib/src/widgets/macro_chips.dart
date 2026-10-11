import '../theme/logmyplate_spacing.dart';
import 'package:flutter/material.dart';

import '../theme/logmyplate_theme.dart';

class _GlassTintBox extends StatelessWidget {
  const _GlassTintBox({
    required this.color,
    required this.padding,
    required this.child,
  });

  final Color color;
  final EdgeInsetsGeometry padding;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: padding,
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.20),
        borderRadius: BorderRadius.circular(LogMyPlateSpacing.chipBorderRadius),
        border: Border.all(color: color.withValues(alpha: 0.35), width: 0.5),
      ),
      child: child,
    );
  }
}

class MacroTextChip extends StatelessWidget {
  const MacroTextChip({
    super.key,
    required this.label,
    required this.value,
    required this.color,
  });

  final String label;
  final num value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;

    return Expanded(
      child: _GlassTintBox(
        color: color,
        padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 8),
        child: Text(
          '$label ${value.round()}g',
          textAlign: TextAlign.center,
          overflow: TextOverflow.ellipsis,
          style: Theme.of(context).textTheme.labelSmall?.copyWith(
            color: colors.textPrimary,
            letterSpacing: 0,
          ),
        ),
      ),
    );
  }
}

class MacroDetailChip extends StatelessWidget {
  const MacroDetailChip({
    super.key,
    required this.label,
    required this.value,
    required this.share,
    required this.color,
    this.targetValue,
  });

  final String label;
  final double value;
  final double share;
  final Color color;

  /// Target grams for the day. Null or zero means none is set, and the chip
  /// falls back to the consumed figure with its share of energy.
  final double? targetValue;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;
    final target = targetValue;
    final hasTarget = target != null && target > 0;
    final valueStyle = Theme.of(context).textTheme.titleLarge?.copyWith(
      fontWeight: FontWeight.bold,
      height: 1.1,
      fontFeatures: const [FontFeature.tabularFigures()],
    );

    return Expanded(
      child: _GlassTintBox(
        color: color,
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              children: [
                Container(
                  width: 7,
                  height: 7,
                  decoration: BoxDecoration(
                    color: color,
                    shape: BoxShape.circle,
                  ),
                ),
                const Spacer(),
                // Against a gram target the share of energy is a second,
                // competing number, so it is left out.
                if (!hasTarget)
                  Text(
                    '${(share * 100).round()}%',
                    style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      color: colors.textTertiary,
                      letterSpacing: 0,
                      fontFeatures: const [FontFeature.tabularFigures()],
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 9),
            if (hasTarget)
              Semantics(
                label: '$label ${value.round()} of ${target.round()} grams',
                child: ExcludeSemantics(
                  // Three chips share the row, so a three-digit pair has to
                  // shrink rather than wrap or clip.
                  child: FittedBox(
                    fit: BoxFit.scaleDown,
                    alignment: Alignment.centerLeft,
                    child: Text.rich(
                      TextSpan(
                        text: '${value.round()}',
                        style: valueStyle,
                        children: [
                          TextSpan(
                            text: ' / ${target.round()}g',
                            style: Theme.of(context).textTheme.bodySmall
                                ?.copyWith(
                                  color: colors.textSecondary,
                                  fontFeatures: const [
                                    FontFeature.tabularFigures(),
                                  ],
                                ),
                          ),
                        ],
                      ),
                      maxLines: 1,
                    ),
                  ),
                ),
              )
            else
              Text('${value.round()}g', style: valueStyle),
            const SizedBox(height: 1),
            Text(
              label,
              style: Theme.of(
                context,
              ).textTheme.bodySmall?.copyWith(color: colors.textSecondary),
            ),
          ],
        ),
      ),
    );
  }
}
