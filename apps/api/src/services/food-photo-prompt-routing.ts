export const foodPhotoPromptKey = "food_photo";
export const indiaFoodPhotoPromptKey = "food_photo_IN";
export const globalFoodPhotoPromptKey = "food_photo_GLOBAL";

export const foodPhotoPromptKeys = [
  foodPhotoPromptKey,
  indiaFoodPhotoPromptKey,
  globalFoodPhotoPromptKey,
] as const;

export type FoodPhotoPromptKey = (typeof foodPhotoPromptKeys)[number];

export const resolveFoodPhotoPromptKey = ({
  region,
  locale,
}: {
  region?: string;
  locale?: string;
}): FoodPhotoPromptKey => {
  const normalizedRegion = normalizeRegion(region);
  if (normalizedRegion === "IN") return indiaFoodPhotoPromptKey;

  const localeRegion = normalizeRegion(readLocaleRegion(locale));
  if (localeRegion === "IN") return indiaFoodPhotoPromptKey;

  if (normalizedRegion || localeRegion) return globalFoodPhotoPromptKey;

  return foodPhotoPromptKey;
};

const normalizeRegion = (value?: string) => {
  const normalized = value?.trim().toUpperCase();
  return normalized && /^[A-Z]{2}$/.test(normalized) ? normalized : undefined;
};

const readLocaleRegion = (locale?: string) => {
  if (!locale) return undefined;
  const match = locale.trim().match(/[-_]([A-Za-z]{2})(?:$|[-_])/);
  return match?.[1];
};
