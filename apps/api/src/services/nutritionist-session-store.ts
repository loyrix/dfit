import type { NutritionistContext } from "./nutritionist-context.js";

export type ActiveChatSession = {
  sessionId: string;
  profileId: string;
  dbSessionId: string;
  context: NutritionistContext;
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  turnCount: number;
  maxTurns: number;
  createdAt: number;
  expiresAt: number;
};

export class NutritionistSessionStore {
  private sessions = new Map<string, ActiveChatSession>();
  private cleanupInterval?: ReturnType<typeof setInterval>;

  constructor() {
    this.cleanupInterval = setInterval(() => this.cleanup(), 60_000);
    this.cleanupInterval.unref();
  }

  get(sessionId: string): ActiveChatSession | undefined {
    const session = this.sessions.get(sessionId);
    if (!session) return undefined;
    if (Date.now() >= session.expiresAt) {
      this.sessions.delete(sessionId);
      return undefined;
    }
    return session;
  }

  set(session: ActiveChatSession): void {
    this.sessions.set(session.sessionId, session);
  }

  delete(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  cleanup(): void {
    const now = Date.now();
    for (const [id, session] of this.sessions) {
      if (now >= session.expiresAt) {
        this.sessions.delete(id);
      }
    }
  }

  dispose(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.sessions.clear();
  }
}
