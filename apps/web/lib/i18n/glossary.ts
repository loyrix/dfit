import type { Locale } from "./config";

export interface GlossaryEntry {
  term: string;
  category: "nutrition" | "portions" | "features" | "goals" | "cuisines" | "legal";
  definition: string;
  translations: Record<Exclude<Locale, "en">, string>;
  notes?: string;
}

/**
 * LogMyPlate Unified Multilingual Nutrition & Product Glossary.
 * Pre-validated for consistent use across all localized pages, guides, metadata, and templates.
 *
 * Market alignments checked:
 * - Spanish (es): Neutral Latin American Spanish (MyFitnessPal / Yazio LatAm standard).
 * - Portuguese (pt-BR): Brazilian Portuguese standard.
 * - German (de): Informal "du" address, metric nutrition standards (DGE / Yazio DE).
 * - French (fr): Formal "vous" address, standard nutritional vocabulary (ANSES / Yazio FR).
 * - Japanese (ja): Polite です/ます register, standard Japanese nutritional terminology (MHLW).
 */
export const GLOSSARY: GlossaryEntry[] = [
  // ── Nutrition ─────────────────────────────────────────────────────────────
  {
    term: "calorie / calories",
    category: "nutrition",
    definition: "Unit of food energy (kcal).",
    translations: {
      es: "caloría / calorías",
      "pt-br": "caloria / calorias",
      de: "Kalorie / Kalorien",
      fr: "calorie / calories",
      ja: "カロリー",
    },
    notes: "Abbreviation 'kcal' remains untranslated in all languages.",
  },
  {
    term: "macros / macronutrients",
    category: "nutrition",
    definition: "Carbohydrates, protein, and fat.",
    translations: {
      es: "macros / macronutrientes",
      "pt-br": "macros / macronutrientes",
      de: "Makros / Makronährstoffe",
      fr: "macros / macronutriments",
      ja: "マクロ栄養素 / マクロ",
    },
    notes: "'Macros' / 'Makros' is widely accepted by gym and fitness audiences in all European languages.",
  },
  {
    term: "protein",
    category: "nutrition",
    definition: "Macronutrient essential for muscle and tissue repair.",
    translations: {
      es: "proteína / proteínas",
      "pt-br": "proteína / proteínas",
      de: "Protein / Eiweiß",
      fr: "protéines",
      ja: "タンパク質",
    },
    notes: "In German fitness context, 'Protein' is preferred over older 'Eiweiß'.",
  },
  {
    term: "carbohydrates / carbs",
    category: "nutrition",
    definition: "Macronutrient providing fast energy.",
    translations: {
      es: "carbohidratos / carbohidratos",
      "pt-br": "carboidratos / carboidratos",
      de: "Kohlenhydrate",
      fr: "glucides / glucides",
      ja: "炭水化物 / 糖質",
    },
    notes: "In French nutrition labels, 'glucides' is the standard term. In Japanese, 炭水化物 is total carbs, 糖質 is net carbs.",
  },
  {
    term: "fat / fats",
    category: "nutrition",
    definition: "Macronutrient yielding 9 kcal per gram.",
    translations: {
      es: "grasa / grasas",
      "pt-br": "gordura / gorduras",
      de: "Fett / Fette",
      fr: "lipides / graisses",
      ja: "脂質",
    },
    notes: "In French nutrition panels, 'lipides' is standard; 'graisses' is conversational.",
  },
  {
    term: "fiber / dietary fiber",
    category: "nutrition",
    definition: "Non-digestible carbohydrate supporting digestion.",
    translations: {
      es: "fibra / fibra dietética",
      "pt-br": "fibra / fibras alimentares",
      de: "Ballaststoffe",
      fr: "fibres / fibres alimentaires",
      ja: "食物繊維",
    },
    notes: "German 'Ballaststoffe' is the invariable technical and consumer term.",
  },
  {
    term: "sugar / sugars",
    category: "nutrition",
    definition: "Simple sweet carbohydrates.",
    translations: {
      es: "azúcar / azúcares",
      "pt-br": "açúcar / açúcares",
      de: "Zucker",
      fr: "sucre / sucres",
      ja: "糖類 / 砂糖",
    },
  },
  {
    term: "sodium / salt",
    category: "nutrition",
    definition: "Mineral component of salt (mg).",
    translations: {
      es: "sodio / sal",
      "pt-br": "sódio / sal",
      de: "Natrium / Salz",
      fr: "sodium / sel",
      ja: "ナトリウム / 食塩相当量",
    },
  },
  {
    term: "energy density",
    category: "nutrition",
    definition: "Amount of calories per 100 grams of food.",
    translations: {
      es: "densidad energética",
      "pt-br": "densidade energética",
      de: "Energiedichte",
      fr: "densité énergétique",
      ja: "エネルギー密度",
    },
  },

  // ── Portions & Units ───────────────────────────────────────────────────────
  {
    term: "serving / portion",
    category: "portions",
    definition: "Amount of food eaten at one sitting.",
    translations: {
      es: "porción / ración",
      "pt-br": "porção",
      de: "Portion",
      fr: "portion",
      ja: "1人前 / ポーション",
    },
  },
  {
    term: "serving size",
    category: "portions",
    definition: "Standardized quantity or weight.",
    translations: {
      es: "tamaño de la porción",
      "pt-br": "tamanho da porção",
      de: "Portionsgröße",
      fr: "taille de la portion",
      ja: "1食分の目安量",
    },
  },
  {
    term: "grams (g)",
    category: "portions",
    definition: "Metric unit of weight.",
    translations: {
      es: "gramos (g)",
      "pt-br": "gramas (g)",
      de: "Gramm (g)",
      fr: "grammes (g)",
      ja: "グラム (g)",
    },
  },

  // ── Product & App Features ─────────────────────────────────────────────────
  {
    term: "LogMyPlate",
    category: "features",
    definition: "Brand name of the application.",
    translations: {
      es: "LogMyPlate",
      "pt-br": "LogMyPlate",
      de: "LogMyPlate",
      fr: "LogMyPlate",
      ja: "LogMyPlate",
    },
    notes: "BRAND NAME RULE: Never translated, never transliterated.",
  },
  {
    term: "AI Calorie Tracker",
    category: "features",
    definition: "App category descriptor.",
    translations: {
      es: "Contador de calorías con IA",
      "pt-br": "Contador de calorias com IA",
      de: "KI-Kalorientracker",
      fr: "Compteur de calories par IA",
      ja: "AIカロリートラッカー",
    },
    notes: "German uses 'KI' for Artificial Intelligence; Romance languages use 'IA'.",
  },
  {
    term: "meal log / food journal",
    category: "features",
    definition: "Daily record of food eaten.",
    translations: {
      es: "diario de comidas / registro de alimentos",
      "pt-br": "diário alimentar / registro de refeições",
      de: "Ernährungstagebuch",
      fr: "journal alimentaire",
      ja: "食事記録 / フードジャーナル",
    },
  },
  {
    term: "AI Nutritionist",
    category: "features",
    definition: "Conversational coach feature.",
    translations: {
      es: "Nutricionista con IA",
      "pt-br": "Nutricionista com IA",
      de: "KI-Ernährungsberater",
      fr: "Nutritionniste IA",
      ja: "AI栄養アドバイザー",
    },
  },
  {
    term: "scan / analyzing",
    category: "features",
    definition: "Camera photo capture and AI parsing step.",
    translations: {
      es: "escanear / analizando",
      "pt-br": "escanear / analisando",
      de: "scannen / analysieren",
      fr: "scanner / analyse en cours",
      ja: "スキャン / 解析中",
    },
  },
  {
    term: "barcode scanner",
    category: "features",
    definition: "Traditional UPC/EAN code lookup.",
    translations: {
      es: "escáner de código de barras",
      "pt-br": "leitor de código de barras",
      de: "Barcode-Scanner",
      fr: "scanner de code-barres",
      ja: "バーコードスキャナー",
    },
  },
  {
    term: "no barcode required",
    category: "features",
    definition: "Core value proposition.",
    translations: {
      es: "Sin necesidad de código de barras",
      "pt-br": "Sem necessidade de código de barras",
      de: "Kein Barcode erforderlich",
      fr: "Aucun code-barres requis",
      ja: "バーコード不要",
    },
  },
  {
    term: "rewarded ad",
    category: "features",
    definition: "Video ad watched to unlock scan quota.",
    translations: {
      es: "anuncio recompensado",
      "pt-br": "anúncio premiado",
      de: "Belohnungsvideo / Rewarded Ad",
      fr: "publicité récompensée",
      ja: "リワード広告",
    },
  },
  {
    term: "launch offer",
    category: "features",
    definition: "30-day promotional access.",
    translations: {
      es: "oferta de lanzamiento",
      "pt-br": "oferta de lançamento",
      de: "Einführungsangebot",
      fr: "offre de lancement",
      ja: "リリース記念特典",
    },
  },

  // ── Goals & Health ─────────────────────────────────────────────────────────
  {
    term: "daily calorie target",
    category: "goals",
    definition: "Daily energy objective.",
    translations: {
      es: "meta calórica diaria",
      "pt-br": "meta diária de calorias",
      de: "tägliches Kalorienziel",
      fr: "objectif calorique quotidien",
      ja: "1日の目標摂取カロリー",
    },
  },
  {
    term: "weight loss / losing weight",
    category: "goals",
    definition: "Health goal for body fat reduction.",
    translations: {
      es: "pérdida de peso / perder peso",
      "pt-br": "perda de peso / emagrecimento",
      de: "Gewichtsverlust / Abnehmen",
      fr: "perte de poids / perdre du poids",
      ja: "減量 / ダイエット",
    },
    notes: "NEVER strengthen claims ('will make you lose weight' must remain 'helps support weight loss').",
  },
  {
    term: "maintenance",
    category: "goals",
    definition: "Eating at energy equilibrium.",
    translations: {
      es: "mantenimiento",
      "pt-br": "manutenção de peso",
      de: "Gewicht halten",
      fr: "maintien du poids",
      ja: "体重維持",
    },
  },
  {
    term: "home-cooked food",
    category: "cuisines",
    definition: "Meals made from scratch at home.",
    translations: {
      es: "comida casera",
      "pt-br": "comida caseira",
      de: "selbstgekochtes Essen / Hausmannskost",
      fr: "plats faits maison",
      ja: "家庭料理 / 自炊",
    },
  },

  // ── Legal & Compliance ─────────────────────────────────────────────────────
  {
    term: "not medical advice",
    category: "legal",
    definition: "Mandatory health disclaimer.",
    translations: {
      es: "Las estimaciones de la IA no constituyen asesoramiento médico.",
      "pt-br": "As estimativas por IA não substituem orientação médica.",
      de: "KI-Schätzungen sind keine medizinische Beratung.",
      fr: "Les estimations par IA ne constituent pas un avis médical.",
      ja: "AIによる推計値は医療上の助言ではありません。",
    },
    notes: "Must remain as prominent in all translations as in English.",
  },
  {
    term: "consult a qualified professional",
    category: "legal",
    definition: "Mandatory health guidance boundary.",
    translations: {
      es: "Consulta siempre a un profesional sanitario cualificado.",
      "pt-br": "Consulte sempre um profissional de saúde qualificado.",
      de: "Konsultiere stets qualifiziertes medizinisches Fachpersonal.",
      fr: "Consultez toujours un professionnel de santé qualifié.",
      ja: "必ず医師や管理栄養士などの専門家にご相談ください。",
    },
  },
  {
    term: "English version legally binding",
    category: "legal",
    definition: "Mandatory legal notice for translated policies.",
    translations: {
      es: "Esta traducción se proporciona únicamente para tu comodidad. En caso de discrepancia, la versión original en inglés es la legalmente vinculante.",
      "pt-br": "Esta tradução é fornecida apenas para sua conveniência. Em caso de divergência, a versão original em inglês é a legalmente vinculativa.",
      de: "Diese Übersetzung dient ausschließlich Informationszwecken. Bei Abweichungen ist allein die englische Originalfassung rechtsverbindlich.",
      fr: "Cette traduction est fournie uniquement pour votre commodité. En cas de divergence, la version originale anglaise fait foi et demeure juridiquement contraignante.",
      ja: "本翻訳は参考情報として提供されています。英語版と翻訳版で解釈に相違がある場合は、英語版が法的な効力を有します。",
    },
    notes: "Mandatory header notice on Privacy Policy and Terms in all 5 languages.",
  },
];

/**
 * Quick lookup helper for glossary terms.
 */
export function getGlossaryTranslation(term: string, locale: Locale): string {
  if (locale === "en") return term;
  const match = GLOSSARY.find((g) => g.term.toLowerCase() === term.toLowerCase());
  return match?.translations[locale as Exclude<Locale, "en">] ?? term;
}
