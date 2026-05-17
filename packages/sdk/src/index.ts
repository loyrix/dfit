import type {
  AnalyzeScanRequestContract,
  AnalyzeScanResponseContract,
  ConfirmScanResponseContract,
  ConfirmScanRequestContract,
  CreateMealRequestContract,
  JournalRangeResponseContract,
  JournalWeeksResponseContract,
  MealContract,
  PrepareScanResponseContract,
  TodayJournalResponseContract,
} from "@dfit/contracts";

export type DFitClientOptions = {
  baseUrl: string;
  getAccessToken?: () => Promise<string | undefined> | string | undefined;
};

export class DFitClient {
  constructor(private readonly options: DFitClientOptions) {}

  async today(): Promise<TodayJournalResponseContract> {
    return this.request<TodayJournalResponseContract>("/v1/journal/today");
  }

  async journalRange(days = 7, weekOffset = 0): Promise<JournalRangeResponseContract> {
    return this.request<JournalRangeResponseContract>(
      `/v1/journal/range?days=${days}&weekOffset=${weekOffset}`,
    );
  }

  async journalWeeks(): Promise<JournalWeeksResponseContract> {
    return this.request<JournalWeeksResponseContract>("/v1/journal/weeks");
  }

  async createMeal(body: CreateMealRequestContract, idempotencyKey: string): Promise<MealContract> {
    return this.request<MealContract>("/v1/meals", {
      method: "POST",
      body,
      idempotencyKey,
    });
  }

  async prepareScan(idempotencyKey: string): Promise<PrepareScanResponseContract> {
    return this.request<PrepareScanResponseContract>("/v1/scans/prepare", {
      method: "POST",
      idempotencyKey,
    });
  }

  async analyzeScan(
    scanId: string,
    idempotencyKey: string,
    body: AnalyzeScanRequestContract,
  ): Promise<AnalyzeScanResponseContract> {
    return this.request<AnalyzeScanResponseContract>(`/v1/scans/${scanId}/analyze`, {
      method: "POST",
      body,
      idempotencyKey,
    });
  }

  async confirmScan(
    scanId: string,
    body: ConfirmScanRequestContract,
    idempotencyKey: string,
  ): Promise<ConfirmScanResponseContract> {
    return this.request<ConfirmScanResponseContract>(`/v1/scans/${scanId}/confirm`, {
      method: "POST",
      body,
      idempotencyKey,
    });
  }

  private async request<T>(
    path: string,
    options: { method?: string; body?: unknown; idempotencyKey?: string } = {},
  ): Promise<T> {
    const token = await this.options.getAccessToken?.();
    const response = await fetch(`${this.options.baseUrl}${path}`, {
      method: options.method ?? "GET",
      headers: {
        "content-type": "application/json",
        ...(token ? { authorization: `Bearer ${token}` } : {}),
        ...(options.idempotencyKey ? { "idempotency-key": options.idempotencyKey } : {}),
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });

    if (!response.ok) {
      throw new Error(`DFit API request failed: ${response.status} ${await response.text()}`);
    }

    return response.json() as Promise<T>;
  }
}
