import {
  buildLearnedFoodCandidate,
  foodNamesAreCompatible,
  normalizeFoodText,
  type LearnedFoodCandidate,
} from "@logmyplate/domain";
import type {
  ConfirmedScanFoodLearningItem,
  LearnFoodsFromConfirmedScanInput,
} from "../repositories/app-repository.js";

export const buildConfirmedScanLearnedFoodCandidates = (
  input: LearnFoodsFromConfirmedScanInput,
): LearnedFoodCandidate[] => {
  const candidates = new Map<string, LearnedFoodCandidate>();

  input.confirmedItems.forEach((confirmedItem, index) => {
    const predictedItem = findCompatiblePrediction(input.predictedItems, confirmedItem, index);
    if (!predictedItem?.confidence) return;

    const candidate = buildLearnedFoodCandidate({
      name: confirmedItem.name,
      aliases: predictedItem.aliases,
      region: input.region,
      quantity: confirmedItem.quantity,
      unit: confirmedItem.unit,
      grams: confirmedItem.estimatedGrams,
      confidence: predictedItem.confidence,
      nutrition: confirmedItem.nutrition,
    });
    if (!candidate) return;

    const key = normalizeFoodText(candidate.canonicalName);
    const existing = candidates.get(key);
    if (!existing || candidate.portion.confidence > existing.portion.confidence) {
      candidates.set(key, candidate);
    }
  });

  return [...candidates.values()];
};

const findCompatiblePrediction = (
  predictedItems: ConfirmedScanFoodLearningItem[],
  confirmedItem: ConfirmedScanFoodLearningItem,
  index: number,
): ConfirmedScanFoodLearningItem | undefined => {
  const indexed = predictedItems[index];
  if (indexed && foodNamesAreCompatible(indexed.name, confirmedItem.name)) return indexed;
  return predictedItems.find((predictedItem) =>
    foodNamesAreCompatible(predictedItem.name, confirmedItem.name),
  );
};
