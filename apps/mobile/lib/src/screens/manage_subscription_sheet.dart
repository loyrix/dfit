import 'package:flutter/material.dart';
import '../models/meal.dart';
import '../theme/logmyplate_colors.dart';
import '../theme/logmyplate_spacing.dart';
import '../theme/logmyplate_theme.dart';
import '../widgets/glass/glass_cards.dart';
import 'package:logmyplate_mobile/src/widgets/glass/glass_wrapper.dart';

class ManageSubscriptionSheet extends StatelessWidget {
  const ManageSubscriptionSheet({
    super.key,
    required this.subscription,
    required this.onManageInStore,
    required this.onRestore,
  });

  final SubscriptionStatus subscription;
  final VoidCallback onManageInStore;
  final Future<bool> Function() onRestore;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;
    final usage = subscription.usage;
    final storeLabel = switch (subscription.store) {
      SubscriptionStore.appStore => 'App Store',
      SubscriptionStore.playStore => 'Play Store',
      _ => 'Store',
    };
    final periodEnd = subscription.currentPeriodEnd;
    final periodEndText = periodEnd != null
        ? '${periodEnd.year}-${periodEnd.month.toString().padLeft(2, '0')}-${periodEnd.day.toString().padLeft(2, '0')}'
        : null;

    return SafeArea(
      child: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(LogMyPlateSpacing.itemSpacing),
          child: GlassCard(
            padding: const EdgeInsets.fromLTRB(18, 14, 18, 16),
            borderRadius: BorderRadius.circular(20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Center(
                  child: Container(
                    width: 36,
                    height: 4,
                    decoration: BoxDecoration(
                      color: colors.textSecondary.withValues(alpha: 0.4),
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(height: 18),
                Icon(
                  Icons.workspace_premium_rounded,
                  color: LogMyPlateColors.accent,
                  size: 40,
                ),
                const SizedBox(height: 12),
                Text(
                  'Premium',
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    color: colors.textPrimary,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                if (periodEndText != null) ...[
                  const SizedBox(height: 4),
                  Text(
                    'Next billing date: $periodEndText',
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: colors.textSecondary,
                    ),
                  ),
                ],
                const SizedBox(height: 4),
                Text(
                  storeLabel,
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: colors.textSecondary,
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  '${usage.remainingToday}/${usage.dailyLimit} today · ${usage.remainingThisPeriod}/${usage.monthlyLimit} this month',
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: colors.textPrimary,
                  ),
                ),
                const SizedBox(height: 20),
                GlassWrapper(
                  child: SizedBox(
                    height: 52,
                    child: ElevatedButton(
                      onPressed: onManageInStore,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: LogMyPlateColors.accent,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(
                            LogMyPlateSpacing.cardBorderRadius,
                          ),
                        ),
                      ),
                      child: Text(
                        'Manage in $storeLabel',
                        style: const TextStyle(fontWeight: FontWeight.w600),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 10),
                GlassWrapper(
                  child: SizedBox(
                    height: 44,
                    child: OutlinedButton(
                      onPressed: () async {
                        await onRestore();
                        if (context.mounted) Navigator.of(context).pop();
                      },
                      style: OutlinedButton.styleFrom(
                        foregroundColor: colors.textPrimary,
                        side: BorderSide(color: colors.border),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(
                            LogMyPlateSpacing.cardBorderRadius,
                          ),
                        ),
                      ),
                      child: const Text(
                        'Restore purchases',
                        style: TextStyle(fontWeight: FontWeight.w500),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 14),
                Text(
                  'Cancellation takes effect at the end of your current billing period. Manage or cancel anytime in your store account.',
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: colors.textSecondary,
                    height: 1.4,
                  ),
                ),
                const SizedBox(height: 8),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
