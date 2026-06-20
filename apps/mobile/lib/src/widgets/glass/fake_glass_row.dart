import 'package:flutter/material.dart';

import '../../theme/glass_theme.dart';

class FakeGlassRow extends StatelessWidget {
  const FakeGlassRow({
    super.key,
    required this.child,
    this.borderRadius,
  });

  final Widget child;
  final BorderRadius? borderRadius;

  @override
  Widget build(BuildContext context) {
    final theme = context.glassTheme;
    final effectiveRadius = borderRadius ?? BorderRadius.circular(theme.borderRadius);

    return Container(
      decoration: BoxDecoration(
        color: theme.tintColor.withValues(alpha: theme.tintOpacity + 0.3),
        borderRadius: effectiveRadius,
        border: Border.all(color: theme.borderColor, width: theme.borderWidth),
        boxShadow: [theme.shadow],
      ),
      child: child,
    );
  }
}
