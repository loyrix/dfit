import 'package:flutter/material.dart';

import '../models/meal.dart';
import '../theme/dfit_colors.dart';

class EnergyHeroCard extends StatelessWidget {
  const EnergyHeroCard({super.key, required this.totals, required this.target});

  final MacroTotals totals;
  final MacroTotals target;

  @override
  Widget build(BuildContext context) {
    final pct = target.calories == 0
        ? 0.0
        : (totals.calories / target.calories).clamp(0.0, 1.0);
    final left = (target.calories - totals.calories).clamp(0, target.calories);

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
                'ENERGY',
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
                      '/${target.calories} kcal',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Colors.white.withValues(alpha: 0.5),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Row(
                children: List.generate(10, (index) {
                  final active = index < (pct * 10).floor();
                  final partial = index == (pct * 10).floor() && pct > 0;
                  return Expanded(
                    child: Container(
                      height: 4,
                      margin: EdgeInsets.only(right: index == 9 ? 0 : 3),
                      decoration: BoxDecoration(
                        color: active
                            ? DFitColors.accent
                            : partial
                            ? DFitColors.accent.withValues(alpha: 0.35)
                            : Colors.white.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  );
                }),
              ),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    '${(pct * 100).round()}%',
                    style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      color: Colors.white.withValues(alpha: 0.4),
                    ),
                  ),
                  Text(
                    '+$left kcal left',
                    style: Theme.of(
                      context,
                    ).textTheme.labelSmall?.copyWith(color: DFitColors.accent),
                  ),
                ],
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
