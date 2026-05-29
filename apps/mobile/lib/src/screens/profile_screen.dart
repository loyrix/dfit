import 'package:flutter/material.dart';

import '../models/auth_session.dart';
import '../services/app_links.dart';
import '../theme/logmyplate_colors.dart';
import '../theme/logmyplate_theme.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({
    super.key,
    required this.themeMode,
    required this.onThemeChanged,
    required this.session,
    required this.onOpenAccount,
    required this.onDeleteAccount,
    required this.onSignOut,
    this.bottomPadding = 188,
  });

  final ThemeMode themeMode;
  final ValueChanged<ThemeMode> onThemeChanged;
  final AuthSession? session;
  final VoidCallback onOpenAccount;
  final Future<bool> Function() onDeleteAccount;
  final Future<void> Function() onSignOut;
  final double bottomPadding;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;
    final signedIn = session != null;

    return Scaffold(
      body: SafeArea(
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
            const SizedBox(height: 18),
            _AccountHero(session: session, onTap: onOpenAccount),
            const SizedBox(height: 18),
            _ProfileSection(
              title: 'Theme',
              child: _ThemeSegment(
                themeMode: themeMode,
                onThemeChanged: onThemeChanged,
              ),
            ),
            const SizedBox(height: 18),
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
                  const _ProfileRowDivider(),
                  _LinkRow(
                    icon: Icons.delete_outline_rounded,
                    label: signedIn
                        ? 'Delete account and data'
                        : 'Data deletion',
                    color: signedIn ? LogMyPlateColors.destructive : null,
                    trailingIcon: signedIn
                        ? Icons.chevron_right_rounded
                        : Icons.open_in_new_rounded,
                    onTap: () => _requestAccountDeletion(context),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 18),
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
              const SizedBox(height: 22),
              SizedBox(
                height: 52,
                child: OutlinedButton(
                  onPressed: onSignOut,
                  style: OutlinedButton.styleFrom(
                    foregroundColor: colors.textPrimary,
                    side: BorderSide(color: colors.border),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                  child: const Text('Log out'),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Future<void> _requestAccountDeletion(BuildContext context) async {
    if (session == null) {
      await openLogMyPlateLink(
        context,
        LogMyPlateLinks.dataDeletion,
        copiedMessage: 'Data deletion link copied',
      );
      return;
    }

    final confirmed = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const _DeleteAccountSheet(),
    );
    if (confirmed != true || !context.mounted) return;

    await onDeleteAccount();
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
      borderRadius: BorderRadius.circular(18),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: signedIn
              ? colors.surfaceCard
              : LogMyPlateColors.accent.withValues(alpha: 0.12),
          borderRadius: BorderRadius.circular(18),
          border: Border.all(
            color: signedIn
                ? colors.border
                : LogMyPlateColors.accent.withValues(alpha: 0.35),
            width: 0.6,
          ),
        ),
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

class _ProfileSection extends StatelessWidget {
  const _ProfileSection({required this.title, required this.child});

  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: Theme.of(context).textTheme.labelSmall),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            color: colors.surfaceCard,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: colors.border, width: 0.5),
          ),
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
    this.color,
    this.trailingIcon = Icons.open_in_new_rounded,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final Color? color;
  final IconData trailingIcon;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;
    final rowColor = color ?? colors.textPrimary;
    final iconColor = color ?? colors.accentText;

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
                color: iconColor.withValues(alpha: 0.12),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: iconColor, size: 16),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                label,
                style: Theme.of(
                  context,
                ).textTheme.bodySmall?.copyWith(color: rowColor, height: 1.25),
              ),
            ),
            Icon(trailingIcon, color: color ?? colors.textTertiary, size: 17),
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

class _DeleteAccountSheet extends StatelessWidget {
  const _DeleteAccountSheet();

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;

    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(14, 0, 14, 14),
        child: Container(
          padding: const EdgeInsets.fromLTRB(22, 18, 22, 22),
          decoration: BoxDecoration(
            color: colors.surfaceCard,
            borderRadius: BorderRadius.circular(26),
            border: Border.all(color: colors.border, width: 0.6),
          ),
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
              const SizedBox(height: 22),
              SizedBox(
                height: 54,
                child: FilledButton(
                  onPressed: () => Navigator.of(context).pop(true),
                  style: FilledButton.styleFrom(
                    backgroundColor: LogMyPlateColors.destructive,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(17),
                    ),
                  ),
                  child: const Text('Delete account'),
                ),
              ),
              const SizedBox(height: 10),
              SizedBox(
                height: 50,
                child: TextButton(
                  onPressed: () => Navigator.of(context).pop(false),
                  child: const Text('Keep account'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
