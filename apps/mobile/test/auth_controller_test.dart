import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:logmyplate_mobile/src/models/auth_session.dart';
import 'package:logmyplate_mobile/src/services/account_session_store.dart';
import 'package:logmyplate_mobile/src/services/app_diagnostics.dart';
import 'package:logmyplate_mobile/src/services/logmyplate_api_client.dart';
import 'package:logmyplate_mobile/src/services/oauth_sign_in_service.dart';
import 'package:logmyplate_mobile/src/state/auth_controller.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues({});
    AppDiagnostics.instance.clear();
  });

  test('shows a specific duplicate email signup message', () async {
    final controller = AuthController(
      gateway: _FailingAuthGateway(
        error: LogMyPlateApiException(
          409,
          jsonEncode({
            'error': 'email_already_registered',
            'message': 'Email already registered.',
          }),
        ),
      ),
      store: AccountSessionStore(),
    );

    final session = await controller.signInWithEmail(
      mode: EmailAuthMode.signUp,
      email: 'friend@test.com',
      password: 'secret1',
    );

    expect(session, isNull);
    expect(
      controller.error,
      'This email is already registered. Log in instead.',
    );
  });

  test('shows a specific invalid login message', () async {
    final controller = AuthController(
      gateway: _FailingAuthGateway(
        error: LogMyPlateApiException(
          401,
          jsonEncode({
            'error': 'invalid_credentials',
            'message': 'Invalid email or password.',
          }),
        ),
      ),
      store: AccountSessionStore(),
    );

    final session = await controller.signInWithEmail(
      mode: EmailAuthMode.logIn,
      email: 'friend@test.com',
      password: 'secret1',
    );

    expect(session, isNull);
    expect(controller.error, 'Email or password is incorrect.');
  });

  test('shows a specific missing account login message', () async {
    final controller = AuthController(
      gateway: _FailingAuthGateway(
        error: LogMyPlateApiException(
          404,
          jsonEncode({
            'error': 'account_not_found',
            'message': 'User does not exist.',
          }),
        ),
      ),
      store: AccountSessionStore(),
    );

    final session = await controller.signInWithEmail(
      mode: EmailAuthMode.logIn,
      email: 'deleted@test.com',
      password: 'secret1',
    );

    expect(session, isNull);
    expect(controller.error, 'User does not exist.');
  });

  test('shows invalid password reset code message', () async {
    final controller = AuthController(
      gateway: _FailingAuthGateway(
        error: LogMyPlateApiException(
          400,
          jsonEncode({
            'error': 'invalid_password_reset_code',
            'message': 'Password reset code is invalid or expired.',
          }),
        ),
      ),
      store: AccountSessionStore(),
    );

    final session = await controller.confirmPasswordReset(
      email: 'friend@test.com',
      code: '111111',
      password: 'secret2',
    );

    expect(session, isNull);
    expect(controller.error, 'Reset code is invalid or expired.');
  });

  test('password reset confirmation stores the new account session', () async {
    final store = AccountSessionStore();
    final gateway = _PasswordResetAuthGateway();
    final controller = AuthController(gateway: gateway, store: store);

    final requested = await controller.requestPasswordReset(
      email: 'friend@test.com',
    );
    final session = await controller.confirmPasswordReset(
      email: 'friend@test.com',
      code: '123456',
      password: 'secret2',
    );

    expect(requested, isTrue);
    expect(gateway.resetRequestedEmail, 'friend@test.com');
    expect(gateway.resetConfirmedCode, '123456');
    expect(session?.accessToken, 'token_reset');
    expect((await store.load())?.accessToken, 'token_reset');
  });

  test('shows provider-specific OAuth failure copy', () async {
    final controller = AuthController(
      gateway: _FailingAuthGateway(error: UnsupportedError('not wired')),
      store: AccountSessionStore(),
      oauthSignInService: _FailingOAuthSignInService(
        error: UnsupportedError('not wired'),
      ),
    );

    final session = await controller.signIn(AuthProvider.google);

    expect(session, isNull);
    expect(
      controller.error,
      'Google sign-in could not be completed. Please try again.',
    );
  });

  test('shows Android Google configuration failure copy', () async {
    final controller = AuthController(
      gateway: _FailingAuthGateway(error: UnsupportedError('unused')),
      store: AccountSessionStore(),
      oauthSignInService: _FailingOAuthSignInService(
        error: const OAuthSignInFailure(
          provider: AuthProvider.google,
          kind: OAuthSignInFailureKind.configuration,
          message: 'serverClientId must be provided on Android',
        ),
      ),
    );

    final session = await controller.signIn(AuthProvider.google);

    expect(session, isNull);
    expect(
      controller.error,
      'Google sign-in is not configured for this build. Use email login for now.',
    );
  });

  test('shows Android Google pre-backend failure copy', () async {
    final controller = AuthController(
      gateway: _FailingAuthGateway(error: UnsupportedError('unused')),
      store: AccountSessionStore(),
      oauthSignInService: _FailingOAuthSignInService(
        error: const OAuthSignInFailure(
          provider: AuthProvider.google,
          kind: OAuthSignInFailureKind.canceled,
          message: 'activity is cancelled by the user',
        ),
      ),
    );

    final session = await controller.signIn(AuthProvider.google);

    expect(session, isNull);
    expect(
      controller.error,
      'Google sign-in stopped before verification. Try again or use email login.',
    );
  });

  test('delete profile clears the stored account session', () async {
    final storedSession = AuthSession(
      provider: AuthProvider.email,
      displayName: 'friend@test.com',
      linkedAt: DateTime(2026, 5, 23),
      profileId: 'profile_test',
      accessToken: 'token_test',
    );
    final store = AccountSessionStore();
    await store.save(storedSession);
    final gateway = _LifecycleAuthGateway();
    final controller = AuthController(gateway: gateway, store: store);

    await controller.load();
    final deleted = await controller.deleteProfile();

    expect(deleted, isTrue);
    expect(gateway.deleteCount, 1);
    expect(controller.session, isNull);
    expect(await store.load(), isNull);
  });
}

class _FailingAuthGateway implements AccountAuthGateway {
  const _FailingAuthGateway({required this.error});

  final Object error;

  @override
  Future<AuthSession> signIn(OAuthProviderCredential credential) async {
    throw error;
  }

  @override
  Future<AuthSession> signInWithEmail({
    required EmailAuthMode mode,
    required String email,
    required String password,
  }) async {
    throw error;
  }

  @override
  Future<void> requestPasswordReset({required String email}) async {
    throw error;
  }

  @override
  Future<AuthSession> confirmPasswordReset({
    required String email,
    required String code,
    required String password,
  }) async {
    throw error;
  }

  @override
  Future<void> signOut() async {}

  @override
  Future<void> deactivateProfile() async {
    throw error;
  }

  @override
  Future<void> deleteProfile() async {
    throw error;
  }
}

class _LifecycleAuthGateway implements AccountAuthGateway {
  int deleteCount = 0;

  @override
  Future<AuthSession> signIn(OAuthProviderCredential credential) async {
    throw UnsupportedError('unused');
  }

  @override
  Future<AuthSession> signInWithEmail({
    required EmailAuthMode mode,
    required String email,
    required String password,
  }) async {
    throw UnsupportedError('unused');
  }

  @override
  Future<void> requestPasswordReset({required String email}) async {
    throw UnsupportedError('unused');
  }

  @override
  Future<AuthSession> confirmPasswordReset({
    required String email,
    required String code,
    required String password,
  }) async {
    throw UnsupportedError('unused');
  }

  @override
  Future<void> signOut() async {}

  @override
  Future<void> deactivateProfile() async {}

  @override
  Future<void> deleteProfile() async {
    deleteCount += 1;
  }
}

class _PasswordResetAuthGateway implements AccountAuthGateway {
  String? resetRequestedEmail;
  String? resetConfirmedCode;

  @override
  Future<AuthSession> signIn(OAuthProviderCredential credential) async {
    throw UnsupportedError('unused');
  }

  @override
  Future<AuthSession> signInWithEmail({
    required EmailAuthMode mode,
    required String email,
    required String password,
  }) async {
    throw UnsupportedError('unused');
  }

  @override
  Future<void> requestPasswordReset({required String email}) async {
    resetRequestedEmail = email;
  }

  @override
  Future<AuthSession> confirmPasswordReset({
    required String email,
    required String code,
    required String password,
  }) async {
    resetConfirmedCode = code;
    return AuthSession(
      provider: AuthProvider.email,
      displayName: email,
      linkedAt: DateTime(2026, 5, 28),
      profileId: 'profile_reset',
      accessToken: 'token_reset',
    );
  }

  @override
  Future<void> signOut() async {}

  @override
  Future<void> deactivateProfile() async {}

  @override
  Future<void> deleteProfile() async {}
}

class _FailingOAuthSignInService implements OAuthSignInService {
  _FailingOAuthSignInService({required this.error});

  final Object error;

  @override
  Future<OAuthProviderCredential> signIn(AuthProvider provider) async {
    throw error;
  }

  @override
  Future<void> signOut() async {}
}
