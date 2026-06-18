import { randomUUID } from "node:crypto";
import type { FastifyInstance } from "fastify";
import {
  createChatSessionResponseSchema,
  sendChatMessageRequestSchema,
  sendChatMessageResponseSchema,
  chatHistoryResponseSchema,
  createChatSessionRequestSchema,
} from "@logmyplate/contracts";
import type { AppRepository } from "../repositories/app-repository.js";
import type { ChatAiProvider } from "../services/chat-ai-provider.js";
import { MockChatAiProvider } from "../services/mock-chat-ai-provider.js";
import type { ApiConfig } from "../config.js";
import { NutritionistSessionStore } from "../services/nutritionist-session-store.js";
import { assembleNutritionistContext } from "../services/nutritionist-context.js";
import { buildNutritionistSystemPrompt } from "../services/nutritionist-system-prompt.js";
import {
  generateSuggestedPrompts,
  generateFollowUpSuggestions,
} from "../services/nutritionist-suggested-prompts.js";
import { createRouteTimer } from "./route-timing.js";

export const registerChatRoutes = async (
  app: FastifyInstance,
  repository: AppRepository,
  chatAiProvider: ChatAiProvider,
  chatConfig: ApiConfig["chat"],
): Promise<void> => {
  const sessionStore = new NutritionistSessionStore();

  app.addHook("onClose", async () => {
    sessionStore.dispose();
  });

  app.post("/v1/chat/nutritionist/session", async (request, reply) => {
    const timer = createRouteTimer();

    const profile = await timer.measure("profile", () => repository.getProfile());
    const identity = { timezone: profile.timezone };

    const subscription = await timer.measure("subscription", () =>
      repository.getSubscriptionStatus(),
    );

    if (!subscription.active) {
      return reply.status(403).send({
        error: "premium_required",
        message: "AI Nutritionist requires an active Premium subscription.",
      });
    }

    const sessionsToday = await timer.measure("sessionCount", () =>
      repository.countChatSessionsToday(profile.id),
    );

    if (sessionsToday >= chatConfig.maxSessionsPerDay) {
      return reply.status(429).send({
        error: "daily_session_limit_reached",
        message: "You've used all your AI Nutritionist sessions for today.",
        limit: chatConfig.maxSessionsPerDay,
      });
    }

    const parsed = createChatSessionRequestSchema.parse(request.body ?? {});
    const focusMealId = parsed.focusMealId;

    const healthTarget = await timer.measure("healthTarget", () =>
      repository.getHealthTarget(profile.id),
    );

    const context = await timer.measure("context", () =>
      assembleNutritionistContext(repository, healthTarget, identity.timezone, focusMealId),
    );

    const basePrompt = await timer.measure("basePrompt", () =>
      repository.getAiPrompt("nutritionist_prompt"),
    );
    const systemPrompt = buildNutritionistSystemPrompt(context, basePrompt);
    const suggestedPrompts = generateSuggestedPrompts(context);

    const welcomeMessageContent = await timer.measure("welcome", async () => {
      const result = await chatAiProvider.generateChatResponse({
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content:
              "Greet the user warmly and briefly summarize what you see in their data. Keep it under 60 words.",
          },
        ],
        maxOutputTokens: chatConfig.maxOutputTokens,
        temperature: chatConfig.temperature,
      });
      return result.content;
    });

    const sessionDb = await timer.measure("createDbSession", () =>
      repository.createChatSession({
        profileId: profile.id,
        maxTurns: chatConfig.maxTurnsPerSession,
        contextSnapshot: context,
      }),
    );

    const sessionId = randomUUID();

    sessionStore.set({
      sessionId,
      profileId: profile.id,
      dbSessionId: sessionDb.id,
      context,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "assistant", content: welcomeMessageContent },
      ],
      turnCount: 0,
      maxTurns: chatConfig.maxTurnsPerSession,
      createdAt: Date.now(),
      expiresAt: Date.now() + chatConfig.sessionTtlMs,
    });

    await timer.measure("persistWelcome", () =>
      repository.appendChatMessage({
        sessionId: sessionDb.id,
        role: "assistant",
        content: welcomeMessageContent,
        turnNumber: 0,
      }),
    );

    request.log.info(
      {
        route: "POST /v1/chat/nutritionist/session",
        timings: timer.snapshot(),
        sessionId: sessionDb.id,
        mealsLogged: context.today.mealsLogged,
        hasFocusMeal: !!focusMealId,
      },
      "nutritionist session created",
    );

    return createChatSessionResponseSchema.parse({
      sessionId,
      welcomeMessage: {
        role: "assistant",
        content: welcomeMessageContent,
        createdAt: new Date().toISOString(),
      },
      suggestedPrompts,
      usage: {
        sessionsUsedToday: sessionsToday + 1,
        maxSessionsPerDay: chatConfig.maxSessionsPerDay,
      },
    });
  });

  app.post("/v1/chat/nutritionist/message", async (request, reply) => {
    const timer = createRouteTimer();

    const body = sendChatMessageRequestSchema.parse(request.body);
    const activeSession = sessionStore.get(body.sessionId);

    if (!activeSession) {
      return reply.status(404).send({
        error: "session_not_found",
        message: "Chat session not found or expired. Start a new one.",
      });
    }

    if (activeSession.turnCount >= activeSession.maxTurns) {
      return reply.status(400).send({
        error: "turn_limit_reached",
        message: "This session is complete. Start a new chat.",
      });
    }

    const turnNumber = activeSession.turnCount + 1;

    activeSession.messages.push({ role: "user", content: body.message });
    activeSession.turnCount = turnNumber;

    const aiResult = await timer.measure("aiResponse", () =>
      chatAiProvider.generateChatResponse({
        messages: activeSession.messages,
        maxOutputTokens: chatConfig.maxOutputTokens,
        temperature: chatConfig.temperature,
      }),
    );

    let finalAiContent = aiResult.content;
    let shouldEndSession = false;
    if (finalAiContent.includes("[END_SESSION]")) {
      shouldEndSession = true;
      finalAiContent = finalAiContent.replace(/\[END_SESSION\]/g, "").trim();
    }

    activeSession.messages.push({ role: "assistant", content: finalAiContent });

    await timer.measure("persistUserMessage", () =>
      repository.appendChatMessage({
        sessionId: activeSession.dbSessionId,
        role: "user",
        content: body.message,
        turnNumber,
      }),
    );

    await timer.measure("persistAiMessage", () =>
      repository.appendChatMessage({
        sessionId: activeSession.dbSessionId,
        role: "assistant",
        content: finalAiContent,
        turnNumber: turnNumber,
        inputTokens: aiResult.inputTokens,
        outputTokens: aiResult.outputTokens,
        latencyMs: aiResult.latencyMs,
      }),
    );

    if (turnNumber >= activeSession.maxTurns || shouldEndSession) {
      await timer.measure("closeSession", () =>
        repository.closeChatSession(activeSession.dbSessionId, turnNumber),
      );
      if (shouldEndSession) {
        activeSession.turnCount = activeSession.maxTurns;
      }
    }

    const suggestedFollowUps = generateFollowUpSuggestions(finalAiContent, activeSession.context);

    request.log.info(
      {
        route: "POST /v1/chat/nutritionist/message",
        timings: timer.snapshot(),
        sessionId: activeSession.dbSessionId,
        turnNumber,
        maxTurns: activeSession.maxTurns,
        latencyMs: aiResult.latencyMs,
        inputTokens: aiResult.inputTokens,
        outputTokens: aiResult.outputTokens,
      },
      "nutritionist message processed",
    );

    return sendChatMessageResponseSchema.parse({
      sessionId: body.sessionId,
      reply: {
        role: "assistant",
        content: finalAiContent,
        createdAt: new Date().toISOString(),
      },
      suggestedFollowUps,
      usage: {
        turnNumber: activeSession.turnCount,
        maxTurns: activeSession.maxTurns,
        sessionsUsedToday: 0,
        maxSessionsPerDay: chatConfig.maxSessionsPerDay,
      },
    });
  });

  app.get("/v1/chat/nutritionist/sessions", async (request) => {
    const profile = await repository.getProfile();
    const sessions = await repository.listChatSessions(profile.id, 20);

    return {
      sessions: sessions.map((s) => ({
        id: s.id,
        turnCount: s.turnCount,
        createdAt: s.createdAt,
        closedAt: s.closedAt ?? null,
      })),
    };
  });

  app.get("/v1/chat/nutritionist/sessions/:sessionId/messages", async (request, reply) => {
    const params = request.params as { sessionId: string };
    const history = await repository.getChatHistory(params.sessionId);

    if (!history) {
      return reply.status(404).send({
        error: "session_not_found",
        message: "Chat session not found.",
      });
    }

    const toIso = (d: string | null | undefined): string => {
      if (!d) return new Date().toISOString();
      try {
        return new Date(d).toISOString();
      } catch {
        return new Date().toISOString();
      }
    };

    return chatHistoryResponseSchema.parse({
      ...history,
      sessionId: params.sessionId,
      createdAt: toIso(history.createdAt),
      messages: history.messages.map((m) => ({
        role: m.role,
        content: m.content,
        createdAt: toIso(m.createdAt),
      })),
    });
  });
};
