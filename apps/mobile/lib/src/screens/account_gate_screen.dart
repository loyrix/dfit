import 'package:logmyplate_mobile/src/widgets/premium_button.dart';
import 'package:flutter/material.dart';
import '../theme/logmyplate_spacing.dart';

import '../models/auth_session.dart';
import '../services/app_links.dart';
import '../theme/logmyplate_colors.dart';
import '../theme/logmyplate_theme.dart';
import '../widgets/app_brand_mark.dart';
import '../widgets/glass/glass_backdrop.dart';
import '../widgets/glass/glass_cards.dart';
import '../widgets/primitive_icons.dart';
import 'package:logmyplate_mobile/src/widgets/glass/glass_wrapper.dart';

class AccountGateScreen extends StatefulWidget {
  const AccountGateScreen({
    super.key,
    required this.reason,
    required this.loading,
    this.error,
    required this.onSignIn,
    required this.onEmailAuth,
    required this.onPasswordResetRequest,
    required this.onPasswordResetConfirm,
    required this.onManualLog,
    this.onClearError,
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
  final Future<bool> Function(String email) onPasswordResetRequest;
  final Future<AuthSession?> Function(
    String email,
    String code,
    String password,
  )
  onPasswordResetConfirm;
  final VoidCallback onManualLog;
  final VoidCallback? onClearError;

  @override
  State<AccountGateScreen> createState() => _AccountGateScreenState();
}

class _AccountGateScreenState extends State<AccountGateScreen> {
  bool _passwordResetMode = false;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;
    final copy = _passwordResetMode
        ? _AccountGateCopy.passwordReset()
        : _AccountGateCopy.forReason(widget.reason);
    final showAppleSignIn = Theme.of(context).platform == TargetPlatform.iOS;

    return Scaffold(
      extendBodyBehindAppBar: true,
      backgroundColor: Colors.transparent,
      body: GlassBackdrop(
        child: SafeArea(
          child: ListView(
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
            children: [
              Row(
                children: [
                  IconButton(
                    onPressed: widget.loading
                        ? null
                        : () => Navigator.of(context).pop(),
                    icon: const BackMark(),
                  ),
                  const Spacer(),
                  _GatePill(label: copy.eyebrow),
                ],
              ),
              const SizedBox(height: 26),
              Center(child: _AccountMark(loading: widget.loading)),
              const SizedBox(height: LogMyPlateSpacing.itemSpacing),
              Text(
                'LogMyPlate',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  color: colors.textSecondary,
                  letterSpacing: 1.4,
                ),
              ),
              const SizedBox(height: 9),
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
              const SizedBox(height: LogMyPlateSpacing.lgSpacing),
              if (!_passwordResetMode) ...[
                Row(
                  children: [
                    if (showAppleSignIn) ...[
                      Expanded(
                        child: _ProviderButton(
                          label: 'Apple',
                          provider: AuthProvider.apple,
                          loading: widget.loading,
                          onTap: () => _signIn(context, AuthProvider.apple),
                        ),
                      ),
                      const SizedBox(width: 10),
                    ],
                    Expanded(
                      child: _ProviderButton(
                        label: 'Google',
                        provider: AuthProvider.google,
                        loading: widget.loading,
                        onTap: () => _signIn(context, AuthProvider.google),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
              ],
              _EmailAuthPanel(
                key: const ValueKey('account-email-auth-panel'),
                loading: widget.loading,
                onEmailAuth: widget.onEmailAuth,
                onPasswordResetRequest: widget.onPasswordResetRequest,
                onPasswordResetConfirm: widget.onPasswordResetConfirm,
                onPasswordResetModeChanged: (value) {
                  if (_passwordResetMode != value) {
                    setState(() => _passwordResetMode = value);
                  }
                },
                onClearError: widget.onClearError,
              ),
              const SizedBox(height: LogMyPlateSpacing.itemSpacing),
              if (widget.error != null) ...[
                _InlineAuthError(message: widget.error!),
                const SizedBox(height: 8),
              ],
              if (!_passwordResetMode) ...[
                GlassWrapper(child: TextButton(
                  onPressed: widget.loading
                      ? null
                      : widget.reason == AccountGateReason.quotaExhausted
                      ? widget.onManualLog
                      : () => Navigator.of(context).pop(),
                  child: Text(
                    widget.reason == AccountGateReason.quotaExhausted
                        ? 'Log manually instead'
                        : 'Maybe later',
                  ),
                )),
                const SizedBox(height: 6),
                Text(
                  widget.reason == AccountGateReason.accountDeletion
                      ? 'Deletion starts only after your confirmation.'
                      : 'Your photos are analyzed and saved with your meal logs.',
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    color: colors.textTertiary,
                    letterSpacing: 0,
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _signIn(BuildContext context, AuthProvider provider) async {
    final session = await widget.onSignIn(provider);
    if (session == null || !context.mounted) return;
    Navigator.of(context).pop(session);
  }
}

class _GatePill extends StatelessWidget {
  const _GatePill({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: colors.mutedFill,
        borderRadius: BorderRadius.circular(99),
        border: Border.all(color: colors.border, width: 0.6),
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
  const _EmailAuthPanel({
    super.key,
    required this.loading,
    required this.onEmailAuth,
    required this.onPasswordResetRequest,
    required this.onPasswordResetConfirm,
    required this.onPasswordResetModeChanged,
    this.onClearError,
  });

  final bool loading;
  final Future<AuthSession?> Function(
    EmailAuthMode mode,
    String email,
    String password,
  )
  onEmailAuth;
  final Future<bool> Function(String email) onPasswordResetRequest;
  final Future<AuthSession?> Function(
    String email,
    String code,
    String password,
  )
  onPasswordResetConfirm;
  final ValueChanged<bool> onPasswordResetModeChanged;
  final VoidCallback? onClearError;

  @override
  State<_EmailAuthPanel> createState() => _EmailAuthPanelState();
}

class _EmailAuthPanelState extends State<_EmailAuthPanel> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _resetCodeController = TextEditingController();
  final _newPasswordController = TextEditingController();
  EmailAuthMode _mode = EmailAuthMode.signUp;
  String? _validation;
  String? _resetEmail;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _resetCodeController.dispose();
    _newPasswordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;
    final isSignUp = _mode == EmailAuthMode.signUp;
    final isResetting = _resetEmail != null;

    return LiteGlassCard(
      padding: const EdgeInsets.all(10),
      borderRadius: BorderRadius.circular(LogMyPlateSpacing.heroCardBorderRadius),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (!isResetting) ...[
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
                        : () => setState(() {
                            _mode = EmailAuthMode.signUp;
                            _validation = null;
                            widget.onClearError?.call();
                          }),
                  ),
                  _ModeTab(
                    label: 'Log in',
                    selected: !isSignUp,
                    onTap: widget.loading
                        ? null
                        : () => setState(() {
                            _mode = EmailAuthMode.logIn;
                            _validation = null;
                            widget.onClearError?.call();
                          }),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 10),
          ] else ...[
            _ResetEmailNote(email: _resetEmail!),
            const SizedBox(height: LogMyPlateSpacing.itemSpacing),
          ],
          if (!isResetting) ...[
            _AuthTextField(
              controller: _emailController,
              hint: 'Email',
              keyboardType: TextInputType.emailAddress,
              enabled: !widget.loading,
              onChanged: _clearValidation,
            ),
            const SizedBox(height: 8),
          ],
          if (isResetting) ...[
            _AuthTextField(
              controller: _resetCodeController,
              hint: '6-digit code',
              keyboardType: TextInputType.number,
              enabled: !widget.loading,
              onChanged: _clearValidation,
            ),
            const SizedBox(height: 8),
            _AuthTextField(
              controller: _newPasswordController,
              hint: 'New password',
              obscureText: true,
              enabled: !widget.loading,
              onChanged: _clearValidation,
            ),
          ] else ...[
            _AuthTextField(
              controller: _passwordController,
              hint: 'Password',
              obscureText: true,
              enabled: !widget.loading,
              onChanged: _clearValidation,
            ),
            if (!isSignUp)
              Align(
                alignment: Alignment.centerRight,
                child: GlassWrapper(child: TextButton(
                  onPressed: widget.loading ? null : _requestReset,
                  style: TextButton.styleFrom(
                    padding: const EdgeInsets.symmetric(horizontal: 6),
                    minimumSize: const Size(0, 34),
                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  ),
                  child: const Text('Forgot password?'),
                )),
              ),
          ],
          if (_validation != null) ...[
            const SizedBox(height: 6),
            _InlineAuthError(message: _validation!),
          ],
          const SizedBox(height: 10),
          SizedBox(
            height: 44,
            child: PremiumButton(
              onPressed: widget.loading ? null : _submit,
              
              child: Text(
                isResetting
                    ? 'Reset password'
                    : isSignUp
                    ? 'Create account'
                    : 'Log in',
              ),
            ),
          ),
          if (isResetting) ...[
            const SizedBox(height: 4),
            GlassWrapper(child: TextButton(
              onPressed: widget.loading
                  ? null
                  : () {
                      setState(() {
                        _resetEmail = null;
                        _resetCodeController.clear();
                        _newPasswordController.clear();
                        _validation = null;
                      });
                      widget.onPasswordResetModeChanged(false);
                      widget.onClearError?.call();
                    },
              child: const Text('Back to login'),
            )),
          ],
        ],
      ),
    );
  }

  Future<void> _submit() async {
    if (_resetEmail != null) {
      await _submitReset();
      return;
    }

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

  Future<void> _requestReset() async {
    final email = _emailController.text.trim().toLowerCase();
    final error = _validateEmail(email);
    if (error != null) {
      setState(() => _validation = error);
      return;
    }

    setState(() => _validation = null);
    final accepted = await widget.onPasswordResetRequest(email);
    if (!accepted || !mounted) return;
    setState(() {
      _resetEmail = email;
      _resetCodeController.clear();
      _newPasswordController.clear();
    });
    widget.onPasswordResetModeChanged(true);
  }

  Future<void> _submitReset() async {
    final email = _resetEmail!;
    final code = _resetCodeController.text.trim();
    final password = _newPasswordController.text;
    final error = _validateReset(code, password);
    if (error != null) {
      setState(() => _validation = error);
      return;
    }

    setState(() => _validation = null);
    final session = await widget.onPasswordResetConfirm(email, code, password);
    if (session == null || !mounted) return;
    Navigator.of(context).pop(session);
  }

  String? _validate(String email, String password) {
    final emailError = _validateEmail(email);
    if (emailError != null) return emailError;
    if (password.isEmpty) {
      return _mode == EmailAuthMode.signUp
          ? 'Create a password with at least 6 characters.'
          : 'Enter your password.';
    }
    if (password.length < 6) {
      return 'Password must have at least 6 characters.';
    }
    return null;
  }

  String? _validateEmail(String email) {
    if (email.isEmpty) return 'Enter your email address.';
    if (!_emailPattern.hasMatch(email)) return 'Enter a valid email address.';
    return null;
  }

  String? _validateReset(String code, String password) {
    if (!RegExp(r'^\d{6}$').hasMatch(code)) {
      return 'Enter the 6-digit reset code.';
    }
    if (password.length < 6) {
      return 'Password must have at least 6 characters.';
    }
    return null;
  }

  void _clearValidation(String _) {
    if (_validation != null) setState(() => _validation = null);
    widget.onClearError?.call();
  }
}

final _emailPattern = RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$');

class _ResetEmailNote extends StatelessWidget {
  const _ResetEmailNote({required this.email});

  final String email;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 11),
      decoration: BoxDecoration(
        color: colors.mutedFill,
        borderRadius: BorderRadius.circular(LogMyPlateSpacing.elementBorderRadius),
      ),
      child: Text(
        'Code sent to $email',
        textAlign: TextAlign.center,
        style: Theme.of(context).textTheme.bodySmall?.copyWith(
          color: colors.textSecondary,
          height: 1.25,
          letterSpacing: 0,
        ),
      ),
    );
  }
}

class _InlineAuthError extends StatelessWidget {
  const _InlineAuthError({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    final showSupportAction = message.toLowerCase().contains('deactivated');

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 9),
      decoration: BoxDecoration(
        color: LogMyPlateColors.destructive.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: LogMyPlateColors.destructive.withValues(alpha: 0.22),
          width: 0.6,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Icon(
                Icons.error_outline_rounded,
                size: 16,
                color: LogMyPlateColors.destructive,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  message,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Theme.of(context).brightness == Brightness.dark
                        ? const Color(0xFFFFA3A3)
                        : LogMyPlateColors.destructiveDeep,
                    height: 1.25,
                    letterSpacing: 0,
                  ),
                ),
              ),
            ],
          ),
          if (showSupportAction) ...[
            const SizedBox(height: 8),
            Align(
              alignment: Alignment.centerLeft,
              child: GlassWrapper(child: TextButton.icon(
                onPressed: () => openLogMyPlateLink(
                  context,
                  LogMyPlateLinks.accountSupport,
                  copiedMessage: 'Support link copied',
                ),
                style: TextButton.styleFrom(
                  foregroundColor: LogMyPlateColors.destructiveDeep,
                  padding: const EdgeInsets.symmetric(horizontal: 8),
                  minimumSize: const Size(0, 34),
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),
                icon: const Icon(Icons.support_agent_rounded, size: 16),
                label: const Text('Contact support'),
              )),
            ),
          ],
        ],
      ),
    );
  }
}

class _ModeTab extends StatelessWidget {
  const _ModeTab({required this.label, required this.selected, this.onTap});

  final String label;
  final bool selected;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;

    return Expanded(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(10),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 160),
          height: 34,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: selected ? colors.mutedFill : Colors.transparent,
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
    this.onChanged,
  });

  final TextEditingController controller;
  final String hint;
  final TextInputType? keyboardType;
  final bool obscureText;
  final bool enabled;
  final ValueChanged<String>? onChanged;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;

    return TextField(
      controller: controller,
      enabled: enabled,
      keyboardType: keyboardType,
      obscureText: obscureText,
      onChanged: onChanged,
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
          borderRadius: BorderRadius.circular(LogMyPlateSpacing.elementBorderRadius),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(LogMyPlateSpacing.elementBorderRadius),
          borderSide: const BorderSide(
            color: LogMyPlateColors.accent,
            width: 0.8,
          ),
        ),
      ),
    );
  }
}

enum AccountGateReason { quotaExhausted, saveJournal, accountDeletion }

class _AccountGateCopy {
  const _AccountGateCopy({
    required this.eyebrow,
    required this.title,
    required this.subtitle,
  });

  final String eyebrow;
  final String title;
  final String subtitle;

  factory _AccountGateCopy.passwordReset() {
    return const _AccountGateCopy(
      eyebrow: 'account',
      title: 'Reset password',
      subtitle: 'Enter the code from your email and choose a new password.',
    );
  }

  factory _AccountGateCopy.forReason(AccountGateReason reason) {
    switch (reason) {
      case AccountGateReason.quotaExhausted:
        return const _AccountGateCopy(
          eyebrow: 'No scans left',
          title: 'Create account to keep scanning',
          subtitle: 'Save this journal and unlock extra scans with ads.',
        );
      case AccountGateReason.saveJournal:
        return const _AccountGateCopy(
          eyebrow: 'account',
          title: 'Save your journal',
          subtitle: 'Link once to protect your meals and future progress.',
        );
      case AccountGateReason.accountDeletion:
        return const _AccountGateCopy(
          eyebrow: 'account control',
          title: 'Sign in to delete account',
          subtitle:
              'Use the account you want to delete. The delete confirmation opens next.',
        );
    }
  }
}

class _AccountMark extends StatelessWidget {
  const _AccountMark({required this.loading});

  final bool loading;

  @override
  Widget build(BuildContext context) {
    return Stack(
      alignment: Alignment.center,
      children: [
        LogMyPlateBrandMark(size: 58, showHalo: false, pulsing: loading),
        if (loading)
          Container(
            width: 58,
            height: 58,
            decoration: BoxDecoration(
              color: Colors.black.withValues(alpha: 0.24),
              borderRadius: BorderRadius.circular(LogMyPlateSpacing.elementBorderRadius),
            ),
            child: const Center(
              child: SizedBox(
                width: 22,
                height: 22,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: LogMyPlateColors.accent,
                ),
              ),
            ),
          ),
      ],
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
    final colors = context.logmyplate;
    final isApple = provider == AuthProvider.apple;

    return SizedBox(
      height: 52,
      child: PremiumButton(
        onPressed: loading ? null : onTap,
        
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
