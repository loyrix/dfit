import 'package:logmyplate_mobile/src/widgets/premium_button.dart';
import 'package:flutter/material.dart';
import '../theme/logmyplate_spacing.dart';

import '../models/auth_session.dart';
import '../models/meal.dart';
import '../services/app_links.dart';
import '../theme/logmyplate_colors.dart';
import '../theme/logmyplate_theme.dart';
import '../widgets/glass/glass_backdrop.dart';
import '../widgets/glass/glass_cards.dart';
import 'package:logmyplate_mobile/src/widgets/glass/glass_wrapper.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({
    super.key,
    required this.themeMode,
    required this.onThemeChanged,
    required this.session,
    this.subscription,
    this.healthTarget,
    required this.onSetTarget,
    required this.onOpenAccount,
    this.onOpenPaywall,
    this.onManage,
    required this.onDeleteAccount,
    required this.onSignOut,
    this.bottomPadding = 188,
  });

  final ThemeMode themeMode;
  final ValueChanged<ThemeMode> onThemeChanged;
  final AuthSession? session;
  final SubscriptionStatus? subscription;
  final HealthTarget? healthTarget;
  final VoidCallback onSetTarget;
  final VoidCallback onOpenAccount;
  final VoidCallback? onOpenPaywall;
  final VoidCallback? onManage;
  final Future<bool> Function() onDeleteAccount;
  final Future<void> Function() onSignOut;
  final double bottomPadding;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;
    final signedIn = session != null;

    return Scaffold(
      extendBodyBehindAppBar: true,
      backgroundColor: Colors.transparent,
      body: GlassBackdrop(
        child: SafeArea(
          child: ListView(
            padding: EdgeInsets.fromLTRB(16, 18, 16, bottomPadding),
          children: [
            Text(
              'Profile',
              style: Theme.of(
                context,
              ).textTheme.displayLarge?.copyWith(color: colors.textPrimary),
            ),
            const SizedBox(height: 6),
            Text(
              signedIn
                  ? 'Targets, account and app preferences.'
                  : 'Save your journal and tune your targets.',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: colors.textSecondary,
                height: 1.35,
              ),
            ),
            const SizedBox(height: LogMyPlateSpacing.sectionSpacing),
            _AccountHero(session: session, onTap: onOpenAccount),
            const SizedBox(height: LogMyPlateSpacing.sectionSpacing),
            _ProfileSection(
              title: 'Health Target',
              child: _HealthTargetCard(
                target: healthTarget,
                onTap: onSetTarget,
              ),
            ),
            if (onOpenPaywall != null) ...[
              const SizedBox(height: LogMyPlateSpacing.sectionSpacing),
              _ProfileSection(
                title: 'Premium',
                child: _PremiumAccessCard(
                  subscription: subscription,
                  onTap: onOpenPaywall!,
                  onManage: onManage ?? () {},
                ),
              ),
            ],
            const SizedBox(height: LogMyPlateSpacing.sectionSpacing),
            _ProfileSection(
              title: 'Theme',
              child: _ThemeSegment(
                themeMode: themeMode,
                onThemeChanged: onThemeChanged,
              ),
            ),
            const SizedBox(height: LogMyPlateSpacing.sectionSpacing),
            _ProfileSection(
              title: 'Privacy & legal',
              child: Column(
                children: [
                  _LinkRow(
                    icon: Icons.privacy_tip_outlined,
                    label: 'Privacy policy',
                    onTap: () => openLogMyPlateLink(
                      context,
                      LogMyPlateLinks.privacy,
                      copiedMessage: 'Privacy link copied',
                    ),
                  ),
                  const _ProfileRowDivider(),
                  _LinkRow(
                    icon: Icons.description_outlined,
                    label: 'Legal terms',
                    onTap: () => openLogMyPlateLink(
                      context,
                      LogMyPlateLinks.terms,
                      copiedMessage: 'Terms link copied',
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: LogMyPlateSpacing.sectionSpacing),
            _ProfileSection(
              title: 'Support',
              child: Column(
                children: [
                  _LinkRow(
                    icon: Icons.support_agent_rounded,
                    label: 'Contact support',
                    onTap: () => openLogMyPlateLink(
                      context,
                      LogMyPlateLinks.support,
                      copiedMessage: 'Support link copied',
                    ),
                  ),
                ],
              ),
            ),
            if (signedIn) ...[
              const SizedBox(height: LogMyPlateSpacing.lgSpacing),
              SizedBox(
                height: 52,
                child: GlassWrapper(child: OutlinedButton(
                  onPressed: onSignOut,
                  style: OutlinedButton.styleFrom(
                    foregroundColor: colors.textPrimary,
                    side: BorderSide(color: colors.border),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(LogMyPlateSpacing.cardBorderRadius),
                    ),
                  ),
                  child: const Text('Log out'),
                )),
              ),
            ],
          ],
        ),
      ),
    ));
  }

}

class _AccountHero extends StatelessWidget {
  const _AccountHero({required this.session, required this.onTap});

  final AuthSession? session;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;
    final signedIn = session != null;
    final providerCopy = Theme.of(context).platform == TargetPlatform.iOS
        ? 'Apple, Google or email'
        : 'Google or email';

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(LogMyPlateSpacing.heroCardBorderRadius),
      child: GlassCard(
        padding: const EdgeInsets.all(LogMyPlateSpacing.sectionSpacing),
        borderRadius: BorderRadius.circular(LogMyPlateSpacing.heroCardBorderRadius),
        child: Row(
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: LogMyPlateColors.accent.withValues(alpha: 0.18),
                shape: BoxShape.circle,
              ),
              child: Center(
                child: Text(
                  signedIn ? _initial(session!) : 'L',
                  style: Theme.of(
                    context,
                  ).textTheme.titleMedium?.copyWith(color: colors.accentText),
                ),
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    signedIn ? session!.displayName : 'Save your journal',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      color: colors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    signedIn
                        ? '${session!.provider.label} account'
                        : 'Use $providerCopy after free scans.',
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: colors.textSecondary,
                      height: 1.3,
                    ),
                  ),
                ],
              ),
            ),
            Icon(
              Icons.chevron_right_rounded,
              color: colors.textSecondary,
              size: 22,
            ),
          ],
        ),
      ),
    );
  }

  String _initial(AuthSession session) {
    final name = session.displayName.trim();
    if (name.isEmpty) return 'L';
    return name.characters.first.toUpperCase();
  }
}

class _PremiumAccessCard extends StatelessWidget {
  const _PremiumAccessCard({
    required this.subscription,
    required this.onTap,
    required this.onManage,
  });

  final SubscriptionStatus? subscription;
  final VoidCallback onTap;
  final VoidCallback onManage;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;
    final active = subscription?.active == true;
    final usage = subscription?.usage;
    final cancelled = subscription?.status == SubscriptionAccessStatus.cancelled;
    final title = !active
        ? 'Upgrade to Premium'
        : cancelled
            ? 'Premium (not renewing)'
            : 'Premium active';
    final subtitle = active && usage != null
        ? '${usage.remainingToday}/${usage.dailyLimit} scans today · ${usage.remainingThisPeriod}/${usage.monthlyLimit} this month'
        : '300 AI meal scans/month · up to 10 scans/day';

    return InkWell(
      onTap: active ? onManage : onTap,
      borderRadius: BorderRadius.circular(LogMyPlateSpacing.cardBorderRadius),
      child: Padding(
        padding: const EdgeInsets.all(LogMyPlateSpacing.cardPadding),
        child: Row(
          children: [
            Container(
              width: 42,
              height: 42,
              decoration: BoxDecoration(
                color: LogMyPlateColors.accent.withValues(alpha: 0.16),
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.workspace_premium_rounded,
                color: colors.accentText,
                size: 22,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      color: colors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    subtitle,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: colors.textSecondary,
                      height: 1.3,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            Icon(
              Icons.chevron_right_rounded,
              color: colors.textSecondary,
              size: 22,
            ),
          ],
        ),
      ),
    );
  }
}

class _ProfileSection extends StatelessWidget {
  const _ProfileSection({required this.title, required this.child});

  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: Theme.of(context).textTheme.labelSmall),
        const SizedBox(height: 8),
        LiteGlassCard(
          borderRadius: BorderRadius.circular(LogMyPlateSpacing.cardBorderRadius),
          padding: EdgeInsets.zero,
          child: child,
        ),
      ],
    );
  }
}

class _ThemeSegment extends StatelessWidget {
  const _ThemeSegment({required this.themeMode, required this.onThemeChanged});

  final ThemeMode themeMode;
  final ValueChanged<ThemeMode> onThemeChanged;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(8),
      child: Row(
        children: [
          _ThemePill(
            label: 'System',
            selected: themeMode == ThemeMode.system,
            onTap: () => onThemeChanged(ThemeMode.system),
          ),
          const SizedBox(width: 8),
          _ThemePill(
            label: 'Light',
            selected: themeMode == ThemeMode.light,
            onTap: () => onThemeChanged(ThemeMode.light),
          ),
          const SizedBox(width: 8),
          _ThemePill(
            label: 'Dark',
            selected: themeMode == ThemeMode.dark,
            onTap: () => onThemeChanged(ThemeMode.dark),
          ),
        ],
      ),
    );
  }
}

class _ThemePill extends StatelessWidget {
  const _ThemePill({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;

    return Expanded(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 160),
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: selected ? LogMyPlateColors.accent : Colors.transparent,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
              color: selected
                  ? LogMyPlateColors.accentDeep
                  : colors.textPrimary,
              letterSpacing: 0,
            ),
          ),
        ),
      ),
    );
  }
}

class _LinkRow extends StatelessWidget {
  const _LinkRow({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;

    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        child: Row(
          children: [
            Container(
              width: 28,
              height: 28,
              decoration: BoxDecoration(
                color: colors.accentText.withValues(alpha: 0.12),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: colors.accentText, size: 16),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                label,
                style: Theme.of(
                  context,
                ).textTheme.bodySmall?.copyWith(color: colors.textPrimary, height: 1.25),
              ),
            ),
            Icon(Icons.open_in_new_rounded, color: colors.textTertiary, size: 17),
          ],
        ),
      ),
    );
  }
}

class _ProfileRowDivider extends StatelessWidget {
  const _ProfileRowDivider();

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;

    return Padding(
      padding: const EdgeInsets.only(left: 54),
      child: Divider(height: 1, thickness: 0.5, color: colors.border),
    );
  }
}

class DeleteAccountSheet extends StatelessWidget {
  const DeleteAccountSheet({super.key, this.subscription});

  final SubscriptionStatus? subscription;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;

    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(14, 0, 14, 14),
        child: GlassCard(
          padding: const EdgeInsets.fromLTRB(22, 18, 22, 22),
          borderRadius: BorderRadius.circular(26),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Center(
                child: Container(
                  width: 46,
                  height: 5,
                  decoration: BoxDecoration(
                    color: colors.textTertiary.withValues(alpha: 0.36),
                    borderRadius: BorderRadius.circular(99),
                  ),
                ),
              ),
              const SizedBox(height: 24),
              Text(
                'Delete account and data?',
                style: Theme.of(
                  context,
                ).textTheme.titleLarge?.copyWith(color: colors.textPrimary),
              ),
              const SizedBox(height: 10),
              Text(
                'This permanently deletes your account, journal, saved photos, targets, and sign-in access from active systems. This cannot be undone.',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: colors.textSecondary,
                  height: 1.35,
                ),
              ),
              if (subscription?.active == true) ...[
                const SizedBox(height: 8),
                Text(
                  'Deleting your account does not cancel your subscription. Cancel it in the App Store / Play Store to stop billing.',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: colors.textTertiary,
                    height: 1.35,
                  ),
                ),
              ],
              const SizedBox(height: LogMyPlateSpacing.lgSpacing),
              SizedBox(
                height: 54,
                child: PremiumButton(
                  onPressed: () => Navigator.of(context).pop(true),
                  
                  child: const Text('Delete account'),
                ),
              ),
              const SizedBox(height: 10),
              SizedBox(
                height: 50,
                child: GlassWrapper(child: TextButton(
                  onPressed: () => Navigator.of(context).pop(false),
                  child: const Text('Keep account'),
                )),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _HealthTargetCard extends StatelessWidget {
  const _HealthTargetCard({required this.target, required this.onTap});

  final HealthTarget? target;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;
    final hasTarget = target != null && target!.dailyCalorieTarget > 0;

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(LogMyPlateSpacing.cardBorderRadius),
      child: Padding(
        padding: const EdgeInsets.all(LogMyPlateSpacing.cardPadding),
        child: Row(
          children: [
            Container(
              width: 42,
              height: 42,
              decoration: BoxDecoration(
                color: LogMyPlateColors.accent.withValues(alpha: 0.16),
                shape: BoxShape.circle,
              ),
              child: Icon(
                hasTarget ? Icons.track_changes_rounded : Icons.add_circle_outline_rounded,
                color: colors.accentText,
                size: 22,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    hasTarget ? '${target!.dailyCalorieTarget} kCal / day' : 'No target set',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          color: colors.textPrimary,
                        ),
                  ),
                  if (hasTarget) ...[
                    const SizedBox(height: 4),
                    Text(
                      '${target!.goal.label} • ${target!.friendlyBmiCategory}',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: colors.textSecondary,
                            height: 1.3,
                          ),
                    ),
                  ] else ...[
                    const SizedBox(height: 4),
                    Text(
                      'Set a daily goal for guidance',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: colors.textSecondary,
                            height: 1.3,
                          ),
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(width: 12),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: Theme.of(context).cardColor,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Theme.of(context).dividerColor),
              ),
              child: Text(
                hasTarget ? 'Edit' : 'Set',
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      color: colors.textPrimary,
                      letterSpacing: 0,
                    ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
