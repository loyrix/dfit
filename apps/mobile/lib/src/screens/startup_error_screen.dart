import 'package:flutter/material.dart';
import '../theme/logmyplate_spacing.dart';

import '../theme/logmyplate_colors.dart';
import '../theme/logmyplate_theme.dart';
import '../widgets/app_brand_mark.dart';

class LogMyPlateStartupErrorApp extends StatelessWidget {
  const LogMyPlateStartupErrorApp({super.key, required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'LogMyPlate',
      debugShowCheckedModeBanner: false,
      theme: LogMyPlateTheme.dark(),
      home: LogMyPlateStartupErrorSurface(message: message),
    );
  }
}

class LogMyPlateStartupErrorSurface extends StatelessWidget {
  const LogMyPlateStartupErrorSurface({super.key, required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.ltr,
      child: Material(
        color: LogMyPlateColors.bgInk,
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(28),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 360),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const LogMyPlateBrandMark(size: 58),
                  const SizedBox(height: LogMyPlateSpacing.lgSpacing),
                  const Text(
                    'LogMyPlate paused',
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
