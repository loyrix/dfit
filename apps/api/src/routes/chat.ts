import type { FastifyInstance } from "fastify";
import {
  createChatSessionResponseSchema,
  sendChatMessageRequestSchema,
  sendChatMessageResponseSchema,
  chatHistoryResponseSchema,
  createChatSessionRequestSchema,
  deleteChatSessionsRequestSchema,
} from "@logmyplate/contracts";
import type { AppRepository } from "../repositories/app-repository.js";
import { ChatAiProviderError, type ChatAiProvider } from "../services/chat-ai-provider.js";
import { MockChatAiProvider } from "../services/mock-chat-ai-provider.js";
import type { ApiConfig } from "../config.js";
import {
  NutritionistSessionStore,
  type ActiveChatSession,
} from "../services/nutritionist-session-store.js";
import {
  assembleNutritionistContext,
  type NutritionistContext,
} from "../services/nutritionist-context.js";
import { buildNutritionistSystemPrompt } from "../services/nutritionist-system-prompt.js";
import {
  generateSuggestedPrompts,
  generateFollowUpSuggestions,
} from "../services/nutritionist-suggested-prompts.js";
import { buildNutritionistWelcome } from "../services/nutritionist-welcome.js";
import type { ChatGenerateResult } from "../services/chat-ai-provider.js";
import {
  detectChatAbuse,
  ensureNonEmptyChatContent,
  CHAT_ABUSE_CLOSING_MESSAGE,
  EMPTY_CHAT_WELCOME_FALLBACK,
} from "../services/nutritionist-moderation.js";
import { createRouteTimer } from "./route-timing.js";

// Builds a short, human-readable heading for a chat session from the first
// user message (e.g. "Is paneer good after a workout?"). Falls back handled by
// the client when null.
const deriveSessionTitle = (message: string): string => {
  const normalized = message.replace(/\s+/g, " ").trim();
  const maxLength = 48;
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength).trimEnd()}…`;
};

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

    const chatSettings = await timer.measure("chatSettings", () => repository.getAiChatSettings());

    const isPremium = subscription.active;
    const effectiveMaxSessionsPerDay = isPremium
      ? (chatSettings.premiumMaxSessionsPerDay ?? chatConfig.maxSessionsPerDay)
      : (chatSettings.freeMaxSessionsPerDay ?? chatConfig.maxSessionsPerDay);

    const sessionsToday = await timer.measure("sessionCount", () =>
      repository.countChatSessionsToday(profile.id),
    );

    if (sessionsToday >= effectiveMaxSessionsPerDay) {
      if (isPremium) {
        return reply.status(429).send({
          error: "daily_session_limit_reached",
          message: "You've used all your AI Nutritionist sessions for today.",
          limit: effectiveMaxSessionsPerDay,
        });
      }
      return reply.status(403).send({
        error: "free_allowance_exhausted",
        message:
          "You've exhausted your free AI Nutritionist sessions for today. Subscribe to Premium for unlimited access.",
        limit: effectiveMaxSessionsPerDay,
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

    const websiteContent = await timer.measure("websiteContent", () =>
      repository.getAiPrompt("website_reference_content"),
    );

    const effectiveMaxTurns = chatSettings.maxTurnsPerSession;

    const systemPrompt = buildNutritionistSystemPrompt(context, basePrompt, websiteContent);
    const suggestedPrompts = generateSuggestedPrompts(context);

    // Built from the context rather than generated. The model call this
    // replaces was 37% of all chat AI spend and produced a greeting the user
    // never answered in 44% of sessions.
    const welcomeMessageContent = ensureNonEmptyChatContent(
      buildNutritionistWelcome(context),
      EMPTY_CHAT_WELCOME_FALLBACK,
    );

    const sessionDb = await timer.measure("createDbSession", () =>
      repository.createChatSession({
        profileId: profile.id,
        maxTurns: effectiveMaxTurns,
        contextSnapshot: context,
      }),
    );

    // The database row id doubles as the public session id: it is the only
    // handle that survives the in-memory store, so a request landing on a
    // different serverless instance can still find the session.
    const sessionId = sessionDb.id;

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
      maxTurns: effectiveMaxTurns,
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
        maxSessionsPerDay: effectiveMaxSessionsPerDay,
        maxTurns: effectiveMaxTurns,
      },
    });
  });

  /**
   * Rebuilds an in-memory session from Postgres.
   *
   * The store is a per-instance cache, so on serverless a session is routinely
   * absent from the instance handling a follow-up message. Everything needed to
   * continue is already persisted — the context snapshot taken at session
   * creation plus the message transcript — so a miss is recoverable rather than
   * fatal.
   *
   * Returns a reason instead of throwing so the caller can answer 404 for a
   * session that cannot be resumed and 400 for one that is simply finished.
   */
  const resumeSession = async (
    sessionId: string,
    profileId: string,
  ): Promise<
    | { ok: true; session: ActiveChatSession }
    | { ok: false; reason: "not_found" | "closed" | "expired" }
  > => {
    const stored = await repository.getResumableChatSession({ sessionId, profileId });
    if (!stored) return { ok: false, reason: "not_found" };
    if (stored.closedAt) return { ok: false, reason: "closed" };

    const createdAtMs = Date.parse(stored.createdAt);
    if (Number.isFinite(createdAtMs) && Date.now() >= createdAtMs + chatConfig.sessionTtlMs) {
      return { ok: false, reason: "expired" };
    }

    const context = stored.contextSnapshot as NutritionistContext;
    // A snapshot written by an older build (or an empty default) would produce a
    // prompt with no user data behind it. Refusing to resume is better than
    // answering from a hollow context.
    if (!context?.today || !context.weekSummary) return { ok: false, reason: "not_found" };

    const [basePrompt, websiteContent] = await Promise.all([
      repository.getAiPrompt("nutritionist_prompt"),
      repository.getAiPrompt("website_reference_content"),
    ]);

    const session: ActiveChatSession = {
      sessionId,
      profileId,
      dbSessionId: stored.id,
      context,
      messages: [
        {
          role: "system",
          content: buildNutritionistSystemPrompt(context, basePrompt, websiteContent),
        },
        ...stored.messages.filter((message) => message.role !== "system"),
      ],
      turnCount: stored.turnCount,
      // Deliberately the value stored with the session, not the current admin
      // setting: lowering the limit must not cut off conversations already
      // under way.
      maxTurns: stored.maxTurns,
      createdAt: createdAtMs,
      expiresAt: createdAtMs + chatConfig.sessionTtlMs,
    };

    sessionStore.set(session);
    return { ok: true, session };
  };

  app.post("/v1/chat/nutritionist/message", async (request, reply) => {
    const timer = createRouteTimer();

    const body = sendChatMessageRequestSchema.parse(request.body);
    const profile = await timer.measure("profile", () => repository.getProfile());

    const [subscription, sessionsUsedToday, chatSettings] = await timer.measure("usage", () =>
      Promise.all([
        repository.getSubscriptionStatus(),
        repository.countChatSessionsToday(profile.id),
        repository.getAiChatSettings(),
      ]),
    );
    const effectiveMaxSessionsPerDay = subscription.active
      ? (chatSettings.premiumMaxSessionsPerDay ?? chatConfig.maxSessionsPerDay)
      : (chatSettings.freeMaxSessionsPerDay ?? chatConfig.maxSessionsPerDay);

    let activeSession = sessionStore.get(body.sessionId);

    if (activeSession && activeSession.profileId !== profile.id) {
      // A cached session belonging to somebody else must never be writable,
      // even though the id was guessed or replayed rather than stolen.
      return reply.status(404).send({
        error: "session_not_found",
        message: "Chat session not found or expired. Start a new one.",
      });
    }

    if (!activeSession) {
      const resumed = await timer.measure("resumeSession", () =>
        resumeSession(body.sessionId, profile.id),
      );

      if (!resumed.ok) {
        if (resumed.reason === "closed") {
          return reply.status(400).send({
            error: "turn_limit_reached",
            message: "This session is complete. Start a new chat.",
          });
        }
        return reply.status(404).send({
          error: "session_not_found",
          message: "Chat session not found or expired. Start a new one.",
        });
      }

      request.log.info(
        {
          route: "POST /v1/chat/nutritionist/message",
          sessionId: resumed.session.dbSessionId,
          turnCount: resumed.session.turnCount,
        },
        "nutritionist session resumed from database",
      );
      activeSession = resumed.session;
    }

    if (activeSession.turnCount >= activeSession.maxTurns) {
      return reply.status(400).send({
        error: "turn_limit_reached",
        message: "This session is complete. Start a new chat.",
      });
    }

    const turnNumber = activeSession.turnCount + 1;

    // Held by reference so a failed turn can remove exactly this message rather
    // than popping whatever happens to be last (see the rollback below).
    const userMessage = { role: "user" as const, content: body.message };
    activeSession.messages.push(userMessage);
    activeSession.turnCount = turnNumber;

    /**
     * Undoes the optimistic state above when a turn never produces a reply.
     *
     * The message and the turn are recorded before the model is called so the
     * provider sees the full conversation. If the call then fails, the user got
     * nothing — charging them a turn would be wrong, and leaving their message
     * in history means a retry sends it to the model twice.
     */
    const rollbackTurn = () => {
      const index = activeSession.messages.lastIndexOf(userMessage);
      if (index !== -1) activeSession.messages.splice(index, 1);
      // Guarded so a concurrent turn that already advanced the count is not
      // clobbered by this rollback.
      if (activeSession.turnCount === turnNumber) {
        activeSession.turnCount = turnNumber - 1;
      }
    };

    // Profanity / abuse is caught deterministically before we spend an AI call:
    // the session is hard-ended with a firm, polite closing message.
    const isAbusive = detectChatAbuse(body.message);

    let finalAiContent: string;
    let shouldEndSession = false;
    let aiResult: ChatGenerateResult | null = null;

    if (isAbusive) {
      finalAiContent = CHAT_ABUSE_CLOSING_MESSAGE;
      shouldEndSession = true;
      request.log.warn(
        {
          route: "POST /v1/chat/nutritionist/message",
          sessionId: activeSession.dbSessionId,
          turnNumber,
        },
        "nutritionist session ended due to user abuse",
      );
    } else {
      try {
        aiResult = await timer.measure("aiResponse", () =>
          chatAiProvider.generateChatResponse({
            messages: activeSession.messages,
            maxOutputTokens: chatConfig.maxOutputTokens,
            temperature: chatConfig.temperature,
            thinkingBudget: chatConfig.thinkingBudget,
          }),
        );
      } catch (error) {
        rollbackTurn();

        const providerError = error instanceof ChatAiProviderError ? error : undefined;
        request.log.error(
          {
            err: error,
            route: "POST /v1/chat/nutritionist/message",
            sessionId: activeSession.dbSessionId,
            turnNumber,
            providerCode: providerError?.code,
            retryable: providerError?.retryable ?? true,
          },
          "nutritionist reply failed; turn rolled back",
        );

        return reply.status(providerError?.statusCode ?? 502).send({
          error: providerError?.code ?? "chat_ai_provider_error",
          message: "The nutritionist could not reply just now. Please try again.",
          retryable: providerError?.retryable ?? true,
        });
      }

      finalAiContent = aiResult.content;
      if (finalAiContent.includes("[END_SESSION]")) {
        shouldEndSession = true;
        finalAiContent = finalAiContent.replace(/\[END_SESSION\]/g, "").trim();
      }
      // Guard against an empty reply (the model returned only the [END_SESSION]
      // tag, or spent its whole output budget on thinking and produced no text)
      // which would otherwise fail contract validation. This is a degraded turn,
      // not a normal one, so it is logged loudly rather than silently swallowed.
      if (!finalAiContent.trim()) {
        request.log.warn(
          {
            route: "POST /v1/chat/nutritionist/message",
            sessionId: activeSession.dbSessionId,
            turnNumber,
            finishReason: aiResult.finishReason,
            inputTokens: aiResult.inputTokens,
            outputTokens: aiResult.outputTokens,
            maxOutputTokens: chatConfig.maxOutputTokens,
            thinkingBudget: chatConfig.thinkingBudget,
          },
          "nutritionist reply was empty; using fallback",
        );
      }
      finalAiContent = ensureNonEmptyChatContent(finalAiContent);
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

    // Name the session after its first user message.
    if (turnNumber === 1) {
      await repository.setChatSessionTitle(
        activeSession.dbSessionId,
        deriveSessionTitle(body.message),
      );
    }

    await timer.measure("persistAiMessage", () =>
      repository.appendChatMessage({
        sessionId: activeSession.dbSessionId,
        role: "assistant",
        content: finalAiContent,
        turnNumber: turnNumber,
        inputTokens: aiResult?.inputTokens,
        outputTokens: aiResult?.outputTokens,
        latencyMs: aiResult?.latencyMs,
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
        latencyMs: aiResult?.latencyMs,
        inputTokens: aiResult?.inputTokens,
        outputTokens: aiResult?.outputTokens,
        finishReason: aiResult?.finishReason,
        endedForAbuse: isAbusive,
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
        // Reported for real rather than as a placeholder 0, and against the
        // same premium-aware limit the session route enforces, so the client
        // is not told it has a full day's allowance left mid-conversation.
        sessionsUsedToday,
        maxSessionsPerDay: effectiveMaxSessionsPerDay,
      },
    });
  });

  app.get("/v1/chat/nutritionist/sessions", async (request) => {
    const profile = await repository.getProfile();
    const sessions = await repository.listChatSessions(profile.id, 20);

    return {
      sessions: sessions.map((s) => ({
        id: s.id,
        title: s.title ?? null,
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

  app.delete("/v1/chat/nutritionist/sessions", async (request, reply) => {
    const profile = await repository.getProfile();
    const body = deleteChatSessionsRequestSchema.parse(request.body ?? {});
    await repository.deleteChatSessions(profile.id, body.sessionIds);
    return reply.status(204).send();
  });
};
