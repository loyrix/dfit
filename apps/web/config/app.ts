/**
 * Central configuration for LogMyPlate web.
 * Replace placeholder URLs before launch.
 */
export const APP_CONFIG = {
  appName: "LogMyPlate",
  tagline: "Snap a photo. Know your meal.",
  description:
    "LogMyPlate uses AI to analyze your meal photo and estimate calories and macros — no barcodes, no manual entry.",

  // ── Store URLs ─────────────────────────────────────────────────────────────
  // Replace with actual URLs once the app is live in stores.
  appStoreUrl: "https://apps.apple.com/app/logmyplate/id000000000", // TODO: replace
  playStoreUrl: "https://play.google.com/store/apps/details?id=com.logmyplate.app", // TODO: replace

  // ── Domains ────────────────────────────────────────────────────────────────
  websiteUrl: "https://logmyplate.com",
  apiDomain: "api.logmyplate.com",
  supportEmail: "support@logmyplate.com",

  // ── AdMob ──────────────────────────────────────────────────────────────────
  admobPublisherId: "pub-6936425975956435",
} as const;

export type AppConfig = typeof APP_CONFIG;
