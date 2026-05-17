import 'package:flutter/material.dart';

import '../models/meal.dart';
import '../theme/dfit_colors.dart';

class EnergyHeroCard extends StatelessWidget {
  const EnergyHeroCard({
    super.key,
    required this.totals,
    required this.mealCount,
    this.label = 'Energy',
  });

  final MacroTotals totals;
  final int mealCount;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: DFitColors.surfaceHero,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Stack(
        children: [
          const Positioned(right: -52, top: -52, child: _HeroRings()),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  color: Colors.white.withValues(alpha: 0.5),
                  letterSpacing: 1.8,
                ),
              ),
              const SizedBox(height: 10),
              Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    '${totals.calories}',
                    style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                      color: Colors.white,
                      fontSize: 38,
                      fontFeatures: const [FontFeature.tabularFigures()],
                    ),
                  ),
                  const SizedBox(width: 6),
                  Padding(
                    padding: const EdgeInsets.only(bottom: 4),
                    child: Text(
                      'kCal',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Colors.white.withValues(alpha: 0.5),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Container(
                height: 1,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.10),
                  borderRadius: BorderRadius.circular(99),
                ),
              ),
              const SizedBox(height: 10),
              Text(
                mealCount == 0
                    ? 'No meals logged yet'
                    : '$mealCount ${mealCount == 1 ? 'meal' : 'meals'} logged',
                style: Theme.of(
                  context,
                ).textTheme.bodySmall?.copyWith(color: DFitColors.accent),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _HeroRings extends StatelessWidget {
  const _HeroRings();

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 140,
      height: 140,
      child: Stack(
        alignment: Alignment.center,
        children: List.generate(3, (index) {
          final size = 76.0 + (index * 28);
          return Container(
            width: size,
            height: size,
            decoration: BoxDecoration(
              border: Border.all(
                color: DFitColors.accent.withValues(alpha: 0.08 + index * 0.04),
              ),
              shape: BoxShape.circle,
            ),
          );
        }),
      ),
    );
  }
}
