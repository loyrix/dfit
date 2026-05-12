import 'package:flutter/material.dart';

import '../models/auth_session.dart';
import '../theme/dfit_colors.dart';
import '../theme/dfit_theme.dart';
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
              title: 'THEME',
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
              title: 'PRIVACY',
              children: const [
                _StaticRow(label: 'Food photos are analyzed, not stored'),
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
    final colors = context.dfit;
    final signedIn = session != null;

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: DFitColors.accent.withValues(alpha: 0.12),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: DFitColors.accent.withValues(alpha: 0.35),
            width: 0.5,
          ),
        ),
        child: Row(
          children: [
            Container(
              width: 34,
              height: 34,
              decoration: const BoxDecoration(
                color: DFitColors.accent,
                shape: BoxShape.circle,
              ),
              child: const Center(
                child: Text(
                  'D',
                  style: TextStyle(color: DFitColors.accentDeep),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    signedIn ? 'Profile' : 'Save your journal',
                    style: Theme.of(
                      context,
                    ).textTheme.titleMedium?.copyWith(color: colors.accentText),
                  ),
                  const SizedBox(height: 3),
                  Text(
                    signedIn
                        ? '${session!.displayName} - ${session!.provider.label}'
                        : 'Link with Apple, Google or email',
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

class _SettingsSection extends StatelessWidget {
  const _SettingsSection({required this.title, required this.children});

  final String title;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    final colors = context.dfit;

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
                color: DFitColors.accent,
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
