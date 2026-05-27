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
  Future<void> signOut() async {}

  @override
  Future<void> deactivateProfile() async {}

  @override
  Future<void> deleteProfile() async {
    deleteCount += 1;
  }
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
