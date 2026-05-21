import 'package:flutter/material.dart';

import '../theme/logmyplate_surfaces.dart';
import '../theme/logmyplate_theme.dart';
import '../widgets/app_brand_mark.dart';
import '../widgets/logmyplate_background.dart';

class WelcomeScreen extends StatelessWidget {
  const WelcomeScreen({super.key, required this.onStart});

  final VoidCallback onStart;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;

    return Scaffold(
      backgroundColor: colors.background,
      body: LogMyPlateAmbientBackground(
        child: SafeArea(
          child: ListView(
            padding: const EdgeInsets.fromLTRB(20, 26, 20, 24),
            children: [
              const SizedBox(height: 34),
              const Center(child: LogMyPlateBrandMark(size: 92)),
              const SizedBox(height: 26),
              Text(
                'LogMyPlate',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.displayLarge?.copyWith(
                  color: colors.textPrimary,
                  fontSize: 46,
                ),
              ),
              const SizedBox(height: 10),
              Text(
                'AI-powered food tracking, without the hassle.',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  color: colors.textSecondary,
                  height: 1.22,
                ),
              ),
              const SizedBox(height: 22),
              Row(
                children: const [
                  Expanded(child: _WelcomeSignal(label: 'Photo')),
                  SizedBox(width: 8),
                  Expanded(child: _WelcomeSignal(label: 'Review')),
                  SizedBox(width: 8),
                  Expanded(child: _WelcomeSignal(label: 'Journal')),
                ],
              ),
              const SizedBox(height: 30),
              Text(
                'Start with one clear meal photo. Add a short note, review the estimate, and keep your journal moving.',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: colors.textSecondary,
                  height: 1.35,
                ),
              ),
              const SizedBox(height: 34),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  style: FilledButton.styleFrom(
                    backgroundColor: colors.primaryAction,
                    foregroundColor: colors.primaryActionText,
                    padding: const EdgeInsets.symmetric(vertical: 17),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(18),
                    ),
                  ),
                  onPressed: onStart,
                  child: const Text('Start first scan'),
                ),
              ),
              const SizedBox(height: 14),
              Center(
                child: Text(
                  'Photos are analyzed and saved with meal logs',
                  style: Theme.of(
                    context,
                  ).textTheme.bodySmall?.copyWith(color: colors.textTertiary),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _WelcomeSignal extends StatelessWidget {
  const _WelcomeSignal({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    final surface = LogMyPlateHeroSurfaceStyle.of(context);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 9),
      decoration: BoxDecoration(
        color: surface.chipFill,
        borderRadius: BorderRadius.circular(99),
        border: Border.all(color: surface.chipBorder, width: 0.6),
      ),
      child: Text(
        label,
        textAlign: TextAlign.center,
        overflow: TextOverflow.ellipsis,
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
          color: surface.accentText,
          letterSpacing: 0,
        ),
      ),
    );
  }
}
