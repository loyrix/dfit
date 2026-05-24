import 'package:flutter/material.dart';

import '../models/auth_session.dart';
import '../theme/logmyplate_colors.dart';
import '../theme/logmyplate_theme.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({
    super.key,
    required this.themeMode,
    required this.onThemeChanged,
    required this.session,
    required this.onOpenAccount,
    required this.onSignOut,
  });

  final ThemeMode themeMode;
  final ValueChanged<ThemeMode> onThemeChanged;
  final AuthSession? session;
  final VoidCallback onOpenAccount;
  final Future<void> Function() onSignOut;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;
    final signedIn = session != null;

    return Scaffold(
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 18, 16, 188),
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
              title: 'Privacy',
              child: Column(
                children: const [
                  _StaticRow(label: 'Food photos are saved with meal logs'),
                  _StaticRow(label: 'Nutrition estimates are approximate'),
                  _StaticRow(label: 'Delete profile removes stored app data'),
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

class _StaticRow extends StatelessWidget {
  const _StaticRow({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
      child: Row(
        children: [
          Container(
            width: 22,
            height: 22,
            decoration: BoxDecoration(
              color: LogMyPlateColors.accent.withValues(alpha: 0.12),
              shape: BoxShape.circle,
            ),
            child: Icon(
              Icons.check_rounded,
              color: colors.accentText,
              size: 14,
            ),
          ),
          const SizedBox(width: 11),
          Expanded(
            child: Text(
              label,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: colors.textPrimary,
                height: 1.28,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
