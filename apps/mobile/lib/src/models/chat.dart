class ChatSession {
  const ChatSession({
    required this.sessionId,
    required this.welcomeMessage,
    required this.suggestedPrompts,
    required this.sessionsUsedToday,
    required this.maxSessionsPerDay,
    required this.maxTurns,
  });

  final String sessionId;
  final ChatMessage welcomeMessage;
  final List<String> suggestedPrompts;
  final int sessionsUsedToday;
  final int maxSessionsPerDay;
  final int maxTurns;

  factory ChatSession.fromJson(Map<String, dynamic> json) {
    return ChatSession(
      sessionId: json['sessionId'] as String,
      welcomeMessage: ChatMessage.fromJson(
        json['welcomeMessage'] as Map<String, dynamic>,
      ),
      suggestedPrompts: (json['suggestedPrompts'] as List<dynamic>)
          .map((e) => e as String)
          .toList(),
      sessionsUsedToday: (json['usage'] as Map<String, dynamic>)['sessionsUsedToday'] as int,
      maxSessionsPerDay: (json['usage'] as Map<String, dynamic>)['maxSessionsPerDay'] as int,
      maxTurns: (json['usage'] as Map<String, dynamic>)['maxTurns'] as int? ?? 15,
    );
  }
}

class ChatMessage {
  const ChatMessage({
    required this.role,
    required this.content,
    required this.createdAt,
  });

  final ChatMessageRole role;
  final String content;
  final DateTime createdAt;

  bool get isUser => role == ChatMessageRole.user;
  bool get isAssistant => role == ChatMessageRole.assistant;

  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    return ChatMessage(
      role: ChatMessageRole.values.byName(json['role'] as String),
      content: json['content'] as String,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }
}

enum ChatMessageRole { user, assistant }

class ChatReply {
  const ChatReply({
    required this.sessionId,
    required this.reply,
    required this.suggestedFollowUps,
    required this.turnNumber,
    required this.maxTurns,
    required this.sessionsUsedToday,
    required this.maxSessionsPerDay,
  });

  final String sessionId;
  final ChatMessage reply;
  final List<String> suggestedFollowUps;
  final int turnNumber;
  final int maxTurns;
  final int sessionsUsedToday;
  final int maxSessionsPerDay;

  bool get sessionComplete => turnNumber >= maxTurns;

  factory ChatReply.fromJson(Map<String, dynamic> json) {
    return ChatReply(
      sessionId: json['sessionId'] as String,
      reply: ChatMessage.fromJson(json['reply'] as Map<String, dynamic>),
      suggestedFollowUps: (json['suggestedFollowUps'] as List<dynamic>)
          .map((e) => e as String)
          .toList(),
      turnNumber: (json['usage'] as Map<String, dynamic>)['turnNumber'] as int,
      maxTurns: (json['usage'] as Map<String, dynamic>)['maxTurns'] as int,
      sessionsUsedToday: (json['usage'] as Map<String, dynamic>)['sessionsUsedToday'] as int,
      maxSessionsPerDay: (json['usage'] as Map<String, dynamic>)['maxSessionsPerDay'] as int,
    );
  }
}

class ChatHistory {
  const ChatHistory({
    required this.messages,
    required this.turnCount,
    required this.maxTurns,
  });

  final List<ChatMessage> messages;
  final int turnCount;
  final int maxTurns;

  factory ChatHistory.fromJson(Map<String, dynamic> json) {
    return ChatHistory(
      messages: (json['messages'] as List<dynamic>)
          .map((m) => ChatMessage.fromJson(m as Map<String, dynamic>))
          .toList(),
      turnCount: json['turnCount'] as int,
      maxTurns: json['maxTurns'] as int,
    );
  }
}

class ChatSessionSummary {
  const ChatSessionSummary({
    required this.id,
    required this.turnCount,
    required this.createdAt,
    this.title,
    this.closedAt,
  });

  final String id;
  final String? title;
  final int turnCount;
  final DateTime createdAt;
  final DateTime? closedAt;

  factory ChatSessionSummary.fromJson(Map<String, dynamic> json) {
    final rawTitle = json['title'] as String?;
    return ChatSessionSummary(
      id: json['id'] as String,
      title: rawTitle != null && rawTitle.trim().isNotEmpty
          ? rawTitle.trim()
          : null,
      turnCount: json['turnCount'] as int,
      createdAt: DateTime.parse(json['createdAt'] as String),
      closedAt: json['closedAt'] != null
          ? DateTime.parse(json['closedAt'] as String)
          : null,
    );
  }
}
