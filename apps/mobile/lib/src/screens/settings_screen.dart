import 'package:flutter/material.dart';

import '../models/auth_session.dart';
import '../theme/logmyplate_colors.dart';
import '../theme/logmyplate_theme.dart';
import '../widgets/app_brand_mark.dart';
import '../widgets/primitive_icons.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({
    super.key,
    required this.themeMode,
    required this.onThemeChanged,
    required this.session,
    required this.onOpenAccount,
  });

  final ThemeMode themeMode;
  final ValueChanged<ThemeMode> onThemeChanged;
  final AuthSession? session;
  final VoidCallback onOpenAccount;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
          children: [
            Row(
              children: [
                IconButton(
                  onPressed: () => Navigator.of(context).pop(),
                  icon: const BackMark(),
                ),
                const Spacer(),
              ],
            ),
            const SizedBox(height: 18),
            Text('Settings', style: Theme.of(context).textTheme.displayLarge),
            const SizedBox(height: 22),
            _AccountCard(session: session, onTap: onOpenAccount),
            const SizedBox(height: 18),
            _SettingsSection(
              title: 'Theme',
              children: [
                _ThemeOption(
                  label: 'System',
                  selected: themeMode == ThemeMode.system,
                  onTap: () => onThemeChanged(ThemeMode.system),
                ),
                _ThemeOption(
                  label: 'Light',
                  selected: themeMode == ThemeMode.light,
                  onTap: () => onThemeChanged(ThemeMode.light),
                ),
                _ThemeOption(
                  label: 'Dark',
                  selected: themeMode == ThemeMode.dark,
                  onTap: () => onThemeChanged(ThemeMode.dark),
                ),
              ],
            ),
            const SizedBox(height: 18),
            _SettingsSection(
              title: 'Privacy',
              children: const [
                _StaticRow(label: 'Food photos are saved with meal logs'),
                _StaticRow(label: 'Nutrition estimates are approximate'),
                _StaticRow(label: 'Anonymous journal on this device'),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _AccountCard extends StatelessWidget {
  const _AccountCard({required this.session, required this.onTap});

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
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: LogMyPlateColors.accent.withValues(alpha: 0.12),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: LogMyPlateColors.accent.withValues(alpha: 0.35),
            width: 0.5,
          ),
        ),
        child: Row(
          children: [
            signedIn
                ? Container(
                    width: 38,
                    height: 38,
                    decoration: BoxDecoration(
                      color: LogMyPlateColors.accent.withValues(alpha: 0.18),
                      shape: BoxShape.circle,
                    ),
                    child: Center(
                      child: Text(
                        _accountInitial(session!),
                        style: Theme.of(context).textTheme.titleMedium
                            ?.copyWith(color: colors.accentText),
                      ),
                    ),
                  )
                : const LogMyPlateBrandMark(size: 38, showHalo: false),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    signedIn ? 'Profile' : 'Save your journal',
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(
                      context,
                    ).textTheme.titleMedium?.copyWith(color: colors.accentText),
                  ),
                  const SizedBox(height: 3),
                  Text(
                    signedIn
                        ? '${session!.displayName} - ${session!.provider.label}'
                        : 'Link with $providerCopy',
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: colors.accentText.withValues(alpha: 0.72),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

String _accountInitial(AuthSession session) {
  final name = session.displayName.trim();
  if (name.isEmpty) return 'L';
  return name.characters.first.toUpperCase();
}

class _SettingsSection extends StatelessWidget {
  const _SettingsSection({required this.title, required this.children});

  final String title;
  final List<Widget> children;

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
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: colors.border, width: 0.5),
          ),
          child: Column(children: children),
        ),
      ],
    );
  }
}

class _ThemeOption extends StatelessWidget {
  const _ThemeOption({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      title: Text(label),
      trailing: selected
          ? Container(
              width: 10,
              height: 10,
              decoration: const BoxDecoration(
                color: LogMyPlateColors.accent,
                shape: BoxShape.circle,
              ),
            )
          : null,
      onTap: onTap,
    );
  }
}

class _StaticRow extends StatelessWidget {
  const _StaticRow({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      title: Text(label, style: Theme.of(context).textTheme.bodyMedium),
    );
  }
}
