import 'package:flutter/material.dart';
import 'package:liquid_glass_renderer/liquid_glass_renderer.dart';

import '../../theme/glass_theme.dart';

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

    final actualTintColor = tintColor ?? theme.tintColor;

    // Fallback to solid color when requested by a11y or when explicitly disabled.
    if (!theme.enabled || highContrast || disableAnimations) {
      return Container(
        decoration: BoxDecoration(
          color: actualTintColor.withValues(alpha: 0.95),
          borderRadius: borderRadius ?? BorderRadius.circular(theme.borderRadius),
          border: Border.all(color: theme.borderColor, width: theme.borderWidth),
          boxShadow: [theme.shadow],
        ),
        child: child,
      );
    }

    final effectiveRadius = borderRadius ?? BorderRadius.circular(theme.borderRadius);
    final blur = isPremium ? theme.blurSigma : theme.blurSigma * 0.6;
    final opacity = isPremium ? theme.tintOpacity : (theme.tintOpacity * 1.3).clamp(0.0, 0.9);

    return Container(
      decoration: BoxDecoration(
        borderRadius: effectiveRadius,
        boxShadow: [theme.shadow],
      ),
      child: RepaintBoundary(
        child: LiquidGlass.withOwnLayer(
          shape: LiquidRoundedSuperellipse(borderRadius: effectiveRadius.topLeft.x),
          settings: LiquidGlassSettings(
            blur: blur,
            glassColor: actualTintColor.withValues(alpha: opacity),
            thickness: isPremium ? 20.0 : 5.0,
            lightIntensity: 0.2,
            ambientStrength: 0.1,
            saturation: 1.2,
          ),
          child: Container(
            decoration: BoxDecoration(
              borderRadius: effectiveRadius,
              border: Border.all(color: theme.borderColor, width: theme.borderWidth),
              gradient: theme.gradient,
            ),
            child: child,
          ),
        ),
      ),
    );
  }
}
