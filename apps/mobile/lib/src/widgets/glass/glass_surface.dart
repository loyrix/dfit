import 'dart:ui';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

import '../../theme/glass_theme.dart';

/// A single, production-grade glass surface.
///
/// On iOS (and other non-Android platforms) it uses Flutter's native
/// [BackdropFilter] to blur the content behind the surface — stable,
/// GPU-friendly, and it never blurs the surface's own children (so painted
/// content like rings/charts stays crisp).
///
/// On Android — and whenever accessibility requests high contrast or reduced
/// motion, or the theme disables glass — it falls back to an opaque tinted
/// surface. Live [BackdropFilter] blur flickers while scrolling on many Android
/// devices, so the fallback is intentional, not a downgrade.
class GlassSurface extends StatelessWidget {
  const GlassSurface({
    super.key,
    required this.child,
    this.borderRadius,
    this.isPremium = true,
    this.tintColor,
  });

  final Widget child;
  final BorderRadius? borderRadius;
  final bool isPremium;
  final Color? tintColor;

  @override
  Widget build(BuildContext context) {
    final theme = context.glassTheme;
    final highContrast = MediaQuery.highContrastOf(context);
    final disableAnimations = MediaQuery.disableAnimationsOf(context);
    final isAndroid = defaultTargetPlatform == TargetPlatform.android;

    final actualTintColor = tintColor ?? theme.tintColor;
    final effectiveRadius =
        borderRadius ?? BorderRadius.circular(theme.borderRadius);

    // Solid fallback for a11y, when disabled, or on Android to avoid scroll
    // flicker from heavy live BackdropFilters.
    if (!theme.enabled || highContrast || disableAnimations || isAndroid) {
      return DecoratedBox(
        decoration: BoxDecoration(
          color: actualTintColor.withValues(alpha: 0.95),
          borderRadius: effectiveRadius,
          border:
              Border.all(color: theme.borderColor, width: theme.borderWidth),
          boxShadow: [theme.shadow],
        ),
        child: child,
      );
    }

    final blur = isPremium ? theme.blurSigma : theme.blurSigma * 0.6;
    final opacity = isPremium
        ? theme.tintOpacity
        : (theme.tintOpacity * 1.3).clamp(0.0, 0.9);

    // Premium path: blur what's behind, then layer a translucent tint, the
    // subtle gradient and a hairline border on top. Children are drawn sharp.
    return DecoratedBox(
      decoration: BoxDecoration(
        borderRadius: effectiveRadius,
        boxShadow: [theme.shadow],
      ),
      child: ClipRRect(
        borderRadius: effectiveRadius,
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: blur, sigmaY: blur),
          child: DecoratedBox(
            decoration: BoxDecoration(
              color: actualTintColor.withValues(alpha: opacity),
              borderRadius: effectiveRadius,
            ),
            child: DecoratedBox(
              decoration: BoxDecoration(
                borderRadius: effectiveRadius,
                border: Border.all(
                  color: theme.borderColor,
                  width: theme.borderWidth,
                ),
                gradient: theme.gradient,
              ),
              child: child,
            ),
          ),
        ),
      ),
    );
  }
}
