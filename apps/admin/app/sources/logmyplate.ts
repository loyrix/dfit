import type { ProjectSource } from "./types";

/**
 * LogMyPlate reads through the admin REST API (`ADMIN_API_BASE_URL`), so this
 * source only has to declare its navigation — the data layer is `app/lib/api.ts`.
 *
 * The nav below is the arrangement that previously lived hardcoded in
 * `app/components/nav.tsx`, moved here unchanged.
 */
export const logmyplateSource: ProjectSource = {
  id: "logmyplate",
  label: "LogMyPlate",
  brand: { logo: "/icon.png", tagline: "Food logging" },
  nav: {
    primary: [
      { href: "/", label: "Overview" },
      { href: "/cost", label: "AI Usage" },
      { href: "/conversions", label: "Conversion" },
      { href: "/scans", label: "Scan Sessions" },
      { href: "/accuracy", label: "Scan Accuracy" },
      { href: "/ads", label: "Ads & Credits" },
    ],
    groups: [
      {
        label: "Support",
        items: [
          { href: "/users", label: "Users" },
          { href: "/audit", label: "Audit Log" },
        ],
      },
      {
        label: "AI Controls",
        items: [
          { href: "/ai?section=models", label: "Models" },
          { href: "/ai?section=prompts", label: "Prompts" },
          { href: "/ai?section=chat", label: "Chat" },
        ],
      },
      {
        label: "Growth",
        items: [
          { href: "/growth?section=analytics", label: "Analytics" },
          { href: "/growth?section=review", label: "Review Prompt" },
          { href: "/growth?section=ads", label: "Interstitial Ads" },
          { href: "/growth?section=rewarded", label: "Rewarded Unlocks" },
          { href: "/growth?section=notifications", label: "Push Reminders" },
          { href: "/growth?section=streaks", label: "Streaks" },
          { href: "/growth?section=push", label: "Manual Push" },
        ],
      },
      {
        label: "Runtime",
        items: [
          { href: "/flags?section=flags", label: "Feature Flags" },
          { href: "/flags?section=notices", label: "In-app Notices" },
          { href: "/flags?section=create-notice", label: "Create Notice" },
          { href: "/versions", label: "App Versions" },
        ],
      },
    ],
    defaultSections: {
      "/ai": "models",
      "/flags": "flags",
      "/growth": "analytics",
    },
  },
};
