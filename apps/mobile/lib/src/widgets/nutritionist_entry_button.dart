import 'package:flutter/material.dart';
import '../theme/logmyplate_spacing.dart';

import '../theme/logmyplate_colors.dart';
import '../theme/logmyplate_theme.dart';

class NutritionistEntryButton extends StatelessWidget {
  const NutritionistEntryButton({
    super.key,
    this.isPremium = false,
    required this.onTap,
  });

  final bool isPremium;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Material(
      color: Colors.transparent,
      borderRadius: BorderRadius.circular(LogMyPlateSpacing.cardBorderRadius),
      child: InkWell(
        borderRadius: BorderRadius.circular(LogMyPlateSpacing.cardBorderRadius),
        onTap: onTap,
        child: Container(
          height: 56,
          padding: const EdgeInsets.symmetric(horizontal: 16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(LogMyPlateSpacing.cardBorderRadius),
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: isDark
                  ? [const Color(0xFF18211C), const Color(0xFF101412)]
                  : [const Color(0xFFFFFCF4), const Color(0xFFF7F0DF)],
            ),
            border: Border.all(
              color: LogMyPlateColors.accent.withValues(alpha: 0.22),
              width: 0.7,
            ),
          ),
          child: Row(
            children: [
              Icon(
                Icons.auto_awesome_rounded,
                size: 20,
                color: LogMyPlateColors.accent,
              ),
              const SizedBox(width: 10),
              Text(
                'Ask AI Nutritionist',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  color: colors.textPrimary,
                ),
              ),
              if (!isPremium) ...[
                const SizedBox(width: 6),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: LogMyPlateColors.accent.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.lock_rounded,
                        size: 10,
                        color: LogMyPlateColors.accent,
                      ),
                      const SizedBox(width: 2),
                      Text(
                        'PRO',
                        style: Theme.of(context).textTheme.labelSmall?.copyWith(
                          color: LogMyPlateColors.accent,
                          fontSize: 9,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
              const Spacer(),
              Icon(
                Icons.chevron_right_rounded,
                size: 20,
                color: colors.textTertiary,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
