import type { Locale } from "../config";
import type { FoodPage } from "@/app/(en)/calories/food-data";
import { foods as enFoods, getFood as getEnFood } from "@/app/(en)/calories/food-data";
import { esFoods, getEsFood } from "./es/foods";
import { ptBrFoods, getPtBrFood } from "./pt-br/foods";
import type { Guide } from "@/app/(en)/guides/content";
import { guides as enGuides, getGuide as getEnGuide } from "@/app/(en)/guides/content";
import { esGuides, getEsGuide } from "./es/guides";
import { ptBrGuides, getPtBrGuide } from "./pt-br/guides";

export function getLocalizedFoods(locale: Locale): FoodPage[] {
  if (locale === "es") return esFoods;
  if (locale === "pt-br") return ptBrFoods;
  return enFoods;
}

export function getLocalizedFood(canonicalSlug: string, locale: Locale): FoodPage | undefined {
  if (locale === "es") return getEsFood(canonicalSlug) ?? getEnFood(canonicalSlug);
  if (locale === "pt-br") return getPtBrFood(canonicalSlug) ?? getEnFood(canonicalSlug);
  return getEnFood(canonicalSlug);
}

export function getLocalizedGuides(locale: Locale): Guide[] {
  if (locale === "es") return esGuides;
  if (locale === "pt-br") return ptBrGuides;
  return enGuides;
}

export function getLocalizedGuide(canonicalSlug: string, locale: Locale): Guide | undefined {
  if (locale === "es") return getEsGuide(canonicalSlug) ?? getEnGuide(canonicalSlug);
  if (locale === "pt-br") return getPtBrGuide(canonicalSlug) ?? getEnGuide(canonicalSlug);
  return getEnGuide(canonicalSlug);
}
