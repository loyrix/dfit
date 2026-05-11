import { randomUUID } from "node:crypto";
import type { AnalyzeScanResponseContract } from "@dfit/contracts";
import { sumTotals } from "@dfit/domain";

const items: AnalyzeScanResponseContract["items"] = [
  {
    id: randomUUID(),
    name: "Dal",
    aliases: ["lentil curry", "dal tadka"],
    quantity: 1,
    unit: "katori",
    estimatedGrams: 180,
    preparation: "home",
    confidence: 0.84,
    nutrition: {
      calories: 180,
      proteinG: 10.8,
      carbsG: 25.2,
      fatG: 5.4,
      fiberG: 7.2,
      sodiumMg: 450,
    },
  },
  {
    id: randomUUID(),
    name: "Rice",
    aliases: ["chawal", "steamed rice"],
    quantity: 1,
    unit: "bowl",
    estimatedGrams: 150,
    preparation: "home",
    confidence: 0.78,
    nutrition: {
      calories: 210,
      proteinG: 4.2,
      carbsG: 45.1,
      fatG: 0.7,
      fiberG: 0.6,
      sodiumMg: 5,
    },
  },
  {
    id: randomUUID(),
    name: "Roti",
    aliases: ["chapati", "phulka"],
    quantity: 2,
    unit: "piece",
    estimatedGrams: 60,
    preparation: "home",
    confidence: 0.68,
    nutrition: {
      calories: 160,
      proteinG: 5.2,
      carbsG: 32,
      fatG: 1.6,
      fiberG: 5.8,
      sodiumMg: 190,
    },
  },
  {
    id: randomUUID(),
    name: "Sabzi",
    aliases: ["vegetable curry"],
    quantity: 1,
    unit: "katori",
    estimatedGrams: 120,
    preparation: "home",
    confidence: 0.73,
    nutrition: {
      calories: 118,
      proteinG: 3.1,
      carbsG: 16,
      fatG: 5.3,
      fiberG: 4.4,
      sodiumMg: 310,
    },
  },
];

export const analyzeWithMockProvider = (scanId: string): AnalyzeScanResponseContract => ({
  scanId,
  status: "ready_for_review",
  mealType: "lunch",
  mealName: "Dal rice, roti and sabzi",
  detectedLanguage: "en-IN",
  items,
  totals: sumTotals(items.map((item) => item.nutrition)),
});
