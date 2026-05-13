enum AuthProvider { apple, google, email }

extension AuthProviderLabel on AuthProvider {
  String get label {
    switch (this) {
      case AuthProvider.apple:
        return 'Apple';
      case AuthProvider.google:
        return 'Google';
      case AuthProvider.email:
        return 'Email';
    }
  }
}

enum EmailAuthMode { signUp, logIn }

class AuthSession {
  const AuthSession({
    required this.provider,
    required this.displayName,
    required this.linkedAt,
    this.profileId,
    this.accessToken,
    this.expiresAt,
  });

  final AuthProvider provider;
  final String displayName;
  final DateTime linkedAt;
  final String? profileId;
  final String? accessToken;
  final DateTime? expiresAt;

  Map<String, String> toJson() {
    final json = {
      'provider': provider.name,
      'displayName': displayName,
      'linkedAt': linkedAt.toUtc().toIso8601String(),
    };
    if (profileId != null) json['profileId'] = profileId!;
    if (accessToken != null) json['accessToken'] = accessToken!;
    if (expiresAt != null) {
      json['expiresAt'] = expiresAt!.toUtc().toIso8601String();
    }
    return json;
  }

  factory AuthSession.fromJson(Map<String, dynamic> json) {
    return AuthSession(
      provider: AuthProvider.values.byName(json['provider'] as String),
      displayName: json['displayName'] as String,
      linkedAt: DateTime.parse(json['linkedAt'] as String).toLocal(),
      profileId: json['profileId'] as String?,
      accessToken: json['accessToken'] as String?,
      expiresAt: json['expiresAt'] == null
          ? null
          : DateTime.parse(json['expiresAt'] as String).toLocal(),
    );
  }

  factory AuthSession.fromApiJson(Map<String, dynamic> json) {
    final profile = json['profile'] as Map<String, dynamic>;
    final authMethod = profile['authMethod'] as String? ?? 'email';
    final email = profile['email'] as String?;
    final expiresAt = DateTime.parse(json['expiresAt'] as String).toLocal();

    return AuthSession(
      provider: authMethod == 'email'
          ? AuthProvider.email
          : AuthProvider.google,
      displayName: email ?? authMethod,
      linkedAt: DateTime.now(),
      profileId: profile['id'] as String?,
      accessToken: json['accessToken'] as String,
      expiresAt: expiresAt,
    );
  }
}
