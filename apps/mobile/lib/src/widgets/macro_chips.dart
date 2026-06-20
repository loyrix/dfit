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
        borderRadius: BorderRadius.circular(13),
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
  });

  final String label;
  final double value;
  final double share;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;

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
            Text(
              '${value.round()}g',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
                height: 1.1,
                fontFeatures: const [FontFeature.tabularFigures()],
              ),
            ),
            const SizedBox(height: 1),
            Text(
              label,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: colors.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
