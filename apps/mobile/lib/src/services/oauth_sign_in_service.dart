import 'dart:math';

import 'package:flutter/foundation.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:sign_in_with_apple/sign_in_with_apple.dart';

import '../models/auth_session.dart';

class OAuthProviderCredential {
  const OAuthProviderCredential({
    required this.provider,
    required this.idToken,
    this.authorizationCode,
    this.nonce,
    this.displayName,
  });

  final AuthProvider provider;
  final String idToken;
  final String? authorizationCode;
  final String? nonce;
  final String? displayName;
}

abstract class OAuthSignInService {
  Future<OAuthProviderCredential> signIn(AuthProvider provider);
  Future<void> signOut();
}

class NativeOAuthSignInService implements OAuthSignInService {
  static const _googleWebClientId = String.fromEnvironment(
    'LOGMYPLATE_GOOGLE_WEB_CLIENT_ID',
  );
  static const _googleIosClientId = String.fromEnvironment(
    'LOGMYPLATE_GOOGLE_IOS_CLIENT_ID',
  );

  Future<void>? _googleInitialization;

  @override
  Future<OAuthProviderCredential> signIn(AuthProvider provider) {
    switch (provider) {
      case AuthProvider.google:
        return _signInWithGoogle();
      case AuthProvider.apple:
        return _signInWithApple();
      case AuthProvider.email:
        throw UnsupportedError('Email auth does not use OAuth sign-in.');
    }
  }

  @override
  Future<void> signOut() async {
    if (_googleInitialization != null) {
      await _googleInitialization;
      await GoogleSignIn.instance.signOut();
    }
  }

  Future<OAuthProviderCredential> _signInWithGoogle() async {
    if (_googleWebClientId.trim().isEmpty) {
      throw StateError('LOGMYPLATE_GOOGLE_WEB_CLIENT_ID is required.');
    }

    await _ensureGoogleInitialized();
    final account = await GoogleSignIn.instance.authenticate();
    final idToken = account.authentication.idToken;
    if (idToken == null || idToken.isEmpty) {
      throw StateError('Google did not return an ID token.');
    }

    return OAuthProviderCredential(
      provider: AuthProvider.google,
      idToken: idToken,
      displayName: account.displayName,
    );
  }

  Future<void> _ensureGoogleInitialized() {
    final existing = _googleInitialization;
    if (existing != null) return existing;

    final iosClientId =
        defaultTargetPlatform == TargetPlatform.iOS &&
            _googleIosClientId.trim().isNotEmpty
        ? _googleIosClientId
        : null;
    return _googleInitialization = GoogleSignIn.instance.initialize(
      clientId: iosClientId,
      serverClientId: _googleWebClientId,
    );
  }

  Future<OAuthProviderCredential> _signInWithApple() async {
    if (!await SignInWithApple.isAvailable()) {
      throw UnsupportedError('Apple sign-in is not available on this device.');
    }

    final nonce = _nonce();
    final credential = await SignInWithApple.getAppleIDCredential(
      scopes: [
        AppleIDAuthorizationScopes.email,
        AppleIDAuthorizationScopes.fullName,
      ],
      nonce: nonce,
    );
    final idToken = credential.identityToken;
    if (idToken == null || idToken.isEmpty) {
      throw StateError('Apple did not return an identity token.');
    }

    final displayName = [credential.givenName, credential.familyName]
        .whereType<String>()
        .map((part) => part.trim())
        .where((part) => part.isNotEmpty)
        .join(' ');

    return OAuthProviderCredential(
      provider: AuthProvider.apple,
      idToken: idToken,
      authorizationCode: credential.authorizationCode,
      nonce: nonce,
      displayName: displayName.isEmpty ? null : displayName,
    );
  }

  String _nonce() {
    const alphabet =
        '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-._';
    final random = Random.secure();
    return List.generate(
      32,
      (_) => alphabet[random.nextInt(alphabet.length)],
    ).join();
  }
}
