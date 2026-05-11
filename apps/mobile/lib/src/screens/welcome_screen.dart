import 'package:flutter/material.dart';

import '../theme/dfit_colors.dart';

class WelcomeScreen extends StatelessWidget {
  const WelcomeScreen({super.key, required this.onStart});

  final VoidCallback onStart;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Spacer(),
              Center(
                child: SizedBox(
                  width: 190,
                  height: 190,
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      _Ring(size: 188, opacity: 0.16),
                      _Ring(size: 142, opacity: 0.24),
                      _Ring(size: 96, opacity: 0.34),
                      Container(
                        width: 54,
                        height: 54,
                        decoration: const BoxDecoration(
                          color: DFitColors.accent,
                          shape: BoxShape.circle,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const Spacer(),
              Text(
                'DFit',
                style: Theme.of(
                  context,
                ).textTheme.displayLarge?.copyWith(fontSize: 46),
              ),
              const SizedBox(height: 10),
              Text(
                'Food tracking, without the typing.',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  color: DFitColors.textSecondaryLight,
                  height: 1.2,
                ),
              ),
              const SizedBox(height: 28),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  style: FilledButton.styleFrom(
                    backgroundColor: DFitColors.textPrimaryLight,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                  onPressed: onStart,
                  child: const Text('Start first scan'),
                ),
              ),
              const SizedBox(height: 14),
              Center(
                child: Text(
                  'Photo is analyzed, not stored',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: DFitColors.textSecondaryLight,
                  ),
                ),
              ),
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }
}

class _Ring extends StatelessWidget {
  const _Ring({required this.size, required this.opacity});

  final double size;
  final double opacity;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        border: Border.all(color: DFitColors.accent.withValues(alpha: opacity)),
        shape: BoxShape.circle,
      ),
    );
  }
}
