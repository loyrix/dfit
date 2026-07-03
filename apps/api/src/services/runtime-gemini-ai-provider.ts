import type { ApiConfig } from "../config.js";
import type { SqlClient } from "../db/client.js";
import { loadAiScanConfig } from "./ai-scan-config.js";
import type { AiProvider, AnalyzeMealImageInput, AnalyzeMealImageResult } from "./ai-provider.js";
import { GeminiAiProvider } from "./gemini-ai-provider.js";

/**
 * Gemini scan provider that honours the admin-editable ai_scan_config runtime
 * settings (currently the thinking budget). Falls back to the env-configured
 * value when no runtime row exists or the lookup fails, so a database blip
 * never blocks a scan.
 */
export class RuntimeGeminiAiProvider implements AiProvider {
  constructor(
    private readonly config: ApiConfig["gemini"],
    private readonly sql: SqlClient,
  ) {}

  async analyzeMealImage(input: AnalyzeMealImageInput): Promise<AnalyzeMealImageResult> {
    const runtime = await loadAiScanConfig(this.sql).catch(() => undefined);

    return new GeminiAiProvider({
      apiKey: this.config.apiKey,
      model: this.config.model,
      endpoint: this.config.endpoint,
      timeoutMs: this.config.timeoutMs,
      thinkingBudget: runtime?.thinkingBudget ?? this.config.thinkingBudget,
    }).analyzeMealImage(input);
  }
}
