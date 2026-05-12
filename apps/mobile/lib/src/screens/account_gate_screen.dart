import 'package:flutter/material.dart';

import '../models/auth_session.dart';
import '../theme/dfit_colors.dart';
import '../theme/dfit_theme.dart';
import '../widgets/primitive_icons.dart';

class AccountGateScreen extends StatelessWidget {
  const AccountGateScreen({
    super.key,
    required this.reason,
    required this.loading,
    this.error,
    required this.onSignIn,
    required this.onEmailAuth,
    required this.onManualLog,
  });

  final AccountGateReason reason;
  final bool loading;
  final String? error;
  final Future<AuthSession?> Function(AuthProvider provider) onSignIn;
  final Future<AuthSession?> Function(
    EmailAuthMode mode,
    String email,
    String password,
  )
  onEmailAuth;
  final VoidCallback onManualLog;

  @override
  Widget build(BuildContext context) {
    final colors = context.dfit;
    final copy = _AccountGateCopy.forReason(reason);

    return Scaffold(
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
          children: [
            Row(
              children: [
                IconButton(
                  onPressed: loading ? null : () => Navigator.of(context).pop(),
                  icon: const BackMark(),
                ),
                const Spacer(),
                _GatePill(label: copy.eyebrow),
              ],
            ),
            const SizedBox(height: 12),
            Center(child: _AccountMark(loading: loading)),
            const SizedBox(height: 16),
            Text(
              copy.title,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                color: colors.textPrimary,
                height: 1.05,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              copy.subtitle,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: colors.textSecondary,
                height: 1.35,
              ),
            ),
            const SizedBox(height: 18),
            Row(
              children: [
                Expanded(
                  child: _ProviderButton(
                    label: 'Apple',
                    provider: AuthProvider.apple,
                    loading: loading,
                    onTap: () => _signIn(context, AuthProvider.apple),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _ProviderButton(
                    label: 'Google',
                    provider: AuthProvider.google,
                    loading: loading,
                    onTap: () => _signIn(context, AuthProvider.google),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            _EmailAuthPanel(loading: loading, onEmailAuth: onEmailAuth),
            const SizedBox(height: 12),
            if (error != null) ...[
              Text(
                error!,
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: DFitColors.accent,
                  height: 1.25,
                ),
              ),
              const SizedBox(height: 8),
            ],
            TextButton(
              onPressed: loading ? null : onManualLog,
              child: const Text('Log manually instead'),
            ),
            const SizedBox(height: 6),
            Text(
              'Your photos are analyzed, not stored.',
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                color: colors.textTertiary,
                letterSpacing: 0,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _signIn(BuildContext context, AuthProvider provider) async {
    final session = await onSignIn(provider);
    if (session == null || !context.mounted) return;
    Navigator.of(context).pop(session);
  }
}

class _GatePill extends StatelessWidget {
  const _GatePill({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    final colors = context.dfit;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: DFitColors.accent.withValues(alpha: 0.14),
        borderRadius: BorderRadius.circular(99),
        border: Border.all(
          color: DFitColors.accent.withValues(alpha: 0.24),
          width: 0.6,
        ),
      ),
      child: Text(
        label,
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
          color: colors.accentText,
          letterSpacing: 0.2,
        ),
      ),
    );
  }
}

class _EmailAuthPanel extends StatefulWidget {
  const _EmailAuthPanel({required this.loading, required this.onEmailAuth});

  final bool loading;
  final Future<AuthSession?> Function(
    EmailAuthMode mode,
    String email,
    String password,
  )
  onEmailAuth;

  @override
  State<_EmailAuthPanel> createState() => _EmailAuthPanelState();
}

class _EmailAuthPanelState extends State<_EmailAuthPanel> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  EmailAuthMode _mode = EmailAuthMode.signUp;
  String? _validation;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.dfit;
    final isSignUp = _mode == EmailAuthMode.signUp;

    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: colors.surfaceCard,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: colors.border, width: 0.6),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            padding: const EdgeInsets.all(3),
            decoration: BoxDecoration(
              color: colors.mutedFill,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                _ModeTab(
                  label: 'Sign up',
                  selected: isSignUp,
                  onTap: widget.loading
                      ? null
                      : () => setState(() => _mode = EmailAuthMode.signUp),
                ),
                _ModeTab(
                  label: 'Log in',
                  selected: !isSignUp,
                  onTap: widget.loading
                      ? null
                      : () => setState(() => _mode = EmailAuthMode.logIn),
                ),
              ],
            ),
          ),
          const SizedBox(height: 10),
          _AuthTextField(
            controller: _emailController,
            hint: 'Email',
            keyboardType: TextInputType.emailAddress,
            enabled: !widget.loading,
          ),
          const SizedBox(height: 8),
          _AuthTextField(
            controller: _passwordController,
            hint: 'Password',
            obscureText: true,
            enabled: !widget.loading,
          ),
          if (_validation != null) ...[
            const SizedBox(height: 6),
            Text(
              _validation!,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: DFitColors.accent,
                height: 1.25,
              ),
            ),
          ],
          const SizedBox(height: 10),
          SizedBox(
            height: 44,
            child: FilledButton(
              onPressed: widget.loading ? null : _submit,
              style: FilledButton.styleFrom(
                backgroundColor: DFitColors.accent,
                foregroundColor: DFitColors.accentDeep,
                disabledBackgroundColor: colors.mutedFill,
                disabledForegroundColor: colors.textSecondary,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
              child: Text(isSignUp ? 'Create account' : 'Log in'),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _submit() async {
    final email = _emailController.text.trim().toLowerCase();
    final password = _passwordController.text;
    final error = _validate(email, password);
    if (error != null) {
      setState(() => _validation = error);
      return;
    }

    setState(() => _validation = null);
    final session = await widget.onEmailAuth(_mode, email, password);
    if (session == null || !mounted) return;
    Navigator.of(context).pop(session);
  }

  String? _validate(String email, String password) {
    if (!email.contains('@') || !email.contains('.')) {
      return 'Enter a valid email address.';
    }
    if (password.length < 6) {
      return 'Password must be at least 6 characters.';
    }
    return null;
  }
}

class _ModeTab extends StatelessWidget {
  const _ModeTab({required this.label, required this.selected, this.onTap});

  final String label;
  final bool selected;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final colors = context.dfit;

    return Expanded(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(10),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 160),
          height: 34,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: selected ? colors.surfaceCard : Colors.transparent,
            borderRadius: BorderRadius.circular(10),
          ),
          child: Text(
            label,
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
              color: selected ? colors.textPrimary : colors.textSecondary,
              letterSpacing: 0,
            ),
          ),
        ),
      ),
    );
  }
}

class _AuthTextField extends StatelessWidget {
  const _AuthTextField({
    required this.controller,
    required this.hint,
    this.keyboardType,
    this.obscureText = false,
    this.enabled = true,
  });

  final TextEditingController controller;
  final String hint;
  final TextInputType? keyboardType;
  final bool obscureText;
  final bool enabled;

  @override
  Widget build(BuildContext context) {
    final colors = context.dfit;

    return TextField(
      controller: controller,
      enabled: enabled,
      keyboardType: keyboardType,
      obscureText: obscureText,
      textInputAction: obscureText
          ? TextInputAction.done
          : TextInputAction.next,
      style: Theme.of(
        context,
      ).textTheme.bodyMedium?.copyWith(color: colors.textPrimary),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: Theme.of(
          context,
        ).textTheme.bodyMedium?.copyWith(color: colors.textTertiary),
        filled: true,
        fillColor: colors.mutedFill,
        isDense: true,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 14,
          vertical: 12,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: DFitColors.accent, width: 0.8),
        ),
      ),
    );
  }
}

enum AccountGateReason { quotaExhausted, saveJournal }

class _AccountGateCopy {
  const _AccountGateCopy({
    required this.eyebrow,
    required this.title,
    required this.subtitle,
  });

  final String eyebrow;
  final String title;
  final String subtitle;

  factory _AccountGateCopy.forReason(AccountGateReason reason) {
    switch (reason) {
      case AccountGateReason.quotaExhausted:
        return const _AccountGateCopy(
          eyebrow: '3 scans used',
          title: 'Create account to keep scanning',
          subtitle: 'Save this journal and unlock extra scans with ads.',
        );
      case AccountGateReason.saveJournal:
        return const _AccountGateCopy(
          eyebrow: 'account',
          title: 'Save your journal',
          subtitle: 'Link once to protect your meals and future progress.',
        );
    }
  }
}

class _AccountMark extends StatefulWidget {
  const _AccountMark({required this.loading});

  final bool loading;

  @override
  State<_AccountMark> createState() => _AccountMarkState();
}

class _AccountMarkState extends State<_AccountMark>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1800),
  )..repeat();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.dfit;

    return AnimatedBuilder(
      animation: _controller,
      builder: (context, _) {
        return SizedBox(
          width: 110,
          height: 110,
          child: Stack(
            alignment: Alignment.center,
            children: [
              for (var index = 0; index < 3; index++)
                Transform.scale(
                  scale:
                      0.68 +
                      index * 0.16 +
                      (_controller.value * 0.04 * (index + 1)),
                  child: Container(
                    width: 92,
                    height: 92,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: DFitColors.accent.withValues(
                          alpha: 0.22 - index * 0.04,
                        ),
                      ),
                    ),
                  ),
                ),
              Container(
                width: 72,
                height: 72,
                decoration: BoxDecoration(
                  color: colors.surfaceCard,
                  shape: BoxShape.circle,
                  border: Border.all(color: colors.border, width: 0.7),
                  boxShadow: [
                    BoxShadow(
                      color: DFitColors.accent.withValues(alpha: 0.08),
                      blurRadius: 24,
                      spreadRadius: 1,
                    ),
                  ],
                ),
                child: Center(
                  child: widget.loading
                      ? const SizedBox(
                          width: 24,
                          height: 24,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: DFitColors.accent,
                          ),
                        )
                      : Text(
                          'D',
                          style: Theme.of(context).textTheme.headlineMedium
                              ?.copyWith(color: DFitColors.accent),
                        ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _ProviderButton extends StatelessWidget {
  const _ProviderButton({
    required this.label,
    required this.provider,
    required this.loading,
    required this.onTap,
  });

  final String label;
  final AuthProvider provider;
  final bool loading;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colors = context.dfit;
    final isApple = provider == AuthProvider.apple;

    return SizedBox(
      height: 52,
      child: FilledButton(
        onPressed: loading ? null : onTap,
        style: FilledButton.styleFrom(
          backgroundColor: isApple ? colors.textPrimary : colors.surfaceCard,
          foregroundColor: isApple ? colors.background : colors.textPrimary,
          disabledBackgroundColor: colors.mutedFill,
          disabledForegroundColor: colors.textSecondary,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
            side: BorderSide(
              color: isApple ? Colors.transparent : colors.border,
              width: 0.7,
            ),
          ),
          elevation: 0,
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            if (isApple)
              Icon(Icons.apple, size: 20, color: colors.background)
            else
              Text(
                'G',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  color: colors.textPrimary,
                  fontWeight: FontWeight.w700,
                ),
              ),
            const SizedBox(width: 10),
            Flexible(child: Text(label, overflow: TextOverflow.ellipsis)),
          ],
        ),
      ),
    );
  }
}
