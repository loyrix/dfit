import 'package:flutter/material.dart';

import 'glass_surface.dart';

class GlassCard extends StatelessWidget {
  const GlassCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(12.0),
    this.borderRadius,
  });

  final Widget child;
  final EdgeInsetsGeometry padding;
  final BorderRadius? borderRadius;

  @override
  Widget build(BuildContext context) {
    return GlassSurface(
      isPremium: true,
      borderRadius: borderRadius,
      child: Padding(
        padding: padding,
        child: child,
      ),
    );
  }
}

class LiteGlassCard extends StatelessWidget {
  const LiteGlassCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(12.0),
    this.borderRadius,
  });

  final Widget child;
  final EdgeInsetsGeometry padding;
  final BorderRadius? borderRadius;

  @override
  Widget build(BuildContext context) {
    return GlassSurface(
      isPremium: false,
      borderRadius: borderRadius,
      child: Padding(
        padding: padding,
        child: child,
      ),
    );
  }
}

class GlassPill extends StatelessWidget {
  const GlassPill({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
  });

  final Widget child;
  final EdgeInsetsGeometry padding;

  @override
  Widget build(BuildContext context) {
    return GlassSurface(
      isPremium: true,
      borderRadius: BorderRadius.circular(100.0), // Stadium shape
      child: Padding(
        padding: padding,
        child: child,
      ),
    );
  }
}
