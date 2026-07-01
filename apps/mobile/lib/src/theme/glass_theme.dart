import 'package:flutter/material.dart';

@immutable
class GlassTheme extends ThemeExtension<GlassTheme> {
  const GlassTheme({
    required this.blurSigma,
    required this.tintColor,
    required this.tintOpacity,
    required this.borderColor,
    required this.borderWidth,
    required this.borderRadius,
    required this.gradient,
    required this.shadow,
    required this.enabled,
  });

  final double blurSigma;
  final Color tintColor;
  final double tintOpacity;
  final Color borderColor;
  final double borderWidth;
  final double borderRadius;
  final LinearGradient gradient;
  final BoxShadow shadow;
  final bool enabled;

  static GlassTheme light() {
    return GlassTheme(
      blurSigma: 24.0,
      tintColor: Colors.white,
      tintOpacity: 0.45,
      // A faint neutral hairline gives the (near-white) card a defined edge
      // against the cream background — a white border was invisible there.
      borderColor: const Color(0xFF1A1F1C).withValues(alpha: 0.08),
      borderWidth: 1.0,
      borderRadius: 24.0,
      gradient: LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [
          Colors.white.withValues(alpha: 0.8),
          Colors.white.withValues(alpha: 0.2),
        ],
      ),
      // Softer-but-present grounded shadow so cards visibly lift off the
      // near-white background instead of blending into it.
      shadow: BoxShadow(
        color: Colors.black.withValues(alpha: 0.12),
        blurRadius: 28.0,
        offset: const Offset(0, 12),
        spreadRadius: -4.0,
      ),
      enabled: true,
    );
  }

  static GlassTheme dark() {
    return GlassTheme(
      blurSigma: 16.0,
      tintColor: const Color(0xFF202020),
      tintOpacity: 0.45,
      borderColor: Colors.white.withValues(alpha: 0.12),
      borderWidth: 1.0,
      borderRadius: 24.0,
      gradient: LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [
          Colors.white.withValues(alpha: 0.15),
          Colors.white.withValues(alpha: 0.03),
        ],
      ),
      shadow: BoxShadow(
        color: Colors.black.withValues(alpha: 0.5),
        blurRadius: 24.0,
        offset: const Offset(0, 12),
      ),
      enabled: true,
    );
  }

  static GlassTheme of(BuildContext context) {
    return Theme.of(context).extension<GlassTheme>() ??
        (Theme.of(context).brightness == Brightness.dark
            ? GlassTheme.dark()
            : GlassTheme.light());
  }

  @override
  GlassTheme copyWith({
    double? blurSigma,
    Color? tintColor,
    double? tintOpacity,
    Color? borderColor,
    double? borderWidth,
    double? borderRadius,
    LinearGradient? gradient,
    BoxShadow? shadow,
    bool? enabled,
  }) {
    return GlassTheme(
      blurSigma: blurSigma ?? this.blurSigma,
      tintColor: tintColor ?? this.tintColor,
      tintOpacity: tintOpacity ?? this.tintOpacity,
      borderColor: borderColor ?? this.borderColor,
      borderWidth: borderWidth ?? this.borderWidth,
      borderRadius: borderRadius ?? this.borderRadius,
      gradient: gradient ?? this.gradient,
      shadow: shadow ?? this.shadow,
      enabled: enabled ?? this.enabled,
    );
  }

  @override
  GlassTheme lerp(ThemeExtension<GlassTheme>? other, double t) {
    if (other is! GlassTheme) return this;
    return GlassTheme(
      blurSigma: lerpDouble(blurSigma, other.blurSigma, t) ?? blurSigma,
      tintColor: Color.lerp(tintColor, other.tintColor, t) ?? tintColor,
      tintOpacity: lerpDouble(tintOpacity, other.tintOpacity, t) ?? tintOpacity,
      borderColor: Color.lerp(borderColor, other.borderColor, t) ?? borderColor,
      borderWidth: lerpDouble(borderWidth, other.borderWidth, t) ?? borderWidth,
      borderRadius: lerpDouble(borderRadius, other.borderRadius, t) ?? borderRadius,
      gradient: LinearGradient.lerp(gradient, other.gradient, t) ?? gradient,
      shadow: BoxShadow.lerp(shadow, other.shadow, t) ?? shadow,
      enabled: t < 0.5 ? enabled : other.enabled,
    );
  }

  double? lerpDouble(double? a, double? b, double t) {
    if (a == null && b == null) return null;
    if (a == null) return b;
    if (b == null) return a;
    return a + (b - a) * t;
  }
}

extension GlassThemeContext on BuildContext {
  GlassTheme get glassTheme => GlassTheme.of(this);
}
