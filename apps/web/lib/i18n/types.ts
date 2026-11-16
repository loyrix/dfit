import type { Locale } from "./config";

export interface NavDict {
  howItWorks: string;
  aiCoach: string;
  guides: string;
  support: string;
  downloadCta: string;
  homeAria: string;
  mainNavAria: string;
  openMenuAria: string;
  closeMenuAria: string;
}

export interface FooterLink {
  label: string;
  href: string;
}

export interface FooterDict {
  brandDescription: string;
  groupProduct: string;
  groupSupport: string;
  groupLegal: string;
  linkDownload: string;
  linkHowItWorks: string;
  linkGuides: string;
  linkHelpFaq: string;
  linkEmailUs: string;
  linkPrivacy: string;
  linkTerms: string;
  linkDataDeletion: string;
  linkAppAds: string;
  copyright: string;
  medicalDisclaimer: string;
}

export interface OfferRibbonDict {
  badge: string;
  highlight: string;
  suffix: string;
  ariaLabel: string;
}

export interface LaunchOfferModalDict {
  badge: string;
  title: string;
  subtitle: string;
  feature1: string;
  feature2: string;
  feature3: string;
  note: string;
  closeAria: string;
}

export interface DownloadBadgesDict {
  appStoreAria: string;
  playStoreAria: string;
}

export interface HomeFlowItem {
  eyebrow: string;
  title: string;
  body: string;
  alt: string;
}

export interface HomeThemeCard {
  label: string;
  alt: string;
}

export interface HomePricingTier {
  label: string;
  accent: string;
  perks: string[];
}

export interface HomeDict {
  metaTitle: string;
  metaDescription: string;
  hero: {
    badge: string;
    headline: string;
    headlineBreak: string;
    subheadline: string;
    pillNoBarcode: string;
    pillCuisines: string;
    pillThemes: string;
    altFrenchToast: string;
    altThaliReview: string;
    altDashboard: string;
  };
  howItWorks: {
    badge: string;
    title: string;
    flow: HomeFlowItem[];
  };
  reviewEstimate: {
    badge: string;
    title: string;
    paragraph1: string;
    paragraph2: string;
    macroMixBadge: string;
    altMealDetail: string;
  };
  aiNutritionist: {
    badge: string;
    title: string;
    paragraph1: string;
    bullet1: string;
    bullet2: string;
    bullet3: string;
    altChat: string;
    altWeeklySummary: string;
  };
  themes: {
    badge: string;
    title: string;
    subtitle: string;
    cards: HomeThemeCard[];
  };
  premium: {
    srTitle: string;
    bannerAltLandscape: string;
    bannerAltPortrait: string;
    intro: string;
    tiers: HomePricingTier[];
    note: string;
  };
  ctaSection: {
    title: string;
    subtitle: string;
    privacyLink: string;
  };
}

export interface DownloadPageDict {
  metaTitle: string;
  metaDescription: string;
  badge: string;
  headlinePrefix: string;
  headlineBrand: string;
  headlineSubtitle: string;
  description: string;
  featuresHeading: string;
  features: string[];
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface SupportPageDict {
  metaTitle: string;
  metaDescription: string;
  badge: string;
  headline: string;
  subtitle: string;
  contactBoxHeading: string;
  contactBoxText: string;
  contactButton: string;
  faqs: FaqItem[];
}

export interface LegalSection {
  title: string;
  content: string[];
}

export interface PrivacyPageDict {
  metaTitle: string;
  metaDescription: string;
  badge: string;
  headline: string;
  lastUpdated: string;
  legallyBindingNotice?: string;
  sections: LegalSection[];
}

export interface TermsPageDict {
  metaTitle: string;
  metaDescription: string;
  badge: string;
  headline: string;
  lastUpdated: string;
  legallyBindingNotice?: string;
  medicalDisclaimerHeading: string;
  medicalDisclaimerText: string;
  sections: LegalSection[];
}

export interface DataDeletionPageDict {
  metaTitle: string;
  metaDescription: string;
  badge: string;
  headline: string;
  intro: string;
  inAppHeading: string;
  inAppSteps: string[];
  inAppNote: string;
  openAppButton: string;
  webHeading: string;
  webText: string;
  webEmailSubject: string;
  webEmailButton: string;
  retentionHeading: string;
  retentionText: string;
}

export interface CaloriesIndexDict {
  metaTitle: string;
  metaDescription: string;
  badge: string;
  headline: string;
  subtitle: string;
  tierIndian: string;
  tierGlobal: string;
  viewFoodButton: string;
  per100gBadge: string;
  portionsBadge: string;
}

export interface GuidesIndexDict {
  metaTitle: string;
  metaDescription: string;
  badge: string;
  headline: string;
  subtitle: string;
  readArticleButton: string;
  minReadSuffix: string;
}

export interface CommonDict {
  languageSwitcherLabel: string;
  selectLanguageAria: string;
  macros: {
    calories: string;
    protein: string;
    carbs: string;
    fat: string;
    fiber: string;
    sodium: string;
    sugar?: string;
  };
  units: {
    grams: string;
    kcal: string;
  };
  notMedicalAdviceNotice: string;
}

export interface Dictionary {
  locale: Locale;
  common: CommonDict;
  nav: NavDict;
  footer: FooterDict;
  offerRibbon: OfferRibbonDict;
  launchOfferModal: LaunchOfferModalDict;
  downloadBadges: DownloadBadgesDict;
  home: HomeDict;
  download: DownloadPageDict;
  support: SupportPageDict;
  privacy: PrivacyPageDict;
  terms: TermsPageDict;
  dataDeletion: DataDeletionPageDict;
  caloriesIndex: CaloriesIndexDict;
  guidesIndex: GuidesIndexDict;
}
