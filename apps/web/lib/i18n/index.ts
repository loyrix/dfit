import type { Locale } from "./config";
import type { Dictionary } from "./types";
import { enDictionary } from "./dictionaries/en";

const dictionaries: Record<Locale, () => Dictionary | Promise<Dictionary>> = {
  en: () => enDictionary,
  es: () => enDictionary, // Will load es dictionary once implemented in Phase 3
  "pt-br": () => enDictionary, // Will load pt-br dictionary in Phase 3
  de: () => enDictionary, // Will load de dictionary in Phase 3
  fr: () => enDictionary, // Will load fr dictionary in Phase 3
  ja: () => enDictionary, // Will load ja dictionary in Phase 3
};

export function getDictionary(locale: Locale): Dictionary {
  // Synchronous resolution where possible, or fallback to English
  const loader = dictionaries[locale] ?? dictionaries.en;
  const result = loader();
  return result instanceof Promise ? enDictionary : result;
}

export * from "./config";
export * from "./types";
export * from "./glossary";
