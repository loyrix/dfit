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
  // App Store Connect provider token for Apple campaign links (`?pt=…&ct=…`),
  // from App Analytics -> Acquisition -> Campaigns -> Generate a Campaign Link.
  // Constant across every campaign and app on the account. Set to null to make
  // iOS badges fall back to the plain store URL rather than emit a link that
  // looks tracked but silently is not.
  appleProviderToken: "128857039" as string | null,
  // Apple generates campaign links against this path form, so campaign URLs are
  // built from it rather than from `appStoreUrl` above. Both resolve to the same
  // listing, but matching what App Store Connect issues removes a whole class of
  // "attribution shows nothing and we cannot tell why" debugging.
  appStoreCampaignBaseUrl: "https://apps.apple.com/app/apple-store/id6770872606",

  // ── Domains ────────────────────────────────────────────────────────────────
  // Must match the domain Vercel actually serves. www is primary here and the
  // apex 307-redirects to it, so canonicals, og:urls, the sitemap and all JSON-LD
  // have to say www — otherwise every URL we hand Google is one that redirects.
  websiteUrl: "https://www.logmyplate.com",
  apiDomain: "api.logmyplate.com",
  supportEmail: "support@logmyplate.com",
  deleteAccountDeepLink: "logmyplate://delete-account",

  // ── Launch offer ───────────────────────────────────────────────────────────
  // Inclusive end date (local time). The site-wide ribbon and the first-visit
  // offer popup are shown only on/before this date, then auto-hide.
  // Launch offer runs through this date (inclusive).
  offerEndDate: "2026-07-31",

  // ── Analytics ──────────────────────────────────────────────────────────────
  // GA4 measurement ID for the "Logmyplate-web" stream. This sits in the same
  // property (logmyplate-0425 / 539979285) as the iOS and Android app streams,
  // which is what lets a website visit and an app install line up in one funnel.
  // Public by design — it ships in the client bundle either way — so it lives
  // here alongside the other public ids rather than in a build-time env var.
  // `NEXT_PUBLIC_GA_MEASUREMENT_ID` overrides it if a deploy ever needs to.
  gaMeasurementId: "G-T7FLRZ1FXJ",
  // Analytics only loads on this host, so localhost and Vercel preview builds
  // never pollute the property with traffic that is not real users.
  analyticsHost: "logmyplate.com",

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
