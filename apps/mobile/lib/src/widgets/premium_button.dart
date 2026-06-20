import 'package:flutter/material.dart';

import '../theme/logmyplate_colors.dart';
import '../theme/logmyplate_spacing.dart';

class PremiumButton extends StatelessWidget {
  const PremiumButton({
    super.key,
    required this.onPressed,
    required this.child,
    this.icon,
  });

  const PremiumButton.icon({
    super.key,
    required this.onPressed,
    required Widget label,
    required this.icon,
  }) : child = label;

  final VoidCallback? onPressed;
  final Widget child;
  final Widget? icon;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final gradientColors = [const Color(0xFFFFE3A3), LogMyPlateColors.accent];
        
    final textColor = LogMyPlateColors.bgInk;
    final shadowColor = LogMyPlateColors.accent.withValues(alpha: isDark ? 0.3 : 0.4);

    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: gradientColors,
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(LogMyPlateSpacing.elementBorderRadius),
        boxShadow: [
          BoxShadow(
            color: shadowColor,
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
        border: Border.all(
          color: Colors.white.withValues(alpha: isDark ? 0.2 : 0.1),
          width: 0.5,
        ),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onPressed,
          borderRadius: BorderRadius.circular(LogMyPlateSpacing.elementBorderRadius),
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 15, horizontal: 24),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              mainAxisSize: MainAxisSize.min,
              children: [
                if (icon != null) ...[
                  IconTheme.merge(
                    data: IconThemeData(color: textColor, size: 18),
                    child: icon!,
                  ),
                  const SizedBox(width: 8),
                ],
                DefaultTextStyle.merge(
                  style: Theme.of(context).textTheme.labelLarge?.copyWith(
                    color: textColor,
                    fontWeight: FontWeight.w600,
                  ),
                  child: child,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
