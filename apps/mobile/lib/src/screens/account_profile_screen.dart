import 'package:logmyplate_mobile/src/widgets/premium_button.dart';
import 'package:flutter/material.dart';
import '../theme/logmyplate_spacing.dart';

import '../models/auth_session.dart';
import '../models/meal.dart';
import '../theme/logmyplate_colors.dart';
import '../theme/logmyplate_theme.dart';
import '../widgets/app_brand_mark.dart';
import '../widgets/glass/glass_backdrop.dart';
import '../widgets/glass/glass_cards.dart';
import '../widgets/primitive_icons.dart';
import 'package:logmyplate_mobile/src/widgets/glass/glass_wrapper.dart';

class AccountProfileScreen extends StatelessWidget {
  const AccountProfileScreen({
    super.key,
    required this.session,
    required this.loading,
    this.subscription,
    this.error,
    this.onClearError,
    required this.onSignOut,
    required this.onDeactivateProfile,
    required this.onDeleteProfile,
  });

  final AuthSession session;
  final bool loading;
  final SubscriptionStatus? subscription;
  final String? error;
  final VoidCallback? onClearError;
  final Future<bool> Function() onSignOut;
  final Future<bool> Function() onDeactivateProfile;
  final Future<bool> Function() onDeleteProfile;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;

    return Scaffold(
      extendBodyBehindAppBar: true,
      backgroundColor: Colors.transparent,
      body: GlassBackdrop(
        child: SafeArea(
          child: Stack(
            children: [
              ListView(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 32),
              children: [
                Align(
                  alignment: Alignment.centerLeft,
                  child: IconButton(
                    onPressed: loading
                        ? null
                        : () => Navigator.of(context).pop(),
                    icon: const BackMark(),
                  ),
                ),
                const SizedBox(height: LogMyPlateSpacing.lgSpacing),
                Center(child: _AccountAvatar(session: session)),
                const SizedBox(height: 24),
                Text(
                  'Profile',
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    color: colors.textSecondary,
                    letterSpacing: 1.8,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  session.displayName,
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                    color: colors.textPrimary,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  '${session.provider.label} account',
                  textAlign: TextAlign.center,
                  style: Theme.of(
                    context,
                  ).textTheme.bodySmall?.copyWith(color: colors.textSecondary),
                ),
                if (error != null) ...[
                  const SizedBox(height: LogMyPlateSpacing.sectionSpacing),
                  _AccountErrorBanner(message: error!, onDismiss: onClearError),
                ],
                const SizedBox(height: 28),
                _ProfileSection(
                  title: 'Account',
                  children: [
                    _ProfileRow(label: 'Status', value: 'Signed in'),
                    _ProfileRow(
                      label: 'Provider',
                      value: session.provider.label,
                    ),
                    _ProfileRow(
                      label: 'Journal',
                      value: 'Synced to this account',
                    ),
                  ],
                ),
                const SizedBox(height: LogMyPlateSpacing.sectionSpacing),
                _ProfileSection(
                  title: 'Access',
                  children: [
                    const _ProfileRow(
                      label: 'Free scans',
                      value: 'First 3 before login',
                    ),
                    const _ProfileRow(
                      label: 'Ad unlocks',
                      value: 'Available after login',
                    ),
                    _ProfileRow(
                      label: 'Premium',
                      value: _premiumStatusLabel(subscription),
                    ),
                  ],
                ),
                const SizedBox(height: LogMyPlateSpacing.sectionSpacing),
                _ProfileSection(
                  title: 'Account control',
                  children: [
                    _ProfileActionRow(
                      label: 'Deactivate profile',
                      value: 'Pause access',
                      color: LogMyPlateColors.accent,
                      enabled: !loading,
                      onTap: () => _requestLifecycleAction(
                        context,
                        action: _ProfileLifecycleAction.deactivate,
                      ),
                    ),
                    _ProfileActionRow(
                      label: 'Delete account and data',
                      value: 'Permanent',
                      color: LogMyPlateColors.destructive,
                      enabled: !loading,
                      onTap: () => _requestLifecycleAction(
                        context,
                        action: _ProfileLifecycleAction.delete,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                SizedBox(
                  height: 54,
                  child: GlassWrapper(child: OutlinedButton(
                    onPressed: loading ? null : () => _signOut(context),
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
            ),
            if (loading)
              Positioned.fill(
                child: ColoredBox(
                  color: colors.background.withValues(alpha: 0.42),
                  child: Center(
                    child: CircularProgressIndicator(color: colors.accent),
                  ),
                ),
              ),
          ],
        ),
      ),
      ),
    );
  }

  Future<void> _signOut(BuildContext context) async {
    final shouldPop = await onSignOut();
    if (!context.mounted || !shouldPop) return;
    final navigator = Navigator.of(context);
    if (navigator.canPop()) navigator.pop();
  }

  Future<void> _requestLifecycleAction(
    BuildContext context, {
    required _ProfileLifecycleAction action,
  }) async {
    final confirmed = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _ProfileLifecycleSheet(action: action),
    );
    if (confirmed != true || !context.mounted || loading) return;

    final completed = switch (action) {
      _ProfileLifecycleAction.deactivate => await onDeactivateProfile(),
      _ProfileLifecycleAction.delete => await onDeleteProfile(),
    };
    if (!context.mounted || !completed) return;
    final navigator = Navigator.of(context);
    if (navigator.canPop()) navigator.pop();
  }
}

String _premiumStatusLabel(SubscriptionStatus? subscription) {
  if (subscription?.active != true) return 'Not active';
  final usage = subscription!.usage;
  return '${usage.remainingToday}/${usage.dailyLimit} today';
}

class _AccountAvatar extends StatelessWidget {
  const _AccountAvatar({required this.session});

  final AuthSession session;

  @override
  Widget build(BuildContext context) {
    final initial = _initial(session);
    if (initial == 'L') {
      return const LogMyPlateBrandMark(size: 86);
    }

    return Container(
      width: 104,
      height: 104,
      decoration: BoxDecoration(
        color: LogMyPlateColors.accent.withValues(alpha: 0.14),
        shape: BoxShape.circle,
        border: Border.all(
          color: LogMyPlateColors.accent.withValues(alpha: 0.34),
        ),
      ),
      child: Center(
        child: Text(
          initial,
          style: Theme.of(
            context,
          ).textTheme.displayLarge?.copyWith(color: LogMyPlateColors.accent),
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

class _AccountErrorBanner extends StatelessWidget {
  const _AccountErrorBanner({required this.message, this.onDismiss});

  final String message;
  final VoidCallback? onDismiss;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;

    return Container(
      padding: const EdgeInsets.fromLTRB(14, 12, 10, 12),
      decoration: BoxDecoration(
        color: LogMyPlateColors.destructive.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(LogMyPlateSpacing.cardBorderRadius),
        border: Border.all(
          color: LogMyPlateColors.destructive.withValues(alpha: 0.28),
          width: 0.6,
        ),
      ),
      child: Row(
        children: [
          Icon(
            Icons.error_outline_rounded,
            color: LogMyPlateColors.destructive,
            size: 18,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              message,
              style: Theme.of(
                context,
              ).textTheme.bodySmall?.copyWith(color: colors.textPrimary),
            ),
          ),
          if (onDismiss != null)
            IconButton(
              onPressed: onDismiss,
              icon: const Icon(Icons.close_rounded),
              iconSize: 18,
              visualDensity: VisualDensity.compact,
            ),
        ],
      ),
    );
  }
}

class _ProfileSection extends StatelessWidget {
  const _ProfileSection({required this.title, required this.children});

  final String title;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: Theme.of(context).textTheme.labelSmall),
        const SizedBox(height: 8),
        LiteGlassCard(
          borderRadius: BorderRadius.circular(LogMyPlateSpacing.elementBorderRadius),
          child: Column(children: children),
        ),
      ],
    );
  }
}

class _ProfileRow extends StatelessWidget {
  const _ProfileRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;

    return Material(
      type: MaterialType.transparency,
      child: ListTile(
        title: Text(label, style: Theme.of(context).textTheme.bodyMedium),
        trailing: Text(
          value,
          style: Theme.of(
            context,
          ).textTheme.bodySmall?.copyWith(color: colors.textSecondary),
        ),
      ),
    );
  }
}

class _ProfileActionRow extends StatelessWidget {
  const _ProfileActionRow({
    required this.label,
    required this.value,
    required this.color,
    required this.enabled,
    required this.onTap,
  });

  final String label;
  final String value;
  final Color color;
  final bool enabled;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;

    return Material(
      type: MaterialType.transparency,
      child: ListTile(
        enabled: enabled,
        onTap: enabled ? onTap : null,
        title: Text(
          label,
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
            color: enabled ? colors.textPrimary : colors.textTertiary,
          ),
        ),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              value,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: enabled ? color : colors.textTertiary,
              ),
            ),
            const SizedBox(width: 8),
            Icon(
              Icons.chevron_right_rounded,
              color: enabled ? color : colors.textTertiary,
            ),
          ],
        ),
      ),
    );
  }
}

enum _ProfileLifecycleAction { deactivate, delete }

class _ProfileLifecycleSheet extends StatelessWidget {
  const _ProfileLifecycleSheet({required this.action});

  final _ProfileLifecycleAction action;

  bool get isDelete => action == _ProfileLifecycleAction.delete;

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
                isDelete ? 'Delete account and data?' : 'Deactivate profile?',
                style: Theme.of(
                  context,
                ).textTheme.titleLarge?.copyWith(color: colors.textPrimary),
              ),
              const SizedBox(height: 10),
              Text(
                isDelete
                    ? 'This permanently deletes your account, journal, saved photos, targets, and sign-in access from active systems. This cannot be undone.'
                    : 'This signs you out and pauses account access. Your saved meals and photos stay stored.',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: colors.textSecondary,
                  height: 1.35,
                ),
              ),
              const SizedBox(height: LogMyPlateSpacing.lgSpacing),
              SizedBox(
                height: 54,
                child: PremiumButton(
                  onPressed: () => Navigator.of(context).pop(true),
                  
                  child: Text(
                    isDelete ? 'Delete account' : 'Deactivate profile',
                  ),
                ),
              ),
              const SizedBox(height: 10),
              SizedBox(
                height: 50,
                child: GlassWrapper(child: TextButton(
                  onPressed: () => Navigator.of(context).pop(false),
                  child: const Text('Keep profile'),
                )),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
