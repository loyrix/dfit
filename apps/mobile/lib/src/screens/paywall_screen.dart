import 'package:flutter/material.dart';

import '../models/meal.dart';
import '../services/revenuecat_subscription_service.dart';
import '../theme/logmyplate_colors.dart';
import '../theme/logmyplate_theme.dart';
import '../widgets/app_brand_mark.dart';

class PremiumPaywallSheet extends StatefulWidget {
  const PremiumPaywallSheet({
    super.key,
    required this.offering,
    required this.subscription,
    required this.onPurchase,
    required this.onRestore,
  });

  final PremiumOffering offering;
  final SubscriptionStatus? subscription;
  final Future<bool> Function(PremiumPlan plan) onPurchase;
  final Future<bool> Function() onRestore;

  @override
  State<PremiumPaywallSheet> createState() => _PremiumPaywallSheetState();
}

class _PremiumPaywallSheetState extends State<PremiumPaywallSheet> {
  PremiumPlan? _selectedPlan;
  PremiumPlan? _purchasingPlan;
  bool _restoring = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _selectedPlan = widget.offering.defaultPlan;
  }

  bool get _busy => _purchasingPlan != null || _restoring;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;
    final selectedPlan = _selectedPlan;

    return SafeArea(
      child: SingleChildScrollView(
        child: Container(
          margin: const EdgeInsets.all(12),
          padding: const EdgeInsets.fromLTRB(18, 14, 18, 16),
          decoration: BoxDecoration(
            color: colors.surfaceCard,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: colors.border, width: 0.6),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.18),
                blurRadius: 24,
                offset: const Offset(0, 14),
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                children: [
                  const SizedBox(width: 40),
                  const Spacer(),
                  Container(
                    width: 44,
                    height: 5,
                    decoration: BoxDecoration(
                      color: colors.textTertiary.withValues(alpha: 0.34),
                      borderRadius: BorderRadius.circular(99),
                    ),
                  ),
                  const Spacer(),
                  IconButton(
                    onPressed: _busy ? null : () => Navigator.of(context).pop(),
                    icon: const Icon(Icons.close_rounded),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const LogMyPlateBrandMark(size: 52, showHalo: false),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'LogMyPlate Premium',
                          style: Theme.of(context).textTheme.titleLarge
                              ?.copyWith(color: colors.textPrimary),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          'More AI meal scans without waiting on ad unlocks.',
                          style: Theme.of(context).textTheme.bodySmall
                              ?.copyWith(
                                color: colors.textSecondary,
                                height: 1.35,
                              ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 18),
              _FeatureRow(
                icon: Icons.auto_awesome_rounded,
                title: '300 AI meal scans/month',
              ),
              const SizedBox(height: 10),
              _FeatureRow(
                icon: Icons.today_rounded,
                title: 'Up to 10 scans/day',
              ),
              const SizedBox(height: 10),
              _FeatureRow(
                icon: Icons.bolt_rounded,
                title: 'Premium scans work without rewarded ads',
              ),
              const SizedBox(height: 18),
              if (widget.offering.plans.isEmpty)
                _UnavailablePlans()
              else
                ...widget.offering.plans.map(
                  (plan) => Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: _PlanCard(
                      plan: plan,
                      selected: plan == selectedPlan,
                      busy: _purchasingPlan == plan,
                      onTap: _busy
                          ? null
                          : () => setState(() => _selectedPlan = plan),
                    ),
                  ),
                ),
              if (_error != null) ...[
                const SizedBox(height: 4),
                Text(
                  _error!,
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: LogMyPlateColors.destructive,
                    height: 1.3,
                  ),
                ),
                const SizedBox(height: 8),
              ] else
                const SizedBox(height: 8),
              SizedBox(
                height: 54,
                child: FilledButton(
                  onPressed: selectedPlan == null || _busy
                      ? null
                      : () => _purchase(selectedPlan),
                  style: FilledButton.styleFrom(
                    backgroundColor: colors.primaryAction,
                    foregroundColor: colors.primaryActionText,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                  child: _purchasingPlan == selectedPlan
                      ? SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: colors.primaryActionText,
                          ),
                        )
                      : Text(
                          selectedPlan == null
                              ? 'Continue'
                              : 'Continue with ${selectedPlan.kind.displayName}',
                        ),
                ),
              ),
              const SizedBox(height: 8),
              TextButton(
                onPressed: _busy ? null : _restore,
                child: Text(_restoring ? 'Restoring...' : 'Restore purchase'),
              ),
              Text(
                'Subscription renews through the App Store or Google Play. Cancel anytime in store account settings.',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  color: colors.textTertiary,
                  height: 1.35,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _purchase(PremiumPlan plan) async {
    setState(() {
      _purchasingPlan = plan;
      _error = null;
    });

    try {
      final activated = await widget.onPurchase(plan);
      if (!mounted) return;
      if (activated) {
        Navigator.of(context).pop(true);
        return;
      }
      setState(() {
        _error = 'Purchase completed. Premium access is still syncing.';
      });
    } on RevenueCatPurchaseCancelledException {
      if (mounted) setState(() => _error = null);
    } catch (error) {
      if (mounted) setState(() => _error = error.toString());
    } finally {
      if (mounted) setState(() => _purchasingPlan = null);
    }
  }

  Future<void> _restore() async {
    setState(() {
      _restoring = true;
      _error = null;
    });

    try {
      final restored = await widget.onRestore();
      if (!mounted) return;
      if (restored) {
        Navigator.of(context).pop(true);
        return;
      }
      setState(() => _error = 'No active Premium purchase was found.');
    } catch (error) {
      if (mounted) setState(() => _error = error.toString());
    } finally {
      if (mounted) setState(() => _restoring = false);
    }
  }
}

class _FeatureRow extends StatelessWidget {
  const _FeatureRow({required this.icon, required this.title});

  final IconData icon;
  final String title;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;

    return Row(
      children: [
        Container(
          width: 30,
          height: 30,
          decoration: BoxDecoration(
            color: LogMyPlateColors.accent.withValues(alpha: 0.14),
            shape: BoxShape.circle,
          ),
          child: Icon(icon, color: colors.accentText, size: 16),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Text(
            title,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: colors.textPrimary,
              height: 1.25,
            ),
          ),
        ),
      ],
    );
  }
}

class _PlanCard extends StatelessWidget {
  const _PlanCard({
    required this.plan,
    required this.selected,
    required this.busy,
    required this.onTap,
  });

  final PremiumPlan plan;
  final bool selected;
  final bool busy;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;
    final borderColor = selected
        ? LogMyPlateColors.accent
        : colors.border.withValues(alpha: 0.9);
    final fillColor = selected
        ? LogMyPlateColors.accent.withValues(alpha: 0.11)
        : colors.mutedFill.withValues(alpha: 0.45);

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 160),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: fillColor,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: borderColor, width: selected ? 1.2 : 0.6),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Icon(
              selected
                  ? Icons.radio_button_checked_rounded
                  : Icons.radio_button_off_rounded,
              color: selected ? colors.accentText : colors.textTertiary,
              size: 20,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Flexible(
                        child: Text(
                          plan.kind.displayName,
                          overflow: TextOverflow.ellipsis,
                          style: Theme.of(context).textTheme.titleMedium
                              ?.copyWith(color: colors.textPrimary),
                        ),
                      ),
                      if (plan.badge != null) ...[
                        const SizedBox(width: 8),
                        _PlanBadge(label: plan.badge!),
                      ],
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    [
                      if (plan.pricePerMonth != null)
                        '${plan.pricePerMonth}/month',
                      if (plan.valueCopy != null) plan.valueCopy!,
                    ].join(' - '),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: colors.textSecondary,
                      height: 1.25,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  plan.price,
                  style: Theme.of(
                    context,
                  ).textTheme.titleMedium?.copyWith(color: colors.textPrimary),
                ),
                const SizedBox(height: 3),
                Text(
                  plan.cadence,
                  style: Theme.of(
                    context,
                  ).textTheme.labelSmall?.copyWith(color: colors.textSecondary),
                ),
              ],
            ),
            if (busy) ...[
              const SizedBox(width: 10),
              SizedBox(
                width: 16,
                height: 16,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: colors.accentText,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _PlanBadge extends StatelessWidget {
  const _PlanBadge({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 4),
      decoration: BoxDecoration(
        color: LogMyPlateColors.accent,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: Theme.of(
          context,
        ).textTheme.labelSmall?.copyWith(color: colors.accentOn, fontSize: 10),
      ),
    );
  }
}

class _UnavailablePlans extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: colors.mutedFill,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: colors.border),
      ),
      child: Text(
        'Premium plans are not available from the store yet.',
        textAlign: TextAlign.center,
        style: Theme.of(context).textTheme.bodySmall?.copyWith(
          color: colors.textSecondary,
          height: 1.35,
        ),
      ),
    );
  }
}
