/**
 * Central configuration for LogMyPlate web.
 */
export const APP_CONFIG = {
  brandName: "LogMyPlate",
  appName: "LogMyPlate: AI Calorie Tracker",
  developerName: "LogMyPlate",
  tagline: "Snap a photo. Know your meal.",
  description:
    "LogMyPlate: AI Calorie Tracker uses AI to analyze your meal photo and estimate calories and macros — no barcodes, no manual entry.",
  keywords: [
    "AI calorie tracker",
    "calorie tracker India",
    "Indian food calorie tracker",
    "photo food journal",
    "macro tracker",
    "meal photo calorie app",
    "LogMyPlate",
  ],

  // ── Store URLs ─────────────────────────────────────────────────────────────
  iosAppId: "6770872606",
  androidPackage: "com.logmyplate.app",
  appStoreUrl: "https://apps.apple.com/app/id6770872606",
  playStoreUrl: "https://play.google.com/store/apps/details?id=com.logmyplate.app",

  // ── Domains ────────────────────────────────────────────────────────────────
  websiteUrl: "https://logmyplate.com",
  apiDomain: "api.logmyplate.com",
  supportEmail: "support@logmyplate.com",
  deleteAccountDeepLink: "logmyplate://delete-account",

  // ── Launch offer ───────────────────────────────────────────────────────────
  // Inclusive end date (local time). The site-wide ribbon and the first-visit
  // offer popup are shown only on/before this date, then auto-hide.
  // Launch offer runs through this date (inclusive).
  offerEndDate: "2026-07-31",

  // ── AdMob ──────────────────────────────────────────────────────────────────
  admobPublisherId: "pub-6936425975956435",

  // ── Theme ──────────────────────────────────────────────────────────────────
  lightThemeColor: "#fbfaf5",
  darkThemeColor: "#0c120f",
} as const;

export type AppConfig = typeof APP_CONFIG;

/**
 * Whether the launch offer is still running. True on or before `offerEndDate`.
 * Evaluated at build time on the server and at runtime in client components.
 */
export function isLaunchOfferActive(now: Date = new Date()): boolean {
  const end = new Date(`${APP_CONFIG.offerEndDate}T23:59:59`);
  return now.getTime() <= end.getTime();
}
