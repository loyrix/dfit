import type { Locale } from "./config";
import type { Dictionary } from "./types";
import { enDictionary } from "./dictionaries/en";
import { esDictionary } from "./dictionaries/es";
import { ptBrDictionary } from "./dictionaries/pt-br";
import { deDictionary } from "./dictionaries/de";
import { frDictionary } from "./dictionaries/fr";

const dictionaries: Record<Locale, () => Dictionary | Promise<Dictionary>> = {
  en: () => enDictionary,
  es: () => esDictionary,
  "pt-br": () => ptBrDictionary,
  de: () => deDictionary,
  fr: () => frDictionary,
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
