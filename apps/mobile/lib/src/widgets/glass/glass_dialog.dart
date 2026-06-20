import 'package:flutter/material.dart';

import 'glass_surface.dart';

class GlassDialog extends StatelessWidget {
  const GlassDialog({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(24.0),
  });

  final Widget child;
  final EdgeInsetsGeometry padding;

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: Colors.transparent,
      elevation: 0,
      insetPadding: const EdgeInsets.all(24.0),
      child: GlassSurface(
        isPremium: true,
        borderRadius: BorderRadius.circular(32.0),
        child: Padding(
          padding: padding,
          child: child,
        ),
      ),
    );
  }
}

class GlassBottomSheet extends StatelessWidget {
  const GlassBottomSheet({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(24.0),
  });

  final Widget child;
  final EdgeInsetsGeometry padding;

  @override
  Widget build(BuildContext context) {
    return GlassSurface(
      isPremium: true,
      borderRadius: const BorderRadius.vertical(top: Radius.circular(32.0)),
      child: SafeArea(
        child: Padding(
          padding: padding,
          child: child,
        ),
      ),
    );
  }
}
