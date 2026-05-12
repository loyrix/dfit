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
  });

  final AuthProvider provider;
  final String displayName;
  final DateTime linkedAt;

  Map<String, String> toJson() {
    return {
      'provider': provider.name,
      'displayName': displayName,
      'linkedAt': linkedAt.toUtc().toIso8601String(),
    };
  }

  factory AuthSession.fromJson(Map<String, dynamic> json) {
    return AuthSession(
      provider: AuthProvider.values.byName(json['provider'] as String),
      displayName: json['displayName'] as String,
      linkedAt: DateTime.parse(json['linkedAt'] as String).toLocal(),
    );
  }
}
