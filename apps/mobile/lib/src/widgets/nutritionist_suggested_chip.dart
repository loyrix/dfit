import 'package:flutter/material.dart';

import '../theme/logmyplate_theme.dart';

class NutritionistSuggestedChips extends StatelessWidget {
  const NutritionistSuggestedChips({
    super.key,
    required this.prompts,
    this.onTap,
    this.disabled = false,
  });

  final List<String> prompts;
  final void Function(String prompt)? onTap;
  final bool disabled;

  @override
  Widget build(BuildContext context) {
    if (prompts.isEmpty) return const SizedBox.shrink();

    final colors = context.logmyplate;

    return SizedBox(
      height: 48,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: prompts.length,
        separatorBuilder: (_, _) => const SizedBox(width: 8),
        itemBuilder: (context, index) {
          final prompt = prompts[index];
          return Material(
            color: colors.mutedFill,
            borderRadius: BorderRadius.circular(99),
            child: InkWell(
              borderRadius: BorderRadius.circular(99),
              onTap: disabled ? null : () => onTap?.call(prompt),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(99),
                  border: Border.all(color: colors.border, width: 0.5),
                ),
                child: Text(
                  prompt,
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    color: disabled
                        ? colors.textTertiary
                        : colors.textSecondary,
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}
