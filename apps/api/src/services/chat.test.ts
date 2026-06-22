import { describe, expect, it } from "vitest";
import { buildApp } from "../app.js";
import { InMemoryStore } from "../repositories/in-memory-store.js";
import { MockChatAiProvider } from "./mock-chat-ai-provider.js";
import { NutritionistSessionStore } from "./nutritionist-session-store.js";
import { generateSuggestedPrompts } from "./nutritionist-suggested-prompts.js";
import type { NutritionistContext } from "./nutritionist-context.js";

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
      currentPeriodStart: "2026-06-01T00:00:00Z",
      currentPeriodEnd: "2026-07-01T00:00:00Z",
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
      currentPeriodStart: "2026-06-01T00:00:00Z",
      currentPeriodEnd: "2026-07-01T00:00:00Z",
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
      currentPeriodStart: "2026-06-01T00:00:00Z",
      currentPeriodEnd: "2026-07-01T00:00:00Z",
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

  it("includes meal-specific prompts when focus meal is present", () => {
    const prompts = generateSuggestedPrompts(
      baseContext({
        focusMeal: {
          type: "lunch",
          title: "Dal Rice",
          loggedAt: "2026-06-14T12:00:00Z",
          items: [],
          totals: { calories: 600, proteinG: 20, carbsG: 80, fatG: 15 },
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
