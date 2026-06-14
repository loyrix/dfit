# AI Nutritionist Chat — Complete Implementation Plan

> **Goal**: Premium-only AI Nutritionist chat using the user's real food/health data + Vertex AI (gemini-2.5-flash).
>
> **Decisions locked**:
>
> - ✅ Persist chat history (minified JSON in Postgres)
> - ✅ Contextual entry from Meal Detail ("Ask about this meal")
> - ✅ Suggested prompts: rule-based (no extra AI call), can add AI-generated later
> - ✅ Paywall redesign to lead with Nutritionist
> - ✅ Stay on Vertex AI

---

## Phase 1 — Contracts & API Config

### 1.1 [NEW] `packages/contracts/src/chat.ts`

Create Zod schemas for the chat API. Follow the exact pattern used in [meals.ts](file:///Users/satyamjaiswal/Documents/New%20project/packages/contracts/src/meals.ts) and [common.ts](file:///Users/satyamjaiswal/Documents/New%20project/packages/contracts/src/common.ts).

```typescript
import { z } from "zod";

// --- Enums ---
export const chatMessageRoleSchema = z.enum(["user", "assistant"]);
export type ChatMessageRole = z.infer<typeof chatMessageRoleSchema>;

// --- Message shape ---
export const chatMessageSchema = z.object({
  role: chatMessageRoleSchema,
  content: z.string().min(1),
  createdAt: z.string().datetime({ offset: true }),
});
export type ChatMessageContract = z.infer<typeof chatMessageSchema>;

// --- Create session response ---
export const createChatSessionResponseSchema = z.object({
  sessionId: z.string().uuid(),
  welcomeMessage: chatMessageSchema,
  suggestedPrompts: z.array(z.string()).max(4),
  usage: z.object({
    sessionsUsedToday: z.number().int().nonnegative(),
    maxSessionsPerDay: z.number().int().positive(),
  }),
});
export type CreateChatSessionResponse = z.infer<typeof createChatSessionResponseSchema>;

// --- Send message request ---
export const sendChatMessageRequestSchema = z.object({
  sessionId: z.string().uuid(),
  message: z.string().trim().min(1).max(1000),
});
export type SendChatMessageRequest = z.infer<typeof sendChatMessageRequestSchema>;

// --- Send message response ---
export const sendChatMessageResponseSchema = z.object({
  sessionId: z.string().uuid(),
  reply: chatMessageSchema,
  suggestedFollowUps: z.array(z.string()).max(3),
  usage: z.object({
    turnNumber: z.number().int().positive(),
    maxTurns: z.number().int().positive(),
    sessionsUsedToday: z.number().int().nonnegative(),
    maxSessionsPerDay: z.number().int().positive(),
  }),
});
export type SendChatMessageResponse = z.infer<typeof sendChatMessageResponseSchema>;

// --- Chat history response (for session persistence) ---
export const chatHistoryResponseSchema = z.object({
  sessionId: z.string().uuid(),
  messages: z.array(chatMessageSchema),
  turnCount: z.number().int().nonnegative(),
  maxTurns: z.number().int().positive(),
  createdAt: z.string().datetime({ offset: true }),
});
export type ChatHistoryResponse = z.infer<typeof chatHistoryResponseSchema>;
```

### 1.2 [MODIFY] `packages/contracts/src/index.ts`

Add the export:

```typescript
export * from "./chat.js";
```

### 1.3 [MODIFY] `apps/api/src/config.ts`

Add a `chat` block to the `ApiConfig` type and `buildApiConfig`.

**Type** (add after `vertex` block at line ~74):

```typescript
chat: {
  maxOutputTokens: number;
  maxTurnsPerSession: number;
  maxSessionsPerDay: number;
  sessionTtlMs: number;
  temperature: number;
}
```

**Build** (add after `storage` block in `buildApiConfig`, ~line 164):

```typescript
chat: {
  maxOutputTokens: Number(env.CHAT_MAX_OUTPUT_TOKENS ?? 1024),
  maxTurnsPerSession: Number(env.CHAT_MAX_TURNS_PER_SESSION ?? 15),
  maxSessionsPerDay: Number(env.CHAT_MAX_SESSIONS_PER_DAY ?? 5),
  sessionTtlMs: Number(env.CHAT_SESSION_TTL_MS ?? 1_800_000),
  temperature: Number(env.CHAT_TEMPERATURE ?? 0.7),
},
```

No validation is needed — these all have safe defaults.

---

## Phase 2 — Database Migration

### 2.1 [NEW] Migration: `chat_sessions_and_messages`

Use `pnpm db:new chat_sessions_and_messages` to create the migration pair. Follow the timestamp-with-seconds `YYYYMMDDHHMMSS` convention matching existing files like [20260606164145_revenuecat_subscriptions.up.sql](file:///Users/satyamjaiswal/Documents/New%20project/infra/db/migrations/20260606164145_revenuecat_subscriptions.up.sql).

**`.up.sql`**:

```sql
-- chat_sessions_and_messages.up.sql

create table if not exists chat_sessions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  session_date date not null default current_date,
  turn_count int not null default 0 check (turn_count >= 0),
  max_turns int not null default 15,
  context_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  closed_at timestamptz
);

create index if not exists idx_chat_sessions_profile_date
  on chat_sessions (profile_id, session_date);

create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references chat_sessions(id) on delete cascade,
  role text not null check (role in ('system', 'user', 'assistant')),
  content text not null,
  turn_number int not null default 0,
  input_tokens int,
  output_tokens int,
  latency_ms int,
  created_at timestamptz not null default now()
);

create index if not exists idx_chat_messages_session_turn
  on chat_messages (session_id, turn_number);
```

**`.down.sql`**:

```sql
-- chat_sessions_and_messages.down.sql

drop index if exists idx_chat_messages_session_turn;
drop table if exists chat_messages;
drop index if exists idx_chat_sessions_profile_date;
drop table if exists chat_sessions;
```

Run `pnpm db:validate` after creation.

---

## Phase 3 — API Services

### 3.1 [NEW] `apps/api/src/services/chat-ai-provider.ts`

A separate interface from the existing `AiProvider` (which handles meal image analysis). Keep concerns separated.

```typescript
export type ChatGenerateInput = {
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  maxOutputTokens: number;
  temperature: number;
};

export type ChatGenerateResult = {
  content: string;
  inputTokens?: number;
  outputTokens?: number;
  latencyMs: number;
};

export interface ChatAiProvider {
  generateChatResponse(input: ChatGenerateInput): Promise<ChatGenerateResult>;
}
```

### 3.2 [NEW] `apps/api/src/services/vertex-chat-ai-provider.ts`

Implement `ChatAiProvider` using the **same Vertex AI credentials** from [config.ts](file:///Users/satyamjaiswal/Documents/New%20project/apps/api/src/config.ts) (lines 149-157). Use `@google-cloud/vertexai` (already installed for the scan provider). Reference the existing auth pattern in [vertex-ai-provider.ts](file:///Users/satyamjaiswal/Documents/New%20project/apps/api/src/services/vertex-ai-provider.ts) if present, or [gemini-ai-provider.ts](file:///Users/satyamjaiswal/Documents/New%20project/apps/api/src/services/gemini-ai-provider.ts) for the auth + model init pattern.

Key differences from the scan provider:

- **No output schema** — chat returns free-text, not structured JSON
- **Temperature 0.7** — more creative than scan's temperature (configurable)
- **`generateContent`** with multi-turn messages, not single-turn image+text
- Track `inputTokens`, `outputTokens`, `latencyMs` in the result

### 3.3 [NEW] `apps/api/src/services/gemini-chat-ai-provider.ts`

Same as above but using the Gemini API directly (for dev/testing when `aiProvider === "gemini"`). Reference the request format in [gemini-ai-provider.ts](file:///Users/satyamjaiswal/Documents/New%20project/apps/api/src/services/gemini-ai-provider.ts).

### 3.4 [NEW] `apps/api/src/services/nutritionist-context.ts`

This is the **core value** of the feature. Assembles all context that gets injected into the system prompt.

**Data to assemble** (all server-side, the client sends nothing except the chat message):

```typescript
import type { AppRepository, ProfileHealthTarget } from "../repositories/app-repository.js";

export type NutritionistContext = {
  profile: {
    ageYears?: number;
    sex?: string;
    heightCm?: number;
    weightKg?: number;
    bmi?: number;
    bmiCategory?: string;
    activityLevel?: string;
    goal?: string;
    dailyCalorieTarget?: number;
    bmrCalories?: number;
  };
  today: {
    date: string;
    mealsLogged: number;
    totals: { calories: number; proteinG: number; carbsG: number; fatG: number };
    remaining?: { calories: number; proteinG: number; carbsG: number; fatG: number };
    meals: Array<{
      type: string;
      title: string;
      loggedAt: string;
      items: Array<{
        name: string;
        quantity: number;
        unit: string;
        calories: number;
        proteinG: number;
      }>;
      totals: { calories: number; proteinG: number; carbsG: number; fatG: number };
    }>;
  };
  weekSummary: {
    activeDays: number;
    mealCount: number;
    trackedDayAverage: { calories: number; proteinG: number; carbsG: number; fatG: number };
    dailyBreakdown: Array<{
      date: string;
      mealCount: number;
      totals: { calories: number; proteinG: number; carbsG: number; fatG: number };
    }>;
  };
  streak: {
    currentDays: number;
    longestDays: number;
  };
  focusMeal?: {
    // Only populated when opened from MealDetailScreen
    type: string;
    title: string;
    loggedAt: string;
    items: Array<{
      name: string;
      quantity: number;
      unit: string;
      calories: number;
      proteinG: number;
    }>;
    totals: { calories: number; proteinG: number; carbsG: number; fatG: number };
  };
};

export const assembleNutritionistContext = async (
  repository: AppRepository,
  healthTarget: ProfileHealthTarget | undefined,
  focusMealId?: string,
): Promise<NutritionistContext> => {
  // 1. Get profile for timezone
  // 2. Get today's meals via repository.listMeals({ fromDate: today, toDate: today })
  // 3. Get last 7 days via repository.summarizeMealsByDate({ fromDate: 7daysAgo, toDate: today })
  // 4. Build streak from existing buildStreakSummary or direct query
  // 5. If focusMealId, fetch via repository.getMeal(focusMealId) and include items
  // 6. NEVER include profileId, email, or PII — only nutritional data
};
```

### 3.5 [NEW] `apps/api/src/services/nutritionist-system-prompt.ts`

Build the system prompt from the assembled context.

```typescript
export const buildNutritionistSystemPrompt = (context: NutritionistContext): string => {
  // Return the full system prompt string as defined in the design doc
  // Include the user context as a JSON block at the end
  // The prompt text was specified in the design document Section 3.3
};
```

The system prompt should include:

- Personality rules (warm, Indian-food-literate, practical, uses user's data)
- Safety rules (no medical diagnoses, "estimates" disclaimer)
- Formatting rules (under 200 words unless detail requested, end with follow-up suggestions)
- One-time disclaimer instruction
- The `NUTRITIONIST_CONTEXT_JSON` block with the assembled context

### 3.6 [NEW] `apps/api/src/services/nutritionist-session-store.ts`

**In-memory store** for active sessions (not Postgres — that's for persistence/history only). This keeps the multi-turn Gemini conversation messages in RAM during the active session.

```typescript
export type ActiveChatSession = {
  sessionId: string;
  profileId: string;
  dbSessionId: string; // The Postgres chat_sessions.id
  context: NutritionistContext;
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  turnCount: number;
  maxTurns: number;
  createdAt: number;
  expiresAt: number; // createdAt + config.chat.sessionTtlMs
};

export class NutritionistSessionStore {
  // Map<sessionId, ActiveChatSession>
  // get(sessionId): ActiveChatSession | undefined
  // set(session): void
  // delete(sessionId): void
  // cleanup(): void — remove expired sessions, call periodically
}
```

### 3.7 [NEW] `apps/api/src/services/nutritionist-suggested-prompts.ts`

Rule-based suggested prompts based on the assembled context. No AI call needed.

```typescript
export const generateSuggestedPrompts = (context: NutritionistContext): string[] => {
  const prompts: string[] = [];

  // If focusMeal present:
  //   "What's good and bad about this meal?"
  //   "How can I make this meal healthier?"

  // Based on today's data:
  //   if mealsLogged > 0: "What should I eat for dinner?"
  //   if protein low: "How's my protein intake?"

  // General:
  //   "Suggest a high-protein Indian breakfast"
  //   "Am I eating enough fiber?"
  //   "What should I change this week?"

  return prompts.slice(0, 4);
};

export const generateFollowUpSuggestions = (
  aiResponse: string,
  context: NutritionistContext,
): string[] => {
  // Simple keyword-based follow-ups
  // Return 2-3 suggestions
};
```

---

## Phase 4 — API Repository Layer

### 4.1 [MODIFY] `apps/api/src/repositories/app-repository.ts`

Add these methods to the `AppRepository` interface (after line ~361):

```typescript
// Chat
countChatSessionsToday(profileId: string): Promise<number>;
createChatSession(input: {
  profileId: string;
  maxTurns: number;
  contextSnapshot: unknown;
}): Promise<{ id: string; sessionDate: string; createdAt: string }>;
closeChatSession(sessionId: string, turnCount: number): Promise<void>;
appendChatMessage(input: {
  sessionId: string;
  role: "system" | "user" | "assistant";
  content: string;
  turnNumber: number;
  inputTokens?: number;
  outputTokens?: number;
  latencyMs?: number;
}): Promise<void>;
getChatHistory(sessionId: string): Promise<{
  messages: Array<{ role: string; content: string; createdAt: string }>;
  turnCount: number;
  maxTurns: number;
  createdAt: string;
} | undefined>;
listChatSessions(profileId: string, limit?: number): Promise<Array<{
  id: string;
  turnCount: number;
  createdAt: string;
  closedAt?: string;
}>>;
```

### 4.2 [MODIFY] `apps/api/src/repositories/postgres-store.ts`

Implement all new methods using SQL against the `chat_sessions` and `chat_messages` tables. Follow the existing query patterns in this file.

### 4.3 [MODIFY] `apps/api/src/repositories/in-memory-store.ts`

Implement all new methods using in-memory arrays. Follow the existing in-memory patterns (arrays with `find`, `filter`, `push`).

---

## Phase 5 — API Route

### 5.1 [NEW] `apps/api/src/routes/chat.ts`

```typescript
import type { FastifyInstance } from "fastify";
import { sendChatMessageRequestSchema } from "@logmyplate/contracts";
import type { AppRepository } from "../repositories/app-repository.js";
import type { ChatAiProvider } from "../services/chat-ai-provider.js";
import type { ApiConfig } from "../config.js";
import { NutritionistSessionStore } from "../services/nutritionist-session-store.js";
import { assembleNutritionistContext } from "../services/nutritionist-context.js";
import { buildNutritionistSystemPrompt } from "../services/nutritionist-system-prompt.js";
import {
  generateSuggestedPrompts,
  generateFollowUpSuggestions,
} from "../services/nutritionist-suggested-prompts.js";

export const registerChatRoutes = async (
  app: FastifyInstance,
  repository: AppRepository,
  chatAiProvider: ChatAiProvider,
  chatConfig: ApiConfig["chat"],
): Promise<void> => {
  const sessionStore = new NutritionistSessionStore();

  // POST /v1/chat/nutritionist/session
  // - Check subscription active (premium only)
  // - Check countChatSessionsToday < maxSessionsPerDay
  // - Assemble context
  // - Build system prompt
  // - Generate welcome message via AI (1 turn: system prompt + "Greet the user warmly and briefly summarize what you see in their data. Keep it under 60 words.")
  // - Store session in memory + create Postgres row
  // - Store system prompt + welcome in chat_messages
  // - Return sessionId, welcomeMessage, suggestedPrompts, usage

  // POST /v1/chat/nutritionist/message
  // - Parse body with sendChatMessageRequestSchema
  // - Look up active session in memory store
  // - Check turn limit not exceeded
  // - Append user message to memory session
  // - Call chatAiProvider.generateChatResponse with full message history
  // - Append AI response to memory session
  // - Persist both messages to chat_messages table
  // - Increment turn count
  // - If turn limit reached, close session
  // - Return reply, suggestedFollowUps, usage

  // GET /v1/chat/nutritionist/sessions
  // - List recent sessions for the profile (for history viewing)
  // - Return list with session IDs, turn counts, dates

  // GET /v1/chat/nutritionist/sessions/:sessionId/messages
  // - Fetch all messages for a closed session (from Postgres)
  // - For session history viewing on the mobile app
};
```

**Premium gate**: Check subscription via `repository.getSubscriptionStatus()`. If `status !== "active"`, return 403:

```json
{
  "error": "premium_required",
  "message": "AI Nutritionist requires an active Premium subscription."
}
```

**Rate limit**: Check `repository.countChatSessionsToday(profile.id)` against `chatConfig.maxSessionsPerDay`. If exceeded, return 429:

```json
{
  "error": "daily_session_limit_reached",
  "message": "You've used all your AI Nutritionist sessions for today.",
  "limit": 5
}
```

### 5.2 [MODIFY] `apps/api/src/app.ts`

Register the chat routes. Follow the existing pattern (lines 96-120).

Add import:

```typescript
import { registerChatRoutes } from "./routes/chat.js";
import { createChatAiProvider } from "./services/chat-ai-provider.js";
```

Add to `BuildAppOptions`:

```typescript
chatAiProvider?: ChatAiProvider;
```

In `buildApp`, after the `aiProvider` creation (~line 70):

```typescript
const chatAiProvider =
  options.chatAiProvider ??
  (config.nodeEnv === "test" ? new MockChatAiProvider() : createChatAiProvider(config));
```

Register routes (after `registerCronRoutes`, ~line 120):

```typescript
await registerChatRoutes(app, repository, chatAiProvider, config.chat);
```

**Note**: Create a `createChatAiProvider(config)` factory that returns `VertexChatAiProvider` or `GeminiChatAiProvider` based on `config.aiProvider`, following the same pattern as `createAiProvider` in [ai-provider.ts](file:///Users/satyamjaiswal/Documents/New%20project/apps/api/src/services/ai-provider.ts).

---

## Phase 6 — Flutter Models

### 6.1 [NEW] `apps/mobile/lib/src/models/chat.dart`

```dart
class ChatSession {
  const ChatSession({
    required this.sessionId,
    required this.welcomeMessage,
    required this.suggestedPrompts,
    required this.sessionsUsedToday,
    required this.maxSessionsPerDay,
  });

  final String sessionId;
  final ChatMessage welcomeMessage;
  final List<String> suggestedPrompts;
  final int sessionsUsedToday;
  final int maxSessionsPerDay;

  factory ChatSession.fromJson(Map<String, dynamic> json) { /* ... */ }
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

  factory ChatMessage.fromJson(Map<String, dynamic> json) { /* ... */ }
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

  factory ChatReply.fromJson(Map<String, dynamic> json) { /* ... */ }
}

class ChatSessionSummary {
  const ChatSessionSummary({
    required this.id,
    required this.turnCount,
    required this.createdAt,
    this.closedAt,
  });

  final String id;
  final int turnCount;
  final DateTime createdAt;
  final DateTime? closedAt;

  factory ChatSessionSummary.fromJson(Map<String, dynamic> json) { /* ... */ }
}
```

---

## Phase 7 — Flutter API Client

### 7.1 [MODIFY] `apps/mobile/lib/src/services/logmyplate_api_client.dart`

Add these methods following the existing pattern (e.g., `analyzeCapturedMeal`, `saveMeal`):

```dart
// --- Chat ---

Future<ChatSession> createNutritionistSession({String? focusMealId}) async {
  final body = <String, dynamic>{};
  if (focusMealId != null) body['focusMealId'] = focusMealId;
  final response = await _post('/v1/chat/nutritionist/session', body: body);
  return ChatSession.fromJson(response);
}

Future<ChatReply> sendNutritionistMessage({
  required String sessionId,
  required String message,
}) async {
  final response = await _post('/v1/chat/nutritionist/message', body: {
    'sessionId': sessionId,
    'message': message,
  });
  return ChatReply.fromJson(response);
}

Future<List<ChatSessionSummary>> listNutritionistSessions() async {
  final response = await _get('/v1/chat/nutritionist/sessions');
  final list = response['sessions'] as List<dynamic>;
  return list
      .map((s) => ChatSessionSummary.fromJson(s as Map<String, dynamic>))
      .toList();
}

Future<List<ChatMessage>> getNutritionistSessionMessages(String sessionId) async {
  final response = await _get('/v1/chat/nutritionist/sessions/$sessionId/messages');
  final list = response['messages'] as List<dynamic>;
  return list
      .map((m) => ChatMessage.fromJson(m as Map<String, dynamic>))
      .toList();
}
```

Add the import for `chat.dart` at the top of the file.

---

## Phase 8 — Flutter State Controller

### 8.1 [NEW] `apps/mobile/lib/src/state/nutritionist_controller.dart`

Follow the same `ChangeNotifier` pattern as [journal_controller.dart](file:///Users/satyamjaiswal/Documents/New%20project/apps/mobile/lib/src/state/journal_controller.dart).

```dart
import 'package:flutter/foundation.dart';
import '../models/chat.dart';
import '../services/logmyplate_api_client.dart';

class NutritionistController extends ChangeNotifier {
  NutritionistController({required LogMyPlateApiClient apiClient})
      : _apiClient = apiClient;

  final LogMyPlateApiClient _apiClient;

  // Session state
  ChatSession? _session;
  ChatSession? get session => _session;

  // Messages (ordered oldest → newest)
  final List<ChatMessage> _messages = [];
  List<ChatMessage> get messages => List.unmodifiable(_messages);

  // Suggested follow-ups (update after each AI reply)
  List<String> _suggestedFollowUps = [];
  List<String> get suggestedFollowUps => _suggestedFollowUps;

  // UI state
  bool _creatingSession = false;
  bool get creatingSession => _creatingSession;

  bool _sendingMessage = false;
  bool get sendingMessage => _sendingMessage;

  int _turnNumber = 0;
  int get turnNumber => _turnNumber;

  int _maxTurns = 15;
  int get maxTurns => _maxTurns;

  bool get sessionComplete => _turnNumber >= _maxTurns;

  String? _error;
  String? get error => _error;

  /// Start a new session. Optionally with a focus meal.
  Future<void> startSession({String? focusMealId}) async {
    _creatingSession = true;
    _error = null;
    notifyListeners();

    try {
      final chatSession = await _apiClient.createNutritionistSession(
        focusMealId: focusMealId,
      );
      _session = chatSession;
      _messages.clear();
      _messages.add(chatSession.welcomeMessage);
      _suggestedFollowUps = chatSession.suggestedPrompts;
      _turnNumber = 0;
      _maxTurns = 15; // Will be updated from response
    } catch (e) {
      _error = _parseError(e);
    } finally {
      _creatingSession = false;
      notifyListeners();
    }
  }

  /// Send a user message and receive AI reply.
  Future<void> sendMessage(String text) async {
    if (_session == null || sessionComplete || _sendingMessage) return;

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
        sessionId: _session!.sessionId,
        message: text,
      );
      _messages.add(reply.reply);
      _suggestedFollowUps = reply.suggestedFollowUps;
      _turnNumber = reply.turnNumber;
      _maxTurns = reply.maxTurns;
    } catch (e) {
      _error = _parseError(e);
    } finally {
      _sendingMessage = false;
      notifyListeners();
    }
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }

  void dispose() {
    super.dispose();
  }

  String _parseError(Object e) {
    if (e is LogMyPlateApiException) {
      if (e.errorCode == 'premium_required') return 'Premium subscription required.';
      if (e.errorCode == 'daily_session_limit_reached') return 'Daily chat limit reached. Try again tomorrow.';
      if (e.errorCode == 'session_expired') return 'Session expired. Start a new chat.';
      if (e.errorCode == 'turn_limit_reached') return 'This session is complete. Start a new chat.';
      return e.message ?? 'Something went wrong.';
    }
    return 'Could not connect. Check your network.';
  }
}
```

---

## Phase 9 — Flutter Widgets

### 9.1 [NEW] `apps/mobile/lib/src/widgets/chat_message_bubble.dart`

**Design spec** — MUST follow these rules for premium feel:

**AI (assistant) bubble**:

- Background: `colors.surfaceCard` with slight glassmorphic effect — use `BackdropFilter` with `ImageFilter.blur(sigmaX: 8, sigmaY: 8)` and `colors.surfaceCard.withValues(alpha: 0.85)` (matches the [\_ShellNavBar](file:///Users/satyamjaiswal/Documents/New%20project/apps/mobile/lib/src/app.dart#L1889-L1945) glassmorphism pattern)
- Border: `colors.border` at 0.5 width
- Border radius: 18px, with top-left corner at 4px (chat bubble notch)
- Left-aligned, max width 85% of parent
- Leading avatar: 28x28 circle with gradient `LinearGradient(colors: [Color(0xFFFFE3A3), LogMyPlateColors.accent])` containing a `Icons.psychology_rounded` icon in `colors.accentOn` at size 16
- Content text: `Theme.of(context).textTheme.bodySmall` with `colors.textPrimary`, `height: 1.45`
- Support **basic markdown** in AI responses: bold (`**text**`) and bullet lists. Use a simple regex or a lightweight markdown renderer.

**User bubble**:

- Background: `LogMyPlateColors.accent.withValues(alpha: 0.14)` (matches the [chip](file:///Users/satyamjaiswal/Documents/New%20project/apps/mobile/lib/src/widgets/energy_hero_card.dart#L97-L101) pattern)
- Border: `LogMyPlateColors.accent.withValues(alpha: 0.24)` at 0.5 width
- Border radius: 18px, with top-right corner at 4px
- Right-aligned, max width 80% of parent
- Content text: `bodySmall` with `colors.textPrimary`
- No avatar

**Animation**: Each bubble should `AnimatedSize` + `FadeTransition` when appearing. Use `AnimationController` with `Duration(milliseconds: 280)` and `Curves.easeOutCubic`.

### 9.2 [NEW] `apps/mobile/lib/src/widgets/chat_typing_indicator.dart`

Three-dot pulse animation. 3 circles of 7px, spaced 5px apart. Each dot pulses with `Tween<double>(begin: 0.3, end: 1.0)` opacity, staggered by 200ms. Color: `colors.textTertiary`. Container styled like the AI bubble (left-aligned, glassmorphic background, same avatar).

### 9.3 [NEW] `apps/mobile/lib/src/widgets/nutritionist_suggested_chip.dart`

Horizontal scrolling `ListView` of chips. Each chip:

- Background: `colors.mutedFill` (matches [\_WeeklyInfoPill](file:///Users/satyamjaiswal/Documents/New%20project/apps/mobile/lib/src/screens/today_screen.dart#L593-L645))
- Border: `colors.border` at 0.5
- Border radius: 99 (pill)
- Padding: `horizontal: 14, vertical: 10`
- Text: `labelSmall` with `colors.textSecondary`
- On tap: call the send message callback with the chip text
- Ripple/ink effect on tap
- Disabled state when `sendingMessage` is true

### 9.4 [NEW] `apps/mobile/lib/src/widgets/nutritionist_entry_button.dart`

A pill-shaped button for the TodayScreen. Placed **below the WeeklySummaryCard** and **above the meals list**.

**Design**:

- Full width, height 56px
- Background: gradient `LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: [Color(0xFF18211C), Color(0xFF101412)])` (matches [hero surface dark gradient](file:///Users/satyamjaiswal/Documents/New%20project/apps/mobile/lib/src/theme/logmyplate_surfaces.dart#L48))
- Light mode: gradient `[Color(0xFFFFFCF4), Color(0xFFF7F0DF)]`
- Border: `LogMyPlateColors.accent.withValues(alpha: 0.22)` at 0.7
- Border radius: 16
- Shadow: match hero card shadow
- Content: Row of [AI icon (psychology_rounded, 20px, accent color)] + [Text "Ask AI Nutritionist", titleMedium] + [Spacer] + [Chevron right]
- Shimmer accent highlight on the icon (subtle animation)
- If user is NOT premium: show a small lock icon or "PRO" badge next to the text

---

## Phase 10 — Flutter Chat Screen

### 10.1 [NEW] `apps/mobile/lib/src/screens/nutritionist_chat_screen.dart`

**Full screen pushed route** (not a tab, not a sheet). Follows the same pattern as [MealDetailScreen](file:///Users/satyamjaiswal/Documents/New%20project/apps/mobile/lib/src/screens/meal_detail_screen.dart).

```dart
class NutritionistChatScreen extends StatefulWidget {
  const NutritionistChatScreen({
    super.key,
    required this.controller,
    this.focusMealId,
  });

  final NutritionistController controller;
  final String? focusMealId;

  @override
  State<NutritionistChatScreen> createState() => _NutritionistChatScreenState();
}
```

**Screen structure**:

```
Scaffold
  backgroundColor: colors.background
  body: LogMyPlateAmbientBackground (reuse existing widget)
    SafeArea
      Column
        ┌─ _ChatAppBar
        │   Back button (BackMark widget)
        │   "AI Nutritionist" title (titleMedium)
        │   Subtitle: "Based on your last 7 days" (labelSmall, textSecondary)
        │   Session turn counter pill: "3/15" (labelSmall, accent chip)
        │
        ├─ Expanded → ListView.builder (reverse: true for chat scroll)
        │   Messages from controller.messages
        │   Each message → ChatMessageBubble
        │   If sendingMessage → ChatTypingIndicator at bottom
        │   If sessionComplete → _SessionCompleteCard
        │   If error → _ChatErrorBanner with retry
        │   Padding between messages: 8px
        │   Bottom padding: 12px, Top padding: 12px
        │
        ├─ If suggestedFollowUps.isNotEmpty && !sessionComplete
        │   NutritionistSuggestedChips (horizontal scroll, 48px height)
        │
        └─ _ChatInputBar (if !sessionComplete)
            Container with glassmorphic background (same as ShellNavBar)
            Row:
              TextField (expanded, no border, hintText: "Ask anything about your nutrition...")
              Send button (accent filled circle, 42px, arrow_upward icon)
              Send disabled when: text empty || sendingMessage
            HapticFeedback.lightImpact() on send
```

**Session lifecycle**:

1. `initState` → call `controller.startSession(focusMealId: widget.focusMealId)`
2. Listen to `controller` via `addListener` → `setState(() {})`
3. `dispose` → `controller.removeListener`

**Key behaviors**:

- `ScrollController` with `reverse: true` for natural chat scroll
- After each new message, smooth scroll to bottom: `_scrollController.animateTo(0, ...)`
- Text field clears after send
- `FocusNode` management — keep keyboard open after send
- `_SessionCompleteCard`: "This session is complete. You can start a new one anytime." with a "New session" button

---

## Phase 11 — Integration into Existing App

### 11.1 [MODIFY] `apps/mobile/lib/src/app.dart`

**Imports to add** (after line ~26):

```dart
import 'screens/nutritionist_chat_screen.dart';
import 'state/nutritionist_controller.dart';
import 'models/chat.dart';
```

**Add to `_LogMyPlateAppState`** (around line ~93):

```dart
// No persistent NutritionistController — create one per session launch
```

**Add `_openNutritionistChat` method** (near `_openCamera`, ~line 474):

```dart
Future<void> _openNutritionistChat({String? focusMealId}) async {
  // Premium gate — check subscription
  if (_journalController.subscription?.active != true) {
    final upgraded = await _openPaywall();
    if (!upgraded) return;
  }

  // Auth gate — must be signed in
  if (!_authController.isSignedIn) {
    final session = await _openAccountHome(AccountGateReason.saveJournal);
    if (session == null) return;
  }

  final controller = NutritionistController(
    apiClient: _journalController.apiClient,  // Reuse existing client
  );

  await _navigatorKey.currentState!.push<void>(
    logmyplatePageRoute<void>(
      builder: (_) => NutritionistChatScreen(
        controller: controller,
        focusMealId: focusMealId,
      ),
    ),
  );

  controller.dispose();

  unawaited(
    _analytics.logEvent(
      'nutritionist_session_ended',
      parameters: {
        'turns': controller.turnNumber,
        'completed': controller.sessionComplete,
      },
    ),
  );
}
```

**Add callback to TodayScreen** (in `_todayScreen()` method, ~line 285):

```dart
onOpenNutritionist: () => _openNutritionistChat(),
```

**Add callback to MealDetailScreen** (in `_replaceCurrentRouteWithMealDetail`, ~line 712):

```dart
// Add to MealDetailScreen constructor:
onAskNutritionist: (meal) => _openNutritionistChat(focusMealId: meal.id),
```

### 11.2 [MODIFY] `apps/mobile/lib/src/screens/today_screen.dart`

**Add parameter to `TodayScreen`** (after `onOpenWeeklyJournal`, ~line 39):

```dart
final VoidCallback? onOpenNutritionist;
```

**Add the entry button** in the `build` method, after the `_WeeklySummaryCard` and before the meals list (after line ~148):

```dart
if (onOpenNutritionist != null) ...[
  const SizedBox(height: 12),
  NutritionistEntryButton(
    isPremium: /* check from quota/subscription */,
    onTap: onOpenNutritionist!,
  ),
],
```

### 11.3 [MODIFY] `apps/mobile/lib/src/screens/meal_detail_screen.dart`

**Add parameter** (after `onDeleteMeal`, ~line 22):

```dart
final void Function(MealLog meal)? onAskNutritionist;
```

**Add button** in the `build` method, after the `MacroProfileCard` (line ~113) and before the Items section:

```dart
if (widget.onAskNutritionist != null) ...[
  const SizedBox(height: 14),
  _AskNutritionistButton(
    onTap: () => widget.onAskNutritionist!(_meal),
  ),
],
```

**`_AskNutritionistButton` widget** (add as private widget in same file):

```dart
class _AskNutritionistButton extends StatelessWidget {
  const _AskNutritionistButton({required this.onTap});
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;
    // A card-style button:
    // - surfaceCard background, border, 14px radius
    // - Icon: psychology_rounded in accent
    // - Text: "Ask about this meal" in titleMedium
    // - Chevron right
    // - Match MealCard styling
  }
}
```

---

## Phase 12 — Paywall Enhancement

### 12.1 [MODIFY] `apps/mobile/lib/src/screens/paywall_screen.dart`

**Reorder and add feature rows** (lines 116-129). Place AI Nutritionist FIRST as the hero feature:

```dart
_FeatureRow(
  icon: Icons.psychology_rounded,
  title: 'AI Nutritionist — personalized nutrition advice',
),
const SizedBox(height: 10),
_FeatureRow(
  icon: Icons.auto_awesome_rounded,
  title: '300 AI meal scans/month',
),
const SizedBox(height: 10),
_FeatureRow(
  icon: Icons.today_rounded,
  title: 'Up to 10 scans/day',
),
const SizedBox(height: 10),
_FeatureRow(
  icon: Icons.bolt_rounded,
  title: 'Premium scans work without rewarded ads',
),
```

Also update the subtitle text (line ~103):

```dart
Text(
  'Your personal AI nutrition coach, more meal scans, and no ads.',
  // ... existing styling
),
```

---

## Phase 13 — Testing & Verification

### 13.1 API Tests

Create test file `apps/api/src/__tests__/chat.test.ts` (or follow existing test file pattern):

- **Session creation**: Premium user can create session; free user gets 403
- **Rate limiting**: 6th session in a day returns 429
- **Message flow**: Send message, receive reply with correct shape
- **Turn limit**: Session closes after maxTurns messages
- **Session expiry**: Expired session returns error
- **Context assembly**: Verify context includes today's meals and weekly summary
- **Persistence**: Messages stored in Postgres, retrievable via history endpoint

### 13.2 Contract Tests

```bash
pnpm --filter @logmyplate/contracts typecheck
```

### 13.3 API Checks

```bash
pnpm --filter @logmyplate/api test
pnpm --filter @logmyplate/api typecheck
pnpm db:validate
```

### 13.4 Flutter Checks

```bash
pnpm mobile:analyze
```

---

## File Change Summary

| Layer          | File                                                                     | Action | Priority |
| -------------- | ------------------------------------------------------------------------ | ------ | -------- |
| Contracts      | `packages/contracts/src/chat.ts`                                         | NEW    | P0       |
| Contracts      | `packages/contracts/src/index.ts`                                        | MODIFY | P0       |
| Config         | `apps/api/src/config.ts`                                                 | MODIFY | P0       |
| Migration      | `infra/db/migrations/YYYYMMDDHHMMSS_chat_sessions_and_messages.up.sql`   | NEW    | P0       |
| Migration      | `infra/db/migrations/YYYYMMDDHHMMSS_chat_sessions_and_messages.down.sql` | NEW    | P0       |
| API Service    | `apps/api/src/services/chat-ai-provider.ts`                              | NEW    | P0       |
| API Service    | `apps/api/src/services/vertex-chat-ai-provider.ts`                       | NEW    | P0       |
| API Service    | `apps/api/src/services/gemini-chat-ai-provider.ts`                       | NEW    | P1       |
| API Service    | `apps/api/src/services/nutritionist-context.ts`                          | NEW    | P0       |
| API Service    | `apps/api/src/services/nutritionist-system-prompt.ts`                    | NEW    | P0       |
| API Service    | `apps/api/src/services/nutritionist-session-store.ts`                    | NEW    | P0       |
| API Service    | `apps/api/src/services/nutritionist-suggested-prompts.ts`                | NEW    | P0       |
| API Repository | `apps/api/src/repositories/app-repository.ts`                            | MODIFY | P0       |
| API Repository | `apps/api/src/repositories/postgres-store.ts`                            | MODIFY | P0       |
| API Repository | `apps/api/src/repositories/in-memory-store.ts`                           | MODIFY | P0       |
| API Route      | `apps/api/src/routes/chat.ts`                                            | NEW    | P0       |
| API App        | `apps/api/src/app.ts`                                                    | MODIFY | P0       |
| Mobile Model   | `apps/mobile/lib/src/models/chat.dart`                                   | NEW    | P0       |
| Mobile Service | `apps/mobile/lib/src/services/logmyplate_api_client.dart`                | MODIFY | P0       |
| Mobile State   | `apps/mobile/lib/src/state/nutritionist_controller.dart`                 | NEW    | P0       |
| Mobile Screen  | `apps/mobile/lib/src/screens/nutritionist_chat_screen.dart`              | NEW    | P0       |
| Mobile Widget  | `apps/mobile/lib/src/widgets/chat_message_bubble.dart`                   | NEW    | P0       |
| Mobile Widget  | `apps/mobile/lib/src/widgets/chat_typing_indicator.dart`                 | NEW    | P0       |
| Mobile Widget  | `apps/mobile/lib/src/widgets/nutritionist_suggested_chip.dart`           | NEW    | P0       |
| Mobile Widget  | `apps/mobile/lib/src/widgets/nutritionist_entry_button.dart`             | NEW    | P0       |
| Mobile App     | `apps/mobile/lib/src/app.dart`                                           | MODIFY | P0       |
| Mobile Screen  | `apps/mobile/lib/src/screens/today_screen.dart`                          | MODIFY | P0       |
| Mobile Screen  | `apps/mobile/lib/src/screens/meal_detail_screen.dart`                    | MODIFY | P0       |
| Mobile Screen  | `apps/mobile/lib/src/screens/paywall_screen.dart`                        | MODIFY | P1       |

---

## Critical Design Constraints

> [!WARNING]
> **Follow existing patterns exactly:**
>
> - Use `context.logmyplate` for ALL colors (never hardcode colors that exist in theme)
> - Use `LogMyPlateColors.*` only for the static palette constants
> - Use `logmyplatePageRoute<T>()` for all navigation pushes
> - Use `AnimatedBuilder` with `controller` for reactive UI (see app.dart)
> - Use `LogMyPlateNoticeTone` for overlay notices
> - Use `createRouteTimer()` for API route timing
> - Use `BackMark()` widget for back buttons (from `primitive_icons.dart`)
> - Use `LogMyPlateAmbientBackground` for screen backgrounds
> - Border radius: 14px for cards, 16px for buttons, 18px for bubbles, 24px for containers, 99px for pills
> - Border width: 0.5-0.7 for subtle, 1.2 for selected state

> [!WARNING]
> **Never include PII in AI prompts:**
>
> - No profile ID, email, device ID, install ID
> - Only nutritional data, health targets, and meal history
> - Chat messages stored in Postgres should NOT be exported or accessible via admin routes initially

> [!CAUTION]
> **Cost controls — enforce these server-side:**
>
> - `maxOutputTokens: 1024` (configurable via env)
> - `maxTurnsPerSession: 15` (configurable)
> - `maxSessionsPerDay: 5` (configurable)
> - `sessionTtlMs: 1_800_000` (30 min TTL)
> - `temperature: 0.7` (not too creative, not too rigid)
> - Premium gate MUST check `repository.getSubscriptionStatus()` — never trust client claims
