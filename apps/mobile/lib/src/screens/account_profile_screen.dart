import 'package:logmyplate_mobile/src/widgets/premium_button.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../theme/logmyplate_spacing.dart';

import '../models/auth_session.dart';
import '../models/meal.dart';
import '../theme/logmyplate_colors.dart';
import '../theme/logmyplate_theme.dart';
import '../widgets/app_brand_mark.dart';
import '../widgets/glass/glass_backdrop.dart';
import '../widgets/glass/glass_cards.dart';
import '../widgets/logmyplate_notice.dart';
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
    required this.onDeactivateProfile,
    required this.onDeleteProfile,
    this.onPasswordResetRequest,
    this.onPasswordResetConfirm,
  });

  final AuthSession session;
  final bool loading;
  final SubscriptionStatus? subscription;
  final String? error;
  final VoidCallback? onClearError;
  final Future<bool> Function() onDeactivateProfile;
  final Future<bool> Function() onDeleteProfile;
  final Future<bool> Function(String email)? onPasswordResetRequest;
  final Future<AuthSession?> Function(
    String email,
    String code,
    String password,
  )?
  onPasswordResetConfirm;

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
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: colors.textSecondary,
                    ),
                  ),
                  if (error != null) ...[
                    const SizedBox(height: LogMyPlateSpacing.sectionSpacing),
                    _AccountErrorBanner(
                      message: error!,
                      onDismiss: onClearError,
                    ),
                  ],
                  const SizedBox(height: 28),
                  _ProfileSection(
                    title: 'Account and Journal Status',
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
                    title: 'Membership Status',
                    children: [
                      _ProfileRow(
                        label: 'Current Plan',
                        value: subscription?.active == true
                            ? 'Premium'
                            : 'Free',
                      ),
                      _ProfileRow(
                        label: 'Subscribed on',
                        value: _formatDate(subscription?.currentPeriodStart),
                      ),
                      _ProfileRow(
                        label: 'Auto Renewal on',
                        value: _renewalLabel(subscription),
                      ),
                    ],
                  ),
                  const SizedBox(height: LogMyPlateSpacing.sectionSpacing),
                  _ProfileSection(
                    title: 'Manage Account',
                    children: [
                      if (onPasswordResetRequest != null)
                        _ProfileActionRow(
                          label: 'Reset Password',
                          value: '',
                          color: colors.textPrimary,
                          enabled: !loading,
                          onTap: () => _showPasswordResetSheet(context),
                        ),
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

  Future<void> _showPasswordResetSheet(BuildContext context) async {
    final email = session.displayName;
    final colors = context.logmyplate;

    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _PasswordResetSheet(
        email: email,
        colors: colors,
        onRequestCode: () => onPasswordResetRequest!(email),
        onConfirmReset: (code, password) =>
            onPasswordResetConfirm!(email, code, password),
      ),
    );
  }

  Future<void> _requestLifecycleAction(
    BuildContext context, {
    required _ProfileLifecycleAction action,
  }) async {
    final confirmed = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) =>
          _ProfileLifecycleSheet(action: action, subscription: subscription),
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

String _formatDate(DateTime? date) {
  if (date == null) return '\u2014';
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  return '${months[date.month - 1]} ${date.day}, ${date.year}';
}

String _renewalLabel(SubscriptionStatus? subscription) {
  if (subscription == null || !subscription.active) return '\u2014';
  if (subscription.willRenew == false) return 'None';
  return _formatDate(subscription.currentPeriodEnd);
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
          borderRadius: BorderRadius.circular(
            LogMyPlateSpacing.elementBorderRadius,
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
  const _ProfileLifecycleSheet({required this.action, this.subscription});

  final _ProfileLifecycleAction action;
  final SubscriptionStatus? subscription;

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
              if (isDelete && subscription?.active == true) ...[
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

                  child: Text(
                    isDelete ? 'Delete account' : 'Deactivate profile',
                  ),
                ),
              ),
              const SizedBox(height: 10),
              SizedBox(
                height: 50,
                child: GlassWrapper(
                  child: TextButton(
                    onPressed: () => Navigator.of(context).pop(false),
                    child: const Text('Keep profile'),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _PasswordResetSheet extends StatefulWidget {
  const _PasswordResetSheet({
    required this.email,
    required this.colors,
    required this.onRequestCode,
    required this.onConfirmReset,
  });

  final String email;
  final LogMyPlateThemeColors colors;
  final Future<bool> Function() onRequestCode;
  final Future<AuthSession?> Function(String code, String password)
  onConfirmReset;

  @override
  State<_PasswordResetSheet> createState() => _PasswordResetSheetState();
}

class _PasswordResetSheetState extends State<_PasswordResetSheet> {
  final _codeController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _codeSent = false;
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _codeController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final colors = widget.colors;

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
                _codeSent ? 'Enter reset code' : 'Reset password',
                style: Theme.of(
                  context,
                ).textTheme.titleLarge?.copyWith(color: colors.textPrimary),
              ),
              const SizedBox(height: 10),
              Text(
                _codeSent
                    ? 'A code was sent to ${widget.email}.'
                    : 'A reset code will be sent to ${widget.email}.',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: colors.textSecondary,
                  height: 1.35,
                ),
              ),
              const SizedBox(height: LogMyPlateSpacing.sectionSpacing),
              if (!_codeSent) ...[
                SizedBox(
                  height: 54,
                  child: PremiumButton(
                    onPressed: _loading ? null : _sendCode,
                    child: const Text('Send reset code'),
                  ),
                ),
                const SizedBox(height: 10),
                SizedBox(
                  height: 50,
                  child: GlassWrapper(
                    child: TextButton(
                      onPressed: () => Navigator.of(context).pop(),
                      child: const Text('Cancel'),
                    ),
                  ),
                ),
              ],
              if (_codeSent) ...[
                TextField(
                  controller: _codeController,
                  decoration: const InputDecoration(
                    hintText: '6-digit code',
                    labelText: 'Reset code',
                  ),
                  keyboardType: TextInputType.number,
                  inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                  enabled: !_loading,
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: _passwordController,
                  decoration: const InputDecoration(
                    hintText: 'New password',
                    labelText: 'New password',
                  ),
                  obscureText: true,
                  enabled: !_loading,
                ),
                if (_error != null) ...[
                  const SizedBox(height: 8),
                  Text(
                    _error!,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: LogMyPlateColors.destructive,
                    ),
                  ),
                ],
                const SizedBox(height: LogMyPlateSpacing.sectionSpacing),
                SizedBox(
                  height: 54,
                  child: PremiumButton(
                    onPressed: _loading ? null : _confirmReset,
                    child: const Text('Reset password'),
                  ),
                ),
                const SizedBox(height: 10),
                SizedBox(
                  height: 50,
                  child: GlassWrapper(
                    child: TextButton(
                      onPressed: _loading
                          ? null
                          : () => Navigator.of(context).pop(),
                      child: const Text('Cancel'),
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _sendCode() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    final accepted = await widget.onRequestCode();
    if (!mounted) return;

    if (accepted) {
      setState(() {
        _codeSent = true;
        _loading = false;
      });
    } else {
      setState(() {
        _error = 'Failed to send reset code. Please try again.';
        _loading = false;
      });
    }
  }

  Future<void> _confirmReset() async {
    final code = _codeController.text.trim();
    final password = _passwordController.text;

    if (code.isEmpty || password.length < 6) {
      setState(
        () => _error =
            'Enter a valid code and a password of at least 6 characters.',
      );
      return;
    }

    setState(() {
      _loading = true;
      _error = null;
    });

    final session = await widget.onConfirmReset(code, password);
    if (!mounted) return;

    if (session != null) {
      Navigator.of(context).pop();
      LogMyPlateNotice.show(
        context,
        tone: LogMyPlateNoticeTone.success,
        title: 'Password reset',
        message: 'You can now sign in with your new password.',
      );
    } else {
      setState(() {
        _error = 'Invalid code or expired. Please try again.';
        _loading = false;
      });
    }
  }
}
