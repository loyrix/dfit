import 'package:flutter/material.dart';

import 'glass_surface.dart';

class GlassScanFab extends StatelessWidget {
  const GlassScanFab({
    super.key,
    required this.onPressed,
    required this.icon,
    this.label,
    this.isPulsing = false,
  });

  final VoidCallback onPressed;
  final Widget icon;
  final Widget? label;
  final bool isPulsing;

  @override
  Widget build(BuildContext context) {
    // The pulsing effect can be applied around the FAB, but the FAB itself
    // is a premium glass surface.
    Widget fabContent = GlassSurface(
      isPremium: true,
      borderRadius: BorderRadius.circular(28.0), // Rounded rect or stadium depending on FAB style
      child: InkWell(
        onTap: onPressed,
        borderRadius: BorderRadius.circular(28.0),
        child: Container(
          constraints: const BoxConstraints(minWidth: 56.0, minHeight: 56.0),
          padding: label != null 
              ? const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0)
              : EdgeInsets.zero,
          child: Row(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              icon,
              if (label != null) ...[
                const SizedBox(width: 8.0),
                label!,
              ]
            ],
          ),
        ),
      ),
    );

    if (isPulsing) {
      // Basic pulse placeholder (real implementation would use AnimationController)
      return Stack(
        alignment: Alignment.center,
        children: [
          Container(
            width: 72,
            height: 72,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: Theme.of(context).colorScheme.primary.withValues(alpha: 0.2),
            ),
          ),
          fabContent,
        ],
      );
    }

    return fabContent;
  }
}
