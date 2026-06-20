import 'package:flutter/material.dart';

/// Intentionally a no-op pass-through.
///
/// This previously wrapped buttons in a live `BackdropFilter` pill. On a flat
/// background that only drew a faint stadium box around plain text buttons
/// (visually noisy) and, with no platform fallback, caused scroll flicker on
/// Android. Buttons now render with their natural theme styling. The wrapper is
/// kept so existing call sites compile unchanged; prefer removing it over time.
class GlassWrapper extends StatelessWidget {
  const GlassWrapper({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) => child;
}
