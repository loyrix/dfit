import 'package:flutter/material.dart';
import '../theme/logmyplate_spacing.dart';

import '../theme/logmyplate_colors.dart';
import '../theme/logmyplate_theme.dart';
import 'glass/glass_cards.dart';
import 'package:logmyplate_mobile/src/widgets/glass/glass_wrapper.dart';

Future<bool> confirmMealDeletion(BuildContext context) async {
  final confirmed = await showModalBottomSheet<bool>(
    context: context,
    backgroundColor: Colors.transparent,
    builder: (_) => const MealDeleteConfirmationSheet(),
  );
  return confirmed ?? false;
}

class MealDeleteDismissible extends StatelessWidget {
  const MealDeleteDismissible({
    super.key,
    required this.dismissKey,
    required this.onDelete,
    required this.child,
    this.borderRadius = 16,
  });

  final Key dismissKey;
  final Future<bool> Function() onDelete;
  final Widget child;
  final double borderRadius;

  @override
  Widget build(BuildContext context) {
    return Dismissible(
      key: dismissKey,
      direction: DismissDirection.endToStart,
      confirmDismiss: (_) => onDelete(),
      background: MealDeleteSwipeBackground(borderRadius: borderRadius),
      child: child,
    );
  }
}

class MealDeleteSwipeBackground extends StatelessWidget {
  const MealDeleteSwipeBackground({super.key, required this.borderRadius});

  final double borderRadius;

  @override
  Widget build(BuildContext context) {
    return Container(
      alignment: Alignment.centerRight,
      padding: const EdgeInsets.only(right: 18),
      decoration: BoxDecoration(
        color: LogMyPlateColors.destructive.withValues(alpha: 0.16),
        borderRadius: BorderRadius.circular(borderRadius),
        border: Border.all(
          color: LogMyPlateColors.destructive.withValues(alpha: 0.28),
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            Icons.delete_outline_rounded,
            color: LogMyPlateColors.destructive,
            size: 19,
          ),
          const SizedBox(width: 8),
          Text(
            'Delete',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: LogMyPlateColors.destructive,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

class MealDeleteConfirmationSheet extends StatelessWidget {
  const MealDeleteConfirmationSheet({super.key});

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;

    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(LogMyPlateSpacing.itemSpacing),
        child: LiteGlassCard(
          padding: const EdgeInsets.fromLTRB(18, 18, 18, 16),
          borderRadius: BorderRadius.circular(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'Delete this meal?',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 8),
            Text(
              'This removes the meal, its saved image, and the linked AI scan record.',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: colors.textSecondary,
                height: 1.35,
              ),
            ),
            const SizedBox(height: LogMyPlateSpacing.sectionSpacing),
            FilledButton(
              onPressed: () => Navigator.of(context).pop(true),
              style: FilledButton.styleFrom(
                backgroundColor: LogMyPlateColors.destructive,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 15),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(LogMyPlateSpacing.elementBorderRadius),
                  side: BorderSide(color: LogMyPlateColors.destructiveDeep),
                ),
              ),
              child: const Text('Delete meal'),
            ),
            const SizedBox(height: 8),
            GlassWrapper(child: TextButton(
              onPressed: () => Navigator.of(context).pop(false),
              child: const Text('Cancel'),
            )),
          ],
        ),
      ),
    ),
  );
  }
}
