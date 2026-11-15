import { APP_CONFIG } from "@/config/app";

export const LOCALES = ["en", "es", "pt-br", "de", "fr", "ja"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

/**
 * List of locales currently published and built into static routes.
 * English is always active at the root.
 */
export const PUBLISHED_LOCALES: Locale[] = ["en", "es", "pt-br"];

export interface LocaleInfo {
  code: Locale;
  name: string;
  nativeName: string;
  flag: string;
  htmlLang: string;
  ogLocale: string;
  dateFormat: Intl.DateTimeFormatOptions;
}

export const LOCALE_MAP: Record<Locale, LocaleInfo> = {
  en: {
    code: "en",
    name: "English",
    nativeName: "English",
    flag: "🇺🇸",
    htmlLang: "en",
    ogLocale: "en_US",
    dateFormat: { year: "numeric", month: "long", day: "numeric" },
  },
  es: {
    code: "es",
    name: "Spanish",
    nativeName: "Español",
    flag: "🇪🇸",
    htmlLang: "es",
    ogLocale: "es_LA",
    dateFormat: { year: "numeric", month: "long", day: "numeric" },
  },
  "pt-br": {
    code: "pt-br",
    name: "Portuguese (Brazil)",
    nativeName: "Português (Brasil)",
    flag: "🇧🇷",
    htmlLang: "pt-BR",
    ogLocale: "pt_BR",
    dateFormat: { year: "numeric", month: "long", day: "numeric" },
  },
  de: {
    code: "de",
    name: "German",
    nativeName: "Deutsch",
    flag: "🇩🇪",
    htmlLang: "de",
    ogLocale: "de_DE",
    dateFormat: { year: "numeric", month: "long", day: "numeric" },
  },
  fr: {
    code: "fr",
    name: "French",
    nativeName: "Français",
    flag: "🇫🇷",
    htmlLang: "fr",
    ogLocale: "fr_FR",
    dateFormat: { year: "numeric", month: "long", day: "numeric" },
  },
  ja: {
    code: "ja",
    name: "Japanese",
    nativeName: "日本語",
    flag: "🇯🇵",
    htmlLang: "ja",
    ogLocale: "ja_JP",
    dateFormat: { year: "numeric", month: "long", day: "numeric" },
  },
};

/**
 * Route mapping table across all supported languages.
 * Keys are canonical English route identifiers.
 */
export const CORE_ROUTES = {
  home: {
    id: "home",
    en: "",
    es: "",
    "pt-br": "",
    de: "",
    fr: "",
    ja: "",
  },
  download: {
    id: "download",
    en: "download",
    es: "descargar",
    "pt-br": "baixar",
    de: "herunterladen",
    fr: "telecharger",
    ja: "download",
  },
  support: {
    id: "support",
    en: "support",
    es: "soporte",
    "pt-br": "suporte",
    de: "hilfe",
    fr: "aide",
    ja: "support",
  },
  privacy: {
    id: "privacy",
    en: "privacy",
    es: "privacidad",
    "pt-br": "privacidade",
    de: "datenschutz",
    fr: "confidentialite",
    ja: "privacy",
  },
  terms: {
    id: "terms",
    en: "terms",
    es: "terminos",
    "pt-br": "termos",
    de: "agb",
    fr: "conditions",
    ja: "terms",
  },
  dataDeletion: {
    id: "dataDeletion",
    en: "data-deletion",
    es: "eliminacion-de-datos",
    "pt-br": "exclusao-de-dados",
    de: "daten-loeschung",
    fr: "suppression-des-donnees",
    ja: "data-deletion",
  },
  caloriesIndex: {
    id: "caloriesIndex",
    en: "calories",
    es: "calorias",
    "pt-br": "calorias",
    de: "kalorien",
    fr: "calories",
    ja: "calories",
  },
  guidesIndex: {
    id: "guidesIndex",
    en: "guides",
    es: "guias",
    "pt-br": "guias",
    de: "ratgeber",
    fr: "guides",
    ja: "guides",
  },
} as const;

export type CoreRouteKey = keyof typeof CORE_ROUTES;

/**
 * Calorie Food slug mapping table across languages.
 */
export const FOOD_SLUGS: Record<string, Record<Locale, string>> = {
  roti: { en: "roti", es: "roti", "pt-br": "roti", de: "roti", fr: "roti", ja: "roti" },
  dal: { en: "dal", es: "dal", "pt-br": "dal", de: "dal", fr: "dal", ja: "dal" },
  rice: { en: "rice", es: "arroz", "pt-br": "arroz", de: "reis", fr: "riz", ja: "rice" },
  paneer: { en: "paneer", es: "paneer", "pt-br": "paneer", de: "paneer", fr: "paneer", ja: "paneer" },
  idli: { en: "idli", es: "idli", "pt-br": "idli", de: "idli", fr: "idli", ja: "idli" },
  paratha: { en: "paratha", es: "paratha", "pt-br": "paratha", de: "paratha", fr: "paratha", ja: "paratha" },
};

/**
 * Guides / blog post slug mapping table across languages.
 * Follows section 8 rules: localized Latin slugs for es, pt-BR, de, fr; short romanized slugs for ja.
 */
export const GUIDE_SLUGS: Record<string, Record<Locale, string>> = {
  "ai-calorie-tracker-india": {
    en: "ai-calorie-tracker-india",
    es: "contador-calorias-ia-india",
    "pt-br": "contador-calorias-ia-india",
    de: "ki-kalorientracker-indien",
    fr: "compteur-calories-ia-inde",
    ja: "ai-calorie-tracker-india",
  },
  "indian-food-calorie-tracker": {
    en: "indian-food-calorie-tracker",
    es: "contador-calorias-comida-india",
    "pt-br": "contador-calorias-comida-indiana",
    de: "indisches-essen-kalorientracker",
    fr: "compteur-calories-cuisine-indienne",
    ja: "indian-food-calorie-tracker",
  },
  "photo-food-journal": {
    en: "photo-food-journal",
    es: "diario-de-comidas-con-fotos",
    "pt-br": "diario-alimentar-por-foto",
    de: "foto-ernaehrungstagebuch",
    fr: "journal-alimentaire-photo",
    ja: "photo-food-journal",
  },
  "calorie-tracker-without-barcodes": {
    en: "calorie-tracker-without-barcodes",
    es: "contador-calorias-sin-codigo-de-barras",
    "pt-br": "contador-calorias-sem-codigo-de-barras",
    de: "kalorientracker-ohne-barcode",
    fr: "compteur-calories-sans-code-barres",
    ja: "calorie-tracker-without-barcodes",
  },
  "meal-photo-tips": {
    en: "meal-photo-tips",
    es: "consejos-fotos-de-comida",
    "pt-br": "dicas-fotos-de-comida",
    de: "tipps-fuer-essensfotos",
    fr: "conseils-photos-de-repas",
    ja: "meal-photo-tips",
  },
  "ai-calorie-tracker-for-weight-loss": {
    en: "ai-calorie-tracker-for-weight-loss",
    es: "contador-calorias-ia-para-perder-peso",
    "pt-br": "contador-calorias-ia-para-perder-peso",
    de: "ki-kalorientracker-zum-abnehmen",
    fr: "compteur-calories-ia-perte-de-poids",
    ja: "ai-calorie-tracker-weight-loss",
  },
  "calorie-tracking-for-home-cooked-food": {
    en: "calorie-tracking-for-home-cooked-food",
    es: "contar-calorias-comida-casera",
    "pt-br": "contar-calorias-comida-caseira",
    de: "kalorien-zaehlen-selbstgekochtes-essen",
    fr: "compter-calories-plats-maison",
    ja: "calorie-tracking-home-cooked-food",
  },
  "macro-tracking-with-food-photos": {
    en: "macro-tracking-with-food-photos",
    es: "control-de-macros-con-fotos",
    "pt-br": "contagem-de-macros-por-foto",
    de: "makros-tracken-mit-essensfotos",
    fr: "suivi-des-macros-avec-photos",
    ja: "macro-tracking-food-photos",
  },
  "calorie-estimate-vs-nutrition-label": {
    en: "calorie-estimate-vs-nutrition-label",
    es: "estimacion-calorias-vs-etiqueta-nutricional",
    "pt-br": "estimativa-calorias-vs-tabela-nutricional",
    de: "kalorienschaetzung-vs-naehrwerttabelle",
    fr: "estimation-calories-vs-tableau-nutritionnel",
    ja: "calorie-estimate-vs-nutrition-label",
  },
  "best-calorie-tracker-for-indian-food": {
    en: "best-calorie-tracker-for-indian-food",
    es: "mejor-contador-calorias-comida-india",
    "pt-br": "melhor-contador-calorias-comida-indiana",
    de: "bester-kalorientracker-fuer-indisches-essen",
    fr: "meilleur-compteur-calories-cuisine-indienne",
    ja: "best-calorie-tracker-indian-food",
  },
  "how-to-track-misal-pav-calories": {
    en: "how-to-track-misal-pav-calories",
    es: "como-contar-calorias-del-misal-pav",
    "pt-br": "como-contar-calorias-do-misal-pav",
    de: "kalorien-in-misal-pav-zaehlen",
    fr: "comment-compter-calories-misal-pav",
    ja: "how-to-track-misal-pav-calories",
  },
  "daily-calorie-target-bmi-guide": {
    en: "daily-calorie-target-bmi-guide",
    es: "guia-meta-calorica-diaria-imc",
    "pt-br": "guia-meta-calorica-diaria-imc",
    de: "taegliches-kalorienziel-bmi-leitfaden",
    fr: "guide-objectif-calorique-journalier-imc",
    ja: "daily-calorie-target-bmi-guide",
  },
  "food-journal-for-busy-professionals": {
    en: "food-journal-for-busy-professionals",
    es: "diario-alimentario-para-profesionales-ocupados",
    "pt-br": "diario-alimentar-para-profissionais-ocupados",
    de: "ernaehrungstagebuch-fuer-vielbeschaeftigte",
    fr: "journal-alimentaire-pour-professionnels-occupes",
    ja: "food-journal-busy-professionals",
  },
  "privacy-first-calorie-tracking": {
    en: "privacy-first-calorie-tracking",
    es: "registro-de-calorias-con-privacidad-primero",
    "pt-br": "contador-de-calorias-com-foco-em-privacidade",
    de: "datenschutz-beim-kalorientracking",
    fr: "compteur-de-calories-axe-sur-la-confidentialite",
    ja: "privacy-first-calorie-tracking",
  },
  "rewarded-ads-free-scans-calorie-tracker": {
    en: "rewarded-ads-free-scans-calorie-tracker",
    es: "escaneos-gratis-con-anuncios-recompensados",
    "pt-br": "scans-gratuitos-com-anuncios-premiados",
    de: "kostenlose-scans-durch-belohnungsvideos",
    fr: "scans-gratuits-grace-aux-publicites-recompensees",
    ja: "rewarded-ads-free-scans-calorie-tracker",
  },
  "calorie-tracking-for-vegetarian-meals": {
    en: "calorie-tracking-for-vegetarian-meals",
    es: "contador-calorias-comida-vegetariana",
    "pt-br": "contagem-calorias-comida-vegetariana",
    de: "kalorientracking-fuer-vegetarische-gerichte",
    fr: "compteur-calories-repas-vegetariens",
    ja: "calorie-tracking-vegetarian-meals",
  },
  "restaurant-meal-calorie-tracking": {
    en: "restaurant-meal-calorie-tracking",
    es: "como-contar-calorias-en-restaurantes",
    "pt-br": "como-contar-calorias-em-restaurantes",
    de: "kalorien-im-restaurant-tracken",
    fr: "comment-compter-calories-au-restaurant",
    ja: "restaurant-meal-calorie-tracking",
  },
  "meal-tracking-for-gym-and-fitness": {
    en: "meal-tracking-for-gym-and-fitness",
    es: "registro-de-comidas-para-el-gimnasio-y-fitness",
    "pt-br": "registro-alimentar-para-treino-e-academia",
    de: "mahlzeiten-tracken-fuer-fitness-und-gym",
    fr: "suivi-des-repas-pour-la-musculation-et-fitness",
    ja: "meal-tracking-gym-and-fitness",
  },
};

/**
 * Returns the full localized URL for a canonical route and locale.
 */
export function getLocalizedUrl(path: string, locale: Locale): string {
  const base = APP_CONFIG.websiteUrl;
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;

  if (locale === "en") {
    return cleanPath ? `${base}/${cleanPath}` : base;
  }

  // Handle core routes
  for (const route of Object.values(CORE_ROUTES)) {
    if (route.en === cleanPath) {
      const localizedSegment = route[locale];
      return localizedSegment ? `${base}/${locale}/${localizedSegment}` : `${base}/${locale}`;
    }
  }

  // Handle calories/[foodSlug]
  if (cleanPath.startsWith("calories/")) {
    const foodId = cleanPath.replace("calories/", "");
    const localizedFood = FOOD_SLUGS[foodId]?.[locale] ?? foodId;
    const caloriesPrefix = CORE_ROUTES.caloriesIndex[locale];
    return `${base}/${locale}/${caloriesPrefix}/${localizedFood}`;
  }

  // Handle guides/[guideSlug]
  if (cleanPath.startsWith("guides/")) {
    const guideId = cleanPath.replace("guides/", "");
    const localizedGuide = GUIDE_SLUGS[guideId]?.[locale] ?? guideId;
    const guidesPrefix = CORE_ROUTES.guidesIndex[locale];
    return `${base}/${locale}/${guidesPrefix}/${localizedGuide}`;
  }

  return cleanPath ? `${base}/${locale}/${cleanPath}` : `${base}/${locale}`;
}

/**
 * Returns the relative localized pathname (e.g. "/es/calorias" or "/calories").
 */
export function getRelativeLocalizedUrl(path: string, locale: Locale): string {
  const fullUrl = getLocalizedUrl(path, locale);
  const relative = fullUrl.replace(APP_CONFIG.websiteUrl, "");
  return relative.startsWith("/") ? relative : `/${relative}`;
}

/**
 * Given any path (English or localized), resolves its matching page in targetLocale.
 */
export function resolveMatchingPath(currentPath: string, targetLocale: Locale): string {
  // Normalize path without trailing slash
  let path = currentPath.split("?")[0].split("#")[0];
  if (path.length > 1 && path.endsWith("/")) {
    path = path.slice(0, -1);
  }

  // Detect if current path has a locale prefix
  let currentLocale: Locale = "en";
  let restPath = path.startsWith("/") ? path.slice(1) : path;

  for (const loc of LOCALES) {
    if (loc === "en") continue;
    if (restPath === loc || restPath.startsWith(`${loc}/`)) {
      currentLocale = loc;
      restPath = restPath.slice(loc.length);
      if (restPath.startsWith("/")) restPath = restPath.slice(1);
      break;
    }
  }

  // Resolve canonical route ID from restPath + currentLocale
  let canonicalPath = "";

  if (!restPath) {
    canonicalPath = "";
  } else {
    // Check core routes
    let matchedCore = false;
    for (const route of Object.values(CORE_ROUTES)) {
      if (route[currentLocale] === restPath) {
        canonicalPath = route.en;
        matchedCore = true;
        break;
      }
    }

    if (!matchedCore) {
      const parts = restPath.split("/");
      const currentCaloriesPrefix = CORE_ROUTES.caloriesIndex[currentLocale];
      const currentGuidesPrefix = CORE_ROUTES.guidesIndex[currentLocale];

      if (parts[0] === currentCaloriesPrefix && parts[1]) {
        // Resolve food ID
        const currentSlug = parts[1];
        let foundFoodId = currentSlug;
        for (const [id, slugs] of Object.entries(FOOD_SLUGS)) {
          if (slugs[currentLocale] === currentSlug) {
            foundFoodId = id;
            break;
          }
        }
        canonicalPath = `calories/${foundFoodId}`;
      } else if (parts[0] === currentGuidesPrefix && parts[1]) {
        // Resolve guide ID
        const currentSlug = parts[1];
        let foundGuideId = currentSlug;
        for (const [id, slugs] of Object.entries(GUIDE_SLUGS)) {
          if (slugs[currentLocale] === currentSlug) {
            foundGuideId = id;
            break;
          }
        }
        canonicalPath = `guides/${foundGuideId}`;
      } else {
        canonicalPath = restPath;
      }
    }
  }

  // Now convert canonicalPath to targetLocale
  if (targetLocale === "en") {
    return canonicalPath ? `/${canonicalPath}` : "/";
  }

  // Target is non-English
  if (!canonicalPath) {
    return `/${targetLocale}`;
  }

  for (const route of Object.values(CORE_ROUTES)) {
    if (route.en === canonicalPath) {
      const seg = route[targetLocale];
      return seg ? `/${targetLocale}/${seg}` : `/${targetLocale}`;
    }
  }

  if (canonicalPath.startsWith("calories/")) {
    const foodId = canonicalPath.replace("calories/", "");
    const targetFood = FOOD_SLUGS[foodId]?.[targetLocale] ?? foodId;
    const targetPrefix = CORE_ROUTES.caloriesIndex[targetLocale];
    return `/${targetLocale}/${targetPrefix}/${targetFood}`;
  }

  if (canonicalPath.startsWith("guides/")) {
    const guideId = canonicalPath.replace("guides/", "");
    const targetGuide = GUIDE_SLUGS[guideId]?.[targetLocale] ?? guideId;
    const targetPrefix = CORE_ROUTES.guidesIndex[targetLocale];
    return `/${targetLocale}/${targetPrefix}/${targetGuide}`;
  }

  return `/${targetLocale}/${canonicalPath}`;
}

/**
 * Returns reciprocal hreflang alternates and self-referencing canonical for metadata.
 * English at root serves as both 'en' and 'x-default'.
 */
export function getAlternateMetadata(
  canonicalEnglishPath: string,
  currentLocale: Locale,
  activeLocales: Locale[] = PUBLISHED_LOCALES,
) {
  const languages: Record<string, string> = {};

  for (const loc of activeLocales) {
    languages[LOCALE_MAP[loc].htmlLang] = getLocalizedUrl(canonicalEnglishPath, loc);
  }

  // x-default always points to the English root URL
  languages["x-default"] = getLocalizedUrl(canonicalEnglishPath, "en");

  return {
    canonical: getLocalizedUrl(canonicalEnglishPath, currentLocale),
    languages,
  };
}

/**
 * Locale-aware number formatter (e.g. 1.250,5 in DE; 1,250.5 in EN).
 */
export function formatNumber(
  value: number,
  locale: Locale,
  options?: Intl.NumberFormatOptions,
): string {
  const tag = LOCALE_MAP[locale].htmlLang;
  return new Intl.NumberFormat(tag, options).format(value);
}

/**
 * Locale-aware date formatter (e.g. 2026年5月24日 in JA; 24. Mai 2026 in DE).
 */
export function formatDate(
  dateInput: string | Date,
  locale: Locale,
  options?: Intl.DateTimeFormatOptions,
): string {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  const tag = LOCALE_MAP[locale].htmlLang;
  const opts = options ?? LOCALE_MAP[locale].dateFormat;
  return new Intl.DateTimeFormat(tag, opts).format(date);
}

/**
 * Unit formatter for grams (g).
 */
export function formatGrams(grams: number, locale: Locale): string {
  return `${formatNumber(grams, locale)} g`;
}

/**
 * Unit formatter for calories (kcal).
 */
export function formatCalories(kcal: number, locale: Locale): string {
  return `${formatNumber(kcal, locale)} kcal`;
}
