import type { ApiConfig } from "../config.js";
import type { SqlClient } from "../db/client.js";
import {
  AiProviderError,
  type AiProvider,
  type AnalyzeMealImageInput,
  type AnalyzeMealImageResult,
} from "./ai-provider.js";
import { foodPhotoPromptKey } from "./food-photo-prompt-routing.js";
import { VertexAiProvider } from "./vertex-ai-provider.js";

type AiModelConfigRow = {
  key: string;
  model_family: string;
  model: string;
  max_output_tokens: number | string;
  temperature: number | string;
  top_p: number | string;
};

type AiPromptVersionRow = {
  key: string;
  version: string;
  body: string;
};

type RuntimeVertexSettings = {
  modelFamily: string;
  model: string;
  maxOutputTokens: number;
  temperature: number;
  topP: number;
  promptVersion?: string;
  promptTemplate?: string;
};

export class RuntimeVertexAiProvider implements AiProvider {
  constructor(
    private readonly config: ApiConfig["vertex"],
    private readonly sql: SqlClient,
  ) {}

  async analyzeMealImage(input: AnalyzeMealImageInput): Promise<AnalyzeMealImageResult> {
    const runtime = await this.loadSettings(input.promptKey);

    if (runtime.modelFamily !== "gemini") {
      throw new AiProviderError(
        "ai_model_family_not_supported",
        `Vertex model family "${runtime.modelFamily}" is configured but not supported by the scan adapter yet.`,
        503,
        false,
      );
    }

    return new VertexAiProvider({
      ...this.config,
      model: runtime.model,
      maxOutputTokens: runtime.maxOutputTokens,
      temperature: runtime.temperature,
      topP: runtime.topP,
      promptTemplate: runtime.promptTemplate,
      promptVersion: runtime.promptVersion,
    }).analyzeMealImage(input);
  }

  private async loadSettings(promptKey = foodPhotoPromptKey): Promise<RuntimeVertexSettings> {
    const [model] = await this.sql<AiModelConfigRow[]>`
      select
        key,
        model_family,
        model,
        max_output_tokens,
        temperature,
        top_p
      from ai_model_configs
      where platform = 'vertex'
        and enabled
        and is_default
      order by updated_at desc
      limit 1
    `;

    const [prompt] = await this.sql<AiPromptVersionRow[]>`
      select key, version, body
      from ai_prompt_versions
      where (key = ${promptKey} or key = ${foodPhotoPromptKey})
        and status = 'published'
        and is_active
      order by
        case when key = ${promptKey} then 0 else 1 end,
        updated_at desc
      limit 1
    `;

    return {
      modelFamily: model?.model_family ?? "gemini",
      model: model?.model ?? this.config.model,
      maxOutputTokens: numberOrFallback(model?.max_output_tokens, this.config.maxOutputTokens),
      temperature: numberOrFallback(model?.temperature, 0.1),
      topP: numberOrFallback(model?.top_p, 0.8),
      promptVersion: prompt ? `${prompt.key}:${prompt.version}` : undefined,
      promptTemplate: prompt?.body,
    };
  }
}

const numberOrFallback = (value: number | string | undefined, fallback: number) => {
  const parsed = Number(value ?? fallback);
  return Number.isFinite(parsed) ? parsed : fallback;
};
