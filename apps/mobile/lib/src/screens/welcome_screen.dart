import 'package:flutter/material.dart';

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
          child: LayoutBuilder(
            builder: (context, constraints) {
              final compact = constraints.maxHeight < 700;

              return Padding(
                padding: const EdgeInsets.fromLTRB(24, 24, 24, 24),
                child: Column(
                  children: [
                    const Spacer(flex: 2),
                    LogMyPlateBrandMark(size: compact ? 86 : 106),
                    SizedBox(height: compact ? 22 : 30),
                    Text(
                      'LogMyPlate',
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.displayLarge?.copyWith(
                        color: colors.textPrimary,
                        fontSize: compact ? 44 : 54,
                        height: 0.96,
                      ),
                    ),
                    const SizedBox(height: 14),
                    Text(
                      'AI-powered food tracking, without the hassle.',
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: colors.textSecondary,
                        height: 1.25,
                      ),
                    ),
                    SizedBox(height: compact ? 26 : 34),
                    _WelcomeSteps(compact: compact),
                    const Spacer(flex: 3),
                    Text(
                      'Start with one meal photo. Review the estimate. Keep your journal moving.',
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: colors.textSecondary,
                        height: 1.35,
                      ),
                    ),
                    const SizedBox(height: 22),
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
                    Text(
                      'Photos are analyzed and saved with meal logs',
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: colors.textTertiary,
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
        ),
      ),
    );
  }
}

class _WelcomeSteps extends StatelessWidget {
  const _WelcomeSteps({required this.compact});

  final bool compact;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;

    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children:
          [
            _WelcomeStep(icon: Icons.camera_alt_outlined, label: 'Photo'),
            _StepDivider(compact: compact),
            _WelcomeStep(icon: Icons.fact_check_outlined, label: 'Review'),
            _StepDivider(compact: compact),
            _WelcomeStep(icon: Icons.calendar_month_outlined, label: 'Journal'),
          ].map((child) {
            if (child is _StepDivider) return child;
            return DefaultTextStyle.merge(
              style: TextStyle(color: colors.textSecondary),
              child: child,
            );
          }).toList(),
    );
  }
}

class _WelcomeStep extends StatelessWidget {
  const _WelcomeStep({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, color: colors.accentText, size: 20),
        const SizedBox(height: 8),
        Text(
          label,
          style: Theme.of(context).textTheme.labelSmall?.copyWith(
            color: colors.textSecondary,
            letterSpacing: 0,
          ),
        ),
      ],
    );
  }
}

class _StepDivider extends StatelessWidget {
  const _StepDivider({required this.compact});

  final bool compact;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;

    return Container(
      width: compact ? 36 : 54,
      height: 1,
      margin: const EdgeInsets.fromLTRB(12, 0, 12, 22),
      color: colors.border,
    );
  }
}
