import {
  parseOpenFoodFactsProduct,
  type FoodRecord,
  type OpenFoodFactsRawResponse,
} from "@logmyplate/domain";

export interface BarcodeFoodProvider {
  lookupBarcode(barcode: string): Promise<FoodRecord | undefined>;
}

export type OpenFoodFactsBarcodeProviderOptions = {
  baseUrl?: string;
  userAgent?: string;
  timeoutMs?: number;
};

export class OpenFoodFactsBarcodeProvider implements BarcodeFoodProvider {
  private readonly baseUrl: string;
  private readonly userAgent: string;
  private readonly timeoutMs: number;

  constructor(options: OpenFoodFactsBarcodeProviderOptions = {}) {
    this.baseUrl = options.baseUrl ?? "https://world.openfoodfacts.org/api/v2/product";
    this.userAgent = options.userAgent ?? "LogMyPlate/1.0.2 - support@logmyplate.com";
    this.timeoutMs = options.timeoutMs ?? 5000;
  }

  async lookupBarcode(barcode: string): Promise<FoodRecord | undefined> {
    const cleanBarcode = barcode.trim();
    if (!cleanBarcode || cleanBarcode.length < 8) {
      return undefined;
    }

    const url = `${this.baseUrl}/${encodeURIComponent(cleanBarcode)}.json`;

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "User-Agent": this.userAgent,
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(this.timeoutMs),
      });

      if (!response.ok) {
        return undefined;
      }

      const data = (await response.json()) as OpenFoodFactsRawResponse;
      return parseOpenFoodFactsProduct(cleanBarcode, data);
    } catch {
      return undefined;
    }
  }
}

export class MockBarcodeFoodProvider implements BarcodeFoodProvider {
  constructor(private readonly foods: Map<string, FoodRecord> = new Map()) {}

  setProduct(barcode: string, food: FoodRecord | undefined): void {
    if (food) {
      this.foods.set(barcode, food);
    } else {
      this.foods.delete(barcode);
    }
  }

  async lookupBarcode(barcode: string): Promise<FoodRecord | undefined> {
    return this.foods.get(barcode.trim());
  }
}
