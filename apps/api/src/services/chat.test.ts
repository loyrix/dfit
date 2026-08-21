import { describe, expect, it } from "vitest";
import { buildApp } from "../app.js";
import { InMemoryStore } from "../repositories/in-memory-store.js";
import { MockChatAiProvider } from "./mock-chat-ai-provider.js";
import { NutritionistSessionStore } from "./nutritionist-session-store.js";
import { generateSuggestedPrompts } from "./nutritionist-suggested-prompts.js";
import {
  detectChatAbuse,
  ensureNonEmptyChatContent,
  CHAT_ABUSE_CLOSING_MESSAGE,
} from "./nutritionist-moderation.js";
import {
  ChatAiProviderError,
  type ChatAiProvider,
  type ChatGenerateInput,
  type ChatGenerateResult,
} from "./chat-ai-provider.js";
import type { NutritionistContext } from "./nutritionist-context.js";

// Returns a fixed string for every call — used to simulate degenerate model
// output such as a response consisting solely of the [END_SESSION] tag, or an
// empty string (the model spent its whole output budget on thinking).
class FixedReplyAiProvider implements ChatAiProvider {
  readonly calls: ChatGenerateInput[] = [];

  constructor(
    private readonly reply: string,
    private readonly finishReason?: string,
  ) {}

  async generateChatResponse(input: ChatGenerateInput): Promise<ChatGenerateResult> {
    this.calls.push(input);
    return {
      content: this.reply,
      inputTokens: 1,
      outputTokens: 1,
      latencyMs: 0,
      finishReason: this.finishReason,
    };
  }
}

// Dynamic dates so the entitlement never expires by wall-clock time; the
// previous hardcoded 2026-07-01 period end made premium tests fail once the
// calendar passed it.
const entitlementPeriodStart = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
const entitlementPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

const premium = async (repository: InMemoryStore): Promise<void> => {
  await repository.upsertSubscriptionEntitlement({
    appUserId: "profile_demo",
    entitlementId: "premium",
    status: "active",
    store: "app_store",
    currentPeriodStart: entitlementPeriodStart,
    currentPeriodEnd: entitlementPeriodEnd,
    willRenew: true,
  });
};

const testHeaders = {
  "x-logmyplate-platform": "ios",
  "x-logmyplate-timezone": "Asia/Kolkata",
};

const baseContext = (overrides?: Partial<NutritionistContext>): NutritionistContext => ({
  profile: {},
  today: {
    date: "2026-06-14",
    mealsLogged: 0,
    totals: { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
    meals: [],
  },
  weekSummary: {
    activeDays: 0,
    mealCount: 0,
    trackedDayAverage: { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
    dailyBreakdown: [],
  },
  streak: { currentDays: 0, longestDays: 0 },
  ...overrides,
});

describe("Chat Routes", () => {
  it("allows non-premium user to create a session within free allowance", async () => {
    const app = await buildApp({
      repository: new InMemoryStore(),
      chatAiProvider: new MockChatAiProvider(),
    });

    const response = await app.inject({
      method: "POST",
      url: "/v1/chat/nutritionist/session",
      headers: testHeaders,
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body).toHaveProperty("sessionId");
    expect(body.usage.maxSessionsPerDay).toBe(1);
  });

  it("creates a session for premium user", async () => {
    const repository = new InMemoryStore();
    await repository.upsertSubscriptionEntitlement({
      appUserId: "profile_demo",
      entitlementId: "premium",
      status: "active",
      store: "app_store",
      currentPeriodStart: entitlementPeriodStart,
      currentPeriodEnd: entitlementPeriodEnd,
      willRenew: true,
    });

    const app = await buildApp({
      repository,
      chatAiProvider: new MockChatAiProvider(),
    });

    const response = await app.inject({
      method: "POST",
      url: "/v1/chat/nutritionist/session",
      headers: testHeaders,
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body).toHaveProperty("sessionId");
    expect(body).toHaveProperty("welcomeMessage");
    expect(body.welcomeMessage.role).toBe("assistant");
    expect(body.suggestedPrompts).toBeInstanceOf(Array);
    expect(body.usage.sessionsUsedToday).toBeGreaterThanOrEqual(0);
    expect(body.usage.maxSessionsPerDay).toBe(10);
  });

  it("sends a message and receives a reply", async () => {
    const repository = new InMemoryStore();
    await repository.upsertSubscriptionEntitlement({
      appUserId: "profile_demo",
      entitlementId: "premium",
      status: "active",
      store: "app_store",
      currentPeriodStart: entitlementPeriodStart,
      currentPeriodEnd: entitlementPeriodEnd,
      willRenew: true,
    });

    const app = await buildApp({
      repository,
      chatAiProvider: new MockChatAiProvider(),
    });

    const session = await app.inject({
      method: "POST",
      url: "/v1/chat/nutritionist/session",
      headers: testHeaders,
    });

    const sessionBody = JSON.parse(session.body);
    const sessionId = sessionBody.sessionId;

    const response = await app.inject({
      method: "POST",
      url: "/v1/chat/nutritionist/message",
      headers: testHeaders,
      payload: {
        sessionId,
        message: "How's my protein intake today?",
      },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body).toHaveProperty("reply");
    expect(body.reply.role).toBe("assistant");
    expect(body.reply.content.length).toBeGreaterThan(0);
    expect(body.suggestedFollowUps).toBeInstanceOf(Array);
    expect(body.usage.turnNumber).toBe(1);
    expect(body.usage.maxTurns).toBe(15);
  });

  it("returns 403 free_allowance_exhausted when non-premium user exceeds free limit", async () => {
    const repository = new InMemoryStore();

    const app = await buildApp({
      repository,
      chatAiProvider: new MockChatAiProvider(),
    });

    for (let i = 0; i < 1; i++) {
      const res = await app.inject({
        method: "POST",
        url: "/v1/chat/nutritionist/session",
        headers: testHeaders,
      });
      expect(res.statusCode).toBe(200);
    }

    const response = await app.inject({
      method: "POST",
      url: "/v1/chat/nutritionist/session",
      headers: testHeaders,
    });

    expect(response.statusCode).toBe(403);
    const body = JSON.parse(response.body);
    expect(body.error).toBe("free_allowance_exhausted");
  });

  it("deleting a session does not reset daily quota", async () => {
    const repository = new InMemoryStore();

    const app = await buildApp({
      repository,
      chatAiProvider: new MockChatAiProvider(),
    });

    const sessionIds: string[] = [];
    for (let i = 0; i < 1; i++) {
      const res = await app.inject({
        method: "POST",
        url: "/v1/chat/nutritionist/session",
        headers: testHeaders,
      });
      expect(res.statusCode).toBe(200);
      sessionIds.push(JSON.parse(res.body).sessionId);
    }

    await app.inject({
      method: "DELETE",
      url: "/v1/chat/nutritionist/sessions",
      headers: testHeaders,
      payload: { sessionIds },
    });

    const response = await app.inject({
      method: "POST",
      url: "/v1/chat/nutritionist/session",
      headers: testHeaders,
    });

    expect(response.statusCode).toBe(403);
    const body = JSON.parse(response.body);
    expect(body.error).toBe("free_allowance_exhausted");
  });

  it("returns 429 when premium user exceeds daily session limit", async () => {
    const repository = new InMemoryStore();
    await repository.upsertSubscriptionEntitlement({
      appUserId: "profile_demo",
      entitlementId: "premium",
      status: "active",
      store: "app_store",
      currentPeriodStart: entitlementPeriodStart,
      currentPeriodEnd: entitlementPeriodEnd,
      willRenew: true,
    });

    const app = await buildApp({
      repository,
      chatAiProvider: new MockChatAiProvider(),
    });

    for (let i = 0; i < 10; i++) {
      const res = await app.inject({
        method: "POST",
        url: "/v1/chat/nutritionist/session",
        headers: testHeaders,
      });
      expect(res.statusCode).toBe(200);
    }

    const response = await app.inject({
      method: "POST",
      url: "/v1/chat/nutritionist/session",
      headers: testHeaders,
    });

    expect(response.statusCode).toBe(429);
    const body = JSON.parse(response.body);
    expect(body.error).toBe("daily_session_limit_reached");
  });
});

describe("NutritionistSessionStore", () => {
  it("stores and retrieves sessions", () => {
    const store = new NutritionistSessionStore();
    store.set({
      sessionId: "test-session",
      profileId: "profile-1",
      dbSessionId: "db-1",
      context: baseContext(),
      messages: [],
      turnCount: 0,
      maxTurns: 15,
      createdAt: Date.now(),
      expiresAt: Date.now() + 60_000,
    });

    const session = store.get("test-session");
    expect(session).toBeDefined();
    expect(session!.profileId).toBe("profile-1");
  });

  it("returns undefined for expired sessions", () => {
    const store = new NutritionistSessionStore();
    store.set({
      sessionId: "expired-session",
      profileId: "profile-1",
      dbSessionId: "db-1",
      context: baseContext(),
      messages: [],
      turnCount: 0,
      maxTurns: 15,
      createdAt: Date.now() - 120_000,
      expiresAt: Date.now() - 60_000,
    });

    const session = store.get("expired-session");
    expect(session).toBeUndefined();
  });

  it("deletes sessions", () => {
    const store = new NutritionistSessionStore();
    store.set({
      sessionId: "delete-session",
      profileId: "profile-1",
      dbSessionId: "db-1",
      context: baseContext(),
      messages: [],
      turnCount: 0,
      maxTurns: 15,
      createdAt: Date.now(),
      expiresAt: Date.now() + 60_000,
    });

    store.delete("delete-session");
    expect(store.get("delete-session")).toBeUndefined();
  });

  it("cleans up expired sessions", () => {
    const store = new NutritionistSessionStore();
    store.set({
      sessionId: "expired-1",
      profileId: "profile-1",
      dbSessionId: "db-1",
      context: baseContext(),
      messages: [],
      turnCount: 0,
      maxTurns: 15,
      createdAt: Date.now() - 120_000,
      expiresAt: Date.now() - 60_000,
    });
    store.set({
      sessionId: "active-1",
      profileId: "profile-1",
      dbSessionId: "db-2",
      context: baseContext(),
      messages: [],
      turnCount: 0,
      maxTurns: 15,
      createdAt: Date.now(),
      expiresAt: Date.now() + 60_000,
    });

    store.cleanup();
    expect(store.get("expired-1")).toBeUndefined();
    expect(store.get("active-1")).toBeDefined();
  });

  it("disposes and clears all sessions", () => {
    const store = new NutritionistSessionStore();
    store.set({
      sessionId: "session-1",
      profileId: "profile-1",
      dbSessionId: "db-1",
      context: baseContext(),
      messages: [],
      turnCount: 0,
      maxTurns: 15,
      createdAt: Date.now(),
      expiresAt: Date.now() + 60_000,
    });

    store.dispose();
    expect(store.get("session-1")).toBeUndefined();
  });
});

describe("generateSuggestedPrompts", () => {
  it("returns general prompts when no data is available", () => {
    const prompts = generateSuggestedPrompts(baseContext());
    expect(prompts.length).toBeGreaterThan(0);
    expect(prompts.length).toBeLessThanOrEqual(4);
  });

  it("includes meal-specific prompts when a single meal is logged", () => {
    const prompts = generateSuggestedPrompts(
      baseContext({
        today: {
          date: "2026-06-14",
          mealsLogged: 1,
          totals: { calories: 600, proteinG: 20, carbsG: 80, fatG: 15 },
          meals: [
            {
              type: "lunch",
              title: "Dal Rice",
              loggedAt: "2026-06-14T12:00:00Z",
              items: [],
              totals: { calories: 600, proteinG: 20, carbsG: 80, fatG: 15 },
            },
          ],
        },
      }),
    );
    expect(prompts.some((p) => p.includes("good and bad"))).toBe(true);
    expect(prompts.some((p) => p.includes("healthier"))).toBe(true);
  });

  it("includes protein question when protein is low", () => {
    const prompts = generateSuggestedPrompts(
      baseContext({
        today: {
          date: "2026-06-14",
          mealsLogged: 1,
          totals: { calories: 500, proteinG: 15, carbsG: 60, fatG: 20 },
          meals: [],
        },
      }),
    );
    expect(prompts.some((p) => p.includes("protein"))).toBe(true);
  });
});

describe("MockChatAiProvider", () => {
  it("returns a response for any input", async () => {
    const provider = new MockChatAiProvider();
    const result = await provider.generateChatResponse({
      messages: [
        { role: "system", content: "You are a nutritionist." },
        { role: "user", content: "How's my diet?" },
      ],
      maxOutputTokens: 1024,
      temperature: 0.7,
    });

    expect(result.content.length).toBeGreaterThan(0);
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it("returns welcome message when no user messages", async () => {
    const provider = new MockChatAiProvider();
    const result = await provider.generateChatResponse({
      messages: [],
      maxOutputTokens: 1024,
      temperature: 0.7,
    });

    expect(result.content).toContain("AI Nutritionist");
  });
});

describe("detectChatAbuse", () => {
  it("flags profanity regardless of casing, leetspeak, and repeated letters", () => {
    expect(detectChatAbuse("this is fucking useless")).toBe(true);
    expect(detectChatAbuse("F U C K you")).toBe(true);
    expect(detectChatAbuse("you are an a$$hole")).toBe(true);
    expect(detectChatAbuse("shiiiit advice")).toBe(true);
    expect(detectChatAbuse("stfu")).toBe(true);
  });

  it("does not flag benign nutrition messages", () => {
    expect(detectChatAbuse("How's my protein intake today?")).toBe(false);
    expect(detectChatAbuse("I had pasta and a class snack")).toBe(false);
    expect(detectChatAbuse("Can you assess my breakfast?")).toBe(false);
  });
});

describe("ensureNonEmptyChatContent", () => {
  it("returns trimmed content when non-empty", () => {
    expect(ensureNonEmptyChatContent("  hello  ")).toBe("hello");
  });

  it("falls back when content is empty or whitespace", () => {
    expect(ensureNonEmptyChatContent("").length).toBeGreaterThan(0);
    expect(ensureNonEmptyChatContent("   ").length).toBeGreaterThan(0);
    expect(ensureNonEmptyChatContent("", "custom")).toBe("custom");
  });
});

describe("Chat moderation routes", () => {
  it("returns a non-empty reply when the model emits only [END_SESSION]", async () => {
    const repository = new InMemoryStore();
    await premium(repository);

    const app = await buildApp({
      repository,
      chatAiProvider: new FixedReplyAiProvider("[END_SESSION]"),
    });

    const session = await app.inject({
      method: "POST",
      url: "/v1/chat/nutritionist/session",
      headers: testHeaders,
    });
    const sessionId = JSON.parse(session.body).sessionId;

    const response = await app.inject({
      method: "POST",
      url: "/v1/chat/nutritionist/message",
      headers: testHeaders,
      payload: { sessionId, message: "How's my protein intake today?" },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.reply.content.length).toBeGreaterThan(0);
  });

  it("hard-ends the session with a firm closing message on abusive input", async () => {
    const repository = new InMemoryStore();
    await premium(repository);

    const app = await buildApp({
      repository,
      chatAiProvider: new MockChatAiProvider(),
    });

    const session = await app.inject({
      method: "POST",
      url: "/v1/chat/nutritionist/session",
      headers: testHeaders,
    });
    const sessionId = JSON.parse(session.body).sessionId;

    const response = await app.inject({
      method: "POST",
      url: "/v1/chat/nutritionist/message",
      headers: testHeaders,
      payload: { sessionId, message: "you are fucking useless" },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.reply.content).toBe(CHAT_ABUSE_CLOSING_MESSAGE);

    // The session is closed: a follow-up message is rejected.
    const followUp = await app.inject({
      method: "POST",
      url: "/v1/chat/nutritionist/message",
      headers: testHeaders,
      payload: { sessionId, message: "How's my protein today?" },
    });
    expect(followUp.statusCode).toBe(400);
    expect(JSON.parse(followUp.body).error).toBe("turn_limit_reached");
  });
});

describe("Chat thinking budget and empty replies", () => {
  it("passes a capped thinking budget to the provider on every generation", async () => {
    const repository = new InMemoryStore();
    await premium(repository);

    const provider = new FixedReplyAiProvider("Your protein looks steady this week.");
    const app = await buildApp({ repository, chatAiProvider: provider });

    const session = await app.inject({
      method: "POST",
      url: "/v1/chat/nutritionist/session",
      headers: testHeaders,
    });
    const sessionId = JSON.parse(session.body).sessionId;

    await app.inject({
      method: "POST",
      url: "/v1/chat/nutritionist/message",
      headers: testHeaders,
      payload: { sessionId, message: "How do I plan my meals for weight loss?" },
    });

    // Both the welcome generation and the message turn must be capped.
    expect(provider.calls.length).toBe(2);
    for (const call of provider.calls) {
      expect(call.thinkingBudget).toBeGreaterThanOrEqual(0);
      // Thinking is billed against maxOutputTokens, so the cap has to leave
      // room for the answer itself.
      expect(call.thinkingBudget).toBeLessThan(call.maxOutputTokens);
    }
  });

  it("keeps the session open when the model returns no text at all", async () => {
    const repository = new InMemoryStore();
    await premium(repository);

    // Mirrors a MAX_TOKENS truncation where thinking consumed the whole budget.
    const app = await buildApp({
      repository,
      chatAiProvider: new FixedReplyAiProvider("", "MAX_TOKENS"),
    });

    const session = await app.inject({
      method: "POST",
      url: "/v1/chat/nutritionist/session",
      headers: testHeaders,
    });
    const sessionId = JSON.parse(session.body).sessionId;

    const response = await app.inject({
      method: "POST",
      url: "/v1/chat/nutritionist/message",
      headers: testHeaders,
      payload: { sessionId, message: "How do I plan my meals for weight loss?" },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.reply.content.length).toBeGreaterThan(0);
    // A dud generation must not burn the session: the user can retry.
    expect(body.usage.turnNumber).toBe(1);
    expect(body.usage.turnNumber).toBeLessThan(body.usage.maxTurns);

    const followUp = await app.inject({
      method: "POST",
      url: "/v1/chat/nutritionist/message",
      headers: testHeaders,
      payload: { sessionId, message: "Try again please" },
    });
    expect(followUp.statusCode).toBe(200);
  });
});

// Succeeds for the welcome generation, then fails the next N message turns
// before recovering — models a transient provider outage mid-session.
class FlakyAiProvider implements ChatAiProvider {
  readonly calls: ChatGenerateInput[] = [];
  private failuresLeft: number;

  constructor(failures: number) {
    this.failuresLeft = failures;
  }

  async generateChatResponse(input: ChatGenerateInput): Promise<ChatGenerateResult> {
    this.calls.push(input);
    // The first call is the welcome; only message turns are failed.
    if (this.calls.length > 1 && this.failuresLeft > 0) {
      this.failuresLeft -= 1;
      throw new ChatAiProviderError("chat_ai_provider_error", "upstream is busy", 502, true);
    }
    return { content: "Your protein is on track today.", latencyMs: 0 };
  }
}

describe("Chat turn rollback on provider failure", () => {
  const startSession = async (app: Awaited<ReturnType<typeof buildApp>>) => {
    const session = await app.inject({
      method: "POST",
      url: "/v1/chat/nutritionist/session",
      headers: testHeaders,
    });
    return JSON.parse(session.body).sessionId as string;
  };

  it("does not charge the user a turn when the provider fails", async () => {
    const repository = new InMemoryStore();
    await premium(repository);
    const provider = new FlakyAiProvider(1);
    const app = await buildApp({ repository, chatAiProvider: provider });
    const sessionId = await startSession(app);

    const failed = await app.inject({
      method: "POST",
      url: "/v1/chat/nutritionist/message",
      headers: testHeaders,
      payload: { sessionId, message: "How's my protein today?" },
    });

    expect(failed.statusCode).toBe(502);
    expect(JSON.parse(failed.body).retryable).toBe(true);

    // The retry must land on turn 1 again — the failed attempt cost nothing.
    const retried = await app.inject({
      method: "POST",
      url: "/v1/chat/nutritionist/message",
      headers: testHeaders,
      payload: { sessionId, message: "How's my protein today?" },
    });

    expect(retried.statusCode).toBe(200);
    expect(JSON.parse(retried.body).usage.turnNumber).toBe(1);
  });

  it("does not leave the failed message in the conversation history", async () => {
    const repository = new InMemoryStore();
    await premium(repository);
    const provider = new FlakyAiProvider(1);
    const app = await buildApp({ repository, chatAiProvider: provider });
    const sessionId = await startSession(app);

    await app.inject({
      method: "POST",
      url: "/v1/chat/nutritionist/message",
      headers: testHeaders,
      payload: { sessionId, message: "How's my protein today?" },
    });
    await app.inject({
      method: "POST",
      url: "/v1/chat/nutritionist/message",
      headers: testHeaders,
      payload: { sessionId, message: "How's my protein today?" },
    });

    // calls[0] is the welcome, [1] the failed turn, [2] the retry. The retry
    // must carry the question once, not twice.
    const retryMessages = provider.calls[2].messages;
    const userMessages = retryMessages.filter((m) => m.role === "user");
    expect(userMessages).toHaveLength(1);
    expect(userMessages[0].content).toBe("How's my protein today?");
  });

  it("leaves the session usable for its full turn budget after a failure", async () => {
    const repository = new InMemoryStore();
    await premium(repository);
    const app = await buildApp({ repository, chatAiProvider: new FlakyAiProvider(2) });
    const sessionId = await startSession(app);

    for (let i = 0; i < 2; i += 1) {
      const failed = await app.inject({
        method: "POST",
        url: "/v1/chat/nutritionist/message",
        headers: testHeaders,
        payload: { sessionId, message: "Try me" },
      });
      expect(failed.statusCode).toBe(502);
    }

    const ok = await app.inject({
      method: "POST",
      url: "/v1/chat/nutritionist/message",
      headers: testHeaders,
      payload: { sessionId, message: "Try me" },
    });
    const body = JSON.parse(ok.body);
    expect(ok.statusCode).toBe(200);
    expect(body.usage.turnNumber).toBe(1);
    expect(body.usage.maxTurns).toBe(15);
  });
});
