import 'package:flutter/material.dart';

import '../models/auth_session.dart';
import '../theme/dfit_colors.dart';
import '../theme/dfit_theme.dart';
import '../widgets/primitive_icons.dart';

class AccountProfileScreen extends StatelessWidget {
  const AccountProfileScreen({
    super.key,
    required this.session,
    required this.onSignOut,
  });

  final AuthSession session;
  final Future<void> Function() onSignOut;

  @override
  Widget build(BuildContext context) {
    final colors = context.dfit;

    return Scaffold(
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 28),
          children: [
            Align(
              alignment: Alignment.centerLeft,
              child: IconButton(
                onPressed: () => Navigator.of(context).pop(),
                icon: const BackMark(),
              ),
            ),
            const SizedBox(height: 22),
            Center(
              child: Container(
                width: 104,
                height: 104,
                decoration: BoxDecoration(
                  color: DFitColors.accent.withValues(alpha: 0.14),
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: DFitColors.accent.withValues(alpha: 0.34),
                  ),
                ),
                child: Center(
                  child: Text(
                    _initial(session),
                    style: Theme.of(context).textTheme.displayLarge?.copyWith(
                      color: DFitColors.accent,
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'PROFILE',
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
              style: Theme.of(
                context,
              ).textTheme.headlineMedium?.copyWith(color: colors.textPrimary),
            ),
            const SizedBox(height: 6),
            Text(
              '${session.provider.label} account',
              textAlign: TextAlign.center,
              style: Theme.of(
                context,
              ).textTheme.bodySmall?.copyWith(color: colors.textSecondary),
            ),
            const SizedBox(height: 28),
            _ProfileSection(
              title: 'ACCOUNT',
              children: [
                _ProfileRow(label: 'Status', value: 'Signed in'),
                _ProfileRow(label: 'Provider', value: session.provider.label),
                _ProfileRow(label: 'Journal', value: 'Linked on this device'),
              ],
            ),
            const SizedBox(height: 18),
            _ProfileSection(
              title: 'ACCESS',
              children: const [
                _ProfileRow(label: 'Free scans', value: 'Used first'),
                _ProfileRow(label: 'Ad unlocks', value: 'Coming next'),
                _ProfileRow(label: 'Premium', value: 'Not active'),
              ],
            ),
            const SizedBox(height: 24),
            SizedBox(
              height: 54,
              child: OutlinedButton(
                onPressed: () => _signOut(context),
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
        ),
      ),
    );
  }

  Future<void> _signOut(BuildContext context) async {
    await onSignOut();
    if (!context.mounted) return;
    Navigator.of(context).pop();
  }

  String _initial(AuthSession session) {
    final name = session.displayName.trim();
    if (name.isEmpty) return 'D';
    return name.characters.first.toUpperCase();
  }
}

class _ProfileSection extends StatelessWidget {
  const _ProfileSection({required this.title, required this.children});

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

class _ProfileRow extends StatelessWidget {
  const _ProfileRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final colors = context.dfit;

    return ListTile(
      title: Text(label, style: Theme.of(context).textTheme.bodyMedium),
      trailing: Text(
        value,
        style: Theme.of(
          context,
        ).textTheme.bodySmall?.copyWith(color: colors.textSecondary),
      ),
    );
  }
}
