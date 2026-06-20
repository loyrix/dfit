import { z } from "zod";

export const chatMessageRoleSchema = z.enum(["user", "assistant"]);
export type ChatMessageRole = z.infer<typeof chatMessageRoleSchema>;

export const chatMessageSchema = z.object({
  role: chatMessageRoleSchema,
  content: z.string().min(1),
  createdAt: z.string().datetime({ offset: true }),
});
export type ChatMessageContract = z.infer<typeof chatMessageSchema>;

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

export const sendChatMessageRequestSchema = z.object({
  sessionId: z.string().uuid(),
  message: z.string().trim().min(1).max(1000),
});
export type SendChatMessageRequest = z.infer<typeof sendChatMessageRequestSchema>;

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

export const chatHistoryResponseSchema = z.object({
  sessionId: z.string().uuid(),
  messages: z.array(chatMessageSchema),
  turnCount: z.number().int().nonnegative(),
  maxTurns: z.number().int().positive(),
  createdAt: z.string().datetime({ offset: true }),
});
export type ChatHistoryResponse = z.infer<typeof chatHistoryResponseSchema>;

export const createChatSessionRequestSchema = z.object({
  focusMealId: z.string().optional(),
});
export type CreateChatSessionRequest = z.infer<typeof createChatSessionRequestSchema>;

export const deleteChatSessionsRequestSchema = z.object({
  sessionIds: z.array(z.string()).min(1).max(50),
});
export type DeleteChatSessionsRequest = z.infer<typeof deleteChatSessionsRequestSchema>;
