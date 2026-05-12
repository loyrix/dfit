import 'package:flutter/material.dart';

import '../theme/dfit_colors.dart';
import '../theme/dfit_theme.dart';

class DFitStartupErrorApp extends StatelessWidget {
  const DFitStartupErrorApp({super.key, required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'DFit',
      debugShowCheckedModeBanner: false,
      theme: DFitTheme.dark(),
      home: DFitStartupErrorSurface(message: message),
    );
  }
}

class DFitStartupErrorSurface extends StatelessWidget {
  const DFitStartupErrorSurface({super.key, required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.ltr,
      child: Material(
        color: DFitColors.bgInk,
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(28),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 360),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 58,
                    height: 58,
                    decoration: BoxDecoration(
                      color: DFitColors.accent.withValues(alpha: 0.12),
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: DFitColors.accent.withValues(alpha: 0.35),
                      ),
                    ),
                    alignment: Alignment.center,
                    child: const Text(
                      'D',
                      style: TextStyle(
                        color: DFitColors.accent,
                        fontSize: 24,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  const SizedBox(height: 22),
                  const Text(
                    'DFit paused',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 22,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    _shortMessage(message),
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.68),
                      fontSize: 13,
                      height: 1.4,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  String _shortMessage(String value) {
    final trimmed = value.trim();
    if (trimmed.isEmpty) return 'Something stopped during launch.';
    return trimmed.length > 110 ? '${trimmed.substring(0, 110)}...' : trimmed;
  }
}
