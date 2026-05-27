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

enum OAuthSignInFailureKind { canceled, configuration, unavailable, unknown }

class OAuthSignInFailure implements Exception {
  const OAuthSignInFailure({
    required this.provider,
    required this.kind,
    required this.message,
    this.details,
  });

  factory OAuthSignInFailure.google(GoogleSignInException error) {
    final description = error.description?.trim();
    return OAuthSignInFailure(
      provider: AuthProvider.google,
      kind: switch (error.code) {
        GoogleSignInExceptionCode.canceled => OAuthSignInFailureKind.canceled,
        GoogleSignInExceptionCode.clientConfigurationError ||
        GoogleSignInExceptionCode.providerConfigurationError =>
          OAuthSignInFailureKind.configuration,
        GoogleSignInExceptionCode.uiUnavailable ||
        GoogleSignInExceptionCode.interrupted =>
          OAuthSignInFailureKind.unavailable,
        _ => OAuthSignInFailureKind.unknown,
      },
      message: description == null || description.isEmpty
          ? 'Google sign-in failed before backend verification.'
          : description,
      details: error.toString(),
    );
  }

  final AuthProvider provider;
  final OAuthSignInFailureKind kind;
  final String message;
  final String? details;

  @override
  String toString() {
    final suffix = details == null ? '' : ' ($details)';
    return 'OAuthSignInFailure(${provider.name}, ${kind.name}): $message$suffix';
  }
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
      throw const OAuthSignInFailure(
        provider: AuthProvider.google,
        kind: OAuthSignInFailureKind.configuration,
        message: 'LOGMYPLATE_GOOGLE_WEB_CLIENT_ID is required.',
      );
    }

    late final GoogleSignInAccount account;
    try {
      await _ensureGoogleInitialized();
      account = await GoogleSignIn.instance.authenticate();
    } on GoogleSignInException catch (error) {
      throw OAuthSignInFailure.google(error);
    }

    final idToken = account.authentication.idToken;
    if (idToken == null || idToken.isEmpty) {
      throw const OAuthSignInFailure(
        provider: AuthProvider.google,
        kind: OAuthSignInFailureKind.configuration,
        message: 'Google did not return an ID token.',
      );
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
