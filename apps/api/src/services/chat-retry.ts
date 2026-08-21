import { ChatAiProviderError } from "./chat-ai-provider.js";

/**
 * Backoff between chat retry attempts. Deliberately short: a person is watching
 * a spinner, so the delays only need to clear a brief upstream blip.
 */
export const CHAT_RETRY_DELAYS_MS = [400, 1_200] as const;

export type ChatRetryOptions = {
  /**
   * Total wall-clock budget for all attempts combined. Set to the provider's
   * own request timeout so retries never make a turn slower than a single
   * attempt already was — a fast failure leaves almost the whole budget for a
   * second try, while an attempt that burns the budget simply gives up.
   */
  totalBudgetMs: number;
  delaysMs?: readonly number[];
  sleepFn?: (ms: number) => Promise<void>;
};

const defaultSleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const isRetryableChatError = (error: unknown): boolean =>
  error instanceof ChatAiProviderError ? error.retryable : true;

/**
 * Runs a chat generation with bounded retries.
 *
 * `run` receives the milliseconds remaining in the budget and is expected to
 * abort by then, so the caller never overshoots `totalBudgetMs` no matter how
 * many attempts it takes.
 */
export const withChatRetries = async <T>(
  run: (remainingMs: number) => Promise<T>,
  options: ChatRetryOptions,
): Promise<T> => {
  const deadline = Date.now() + options.totalBudgetMs;
  const delays = options.delaysMs ?? CHAT_RETRY_DELAYS_MS;
  const sleep = options.sleepFn ?? defaultSleep;

  for (let attempt = 0; ; attempt += 1) {
    const remaining = deadline - Date.now();
    if (remaining <= 0) {
      throw new ChatAiProviderError(
        "chat_ai_provider_timeout",
        "The nutritionist took too long to reply.",
        504,
        true,
      );
    }

    try {
      return await run(remaining);
    } catch (error) {
      const delay = delays[attempt];
      // Out of attempts, not worth retrying, or not enough budget left for the
      // backoff plus a meaningful second try.
      if (delay === undefined || !isRetryableChatError(error)) throw error;
      if (deadline - Date.now() <= delay) throw error;

      await sleep(delay);
    }
  }
};
