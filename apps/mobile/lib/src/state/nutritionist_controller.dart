import 'package:flutter/foundation.dart';

import '../models/chat.dart';
import '../services/logmyplate_api_client.dart';

class NutritionistController extends ChangeNotifier {
  NutritionistController({required LogMyPlateApiClient apiClient})
      : _apiClient = apiClient;

  final LogMyPlateApiClient _apiClient;

  LogMyPlateApiClient get apiClient => _apiClient;

  bool _readOnly = false;
  bool get readOnly => _readOnly;

  String? _sessionId;
  String? get sessionId => _sessionId;

  final List<ChatMessage> _messages = [];
  List<ChatMessage> get messages => List.unmodifiable(_messages);

  List<String> _suggestedFollowUps = [];
  List<String> get suggestedFollowUps => _suggestedFollowUps;

  bool _creatingSession = false;
  bool get creatingSession => _creatingSession;

  bool _sendingMessage = false;
  bool get sendingMessage => _sendingMessage;

  bool _loadingHistory = false;
  bool get loadingHistory => _loadingHistory;

  int _turnNumber = 0;
  int get turnNumber => _turnNumber;

  int _maxTurns = 15;
  int get maxTurns => _maxTurns;

  bool get sessionComplete => !_readOnly && _turnNumber >= _maxTurns;

  String? _error;
  String? get error => _error;

  Future<void> loadExistingSession(String sessionId) async {
    _loadingHistory = true;
    _readOnly = true;
    _error = null;
    notifyListeners();

    try {
      final history = await _apiClient.getNutritionistSessionMessages(sessionId);
      _sessionId = sessionId;
      _messages.clear();
      _messages.addAll(history.messages);
      _turnNumber = history.turnCount;
      _maxTurns = history.maxTurns;
      _suggestedFollowUps = [];
    } on LogMyPlateApiException catch (e) {
      _error = _parseError(e);
    } catch (e) {
      _error = 'Could not load chat history.';
    } finally {
      _loadingHistory = false;
      notifyListeners();
    }
  }

  Future<void> startSession({String? focusMealId}) async {
    _creatingSession = true;
    _error = null;
    notifyListeners();

    try {
      final chatSession = await _apiClient.createNutritionistSession(
        focusMealId: focusMealId,
      );
      _readOnly = false;
      _sessionId = chatSession.sessionId;
      _messages.clear();
      _messages.add(chatSession.welcomeMessage);
      _suggestedFollowUps = chatSession.suggestedPrompts;
      _turnNumber = 0;
      _maxTurns = chatSession.maxTurns;
    } on LogMyPlateApiException catch (e) {
      _error = _parseError(e);
    } catch (e) {
      _error = 'Could not connect. Check your network.';
    } finally {
      _creatingSession = false;
      notifyListeners();
    }
  }

  Future<void> sendMessage(String text) async {
    if (_sessionId == null || _readOnly || sessionComplete || _sendingMessage) return;

    final userMessage = ChatMessage(
      role: ChatMessageRole.user,
      content: text,
      createdAt: DateTime.now(),
    );
    _messages.add(userMessage);
    _sendingMessage = true;
    _error = null;
    _suggestedFollowUps = [];
    notifyListeners();

    try {
      final reply = await _apiClient.sendNutritionistMessage(
        sessionId: _sessionId!,
        message: text,
      );
      _messages.add(reply.reply);
      _suggestedFollowUps = reply.suggestedFollowUps;
      _turnNumber = reply.turnNumber;
      _maxTurns = reply.maxTurns;
    } on LogMyPlateApiException catch (e) {
      _error = _parseError(e);
    } catch (e) {
      _error = 'Could not connect. Check your network.';
    } finally {
      _sendingMessage = false;
      notifyListeners();
    }
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }


  String _parseError(LogMyPlateApiException e) {
    if (e.errorCode == 'premium_required') return 'Premium subscription required.';
    if (e.errorCode == 'daily_session_limit_reached') return 'Daily chat limit reached. Try again tomorrow.';
    if (e.errorCode == 'session_expired') return 'Session expired. Start a new chat.';
    if (e.errorCode == 'turn_limit_reached') return 'This session is complete. Start a new chat.';
    return e.message ?? 'Something went wrong.';
  }
}
