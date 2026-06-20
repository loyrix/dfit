import 'package:flutter/material.dart';

import 'glass_surface.dart';

class GlassBottomNav extends StatelessWidget {
  const GlassBottomNav({
    super.key,
    required this.child,
    this.height = kBottomNavigationBarHeight,
  });

  final Widget child;
  final double height;

  @override
  Widget build(BuildContext context) {
    final bottomPadding = MediaQuery.paddingOf(context).bottom;
    
    return GlassSurface(
      isPremium: true,
      borderRadius: const BorderRadius.vertical(top: Radius.circular(24.0)),
      child: SizedBox(
        height: height + bottomPadding,
        child: Padding(
          padding: EdgeInsets.only(bottom: bottomPadding),
          child: child,
        ),
      ),
    );
  }
}
