import 'package:flutter/material.dart';

import 'glass_cards.dart';
import '../../theme/logmyplate_theme.dart';
import '../../theme/logmyplate_spacing.dart';

class GlassSectionCard extends StatelessWidget {
  const GlassSectionCard({
    super.key,
    required this.title,
    this.trailing,
    required this.child,
    this.padding = const EdgeInsets.all(LogMyPlateSpacing.cardPadding),
    this.onTap,
  });

  final String title;
  final Widget? trailing;
  final Widget child;
  final EdgeInsetsGeometry padding;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;
    
    final content = Padding(
      padding: padding,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Text(
                title,
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  color: colors.textSecondary,
                  letterSpacing: 1.3,
                ),
              ),
              if (trailing != null) ...[
                const Spacer(),
                trailing!,
              ],
            ],
          ),
          const SizedBox(height: LogMyPlateSpacing.itemSpacing),
          child,
        ],
      ),
    );

    return LiteGlassCard(
      padding: EdgeInsets.zero,
      child: onTap != null
          ? Material(
              type: MaterialType.transparency,
              child: InkWell(
                borderRadius: BorderRadius.circular(24.0), // match standard glass border radius
                onTap: onTap,
                child: content,
              ),
            )
          : content,
    );
  }
}
