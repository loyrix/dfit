import type { ProjectSource } from "../types";

/**
 * PrivyDock has no admin API. Its data comes from three upstreams read directly:
 * Supabase for everything the site and app record themselves, Cloudflare for
 * what the R2 bucket served, and Paddle for revenue.
 *
 * Traffic, downloads and installs are all first-party — the site logs a row per
 * rendered page and per file handed over, and the app checks in daily. Cloudflare
 * survives only where nothing else can see: Sparkle polls the bucket directly and
 * never touches anything instrumented.
 */
export const privydockSource: ProjectSource = {
  id: "privydock",
  label: "PrivyDock",
  brand: { logo: "/privydock-logo.png", tagline: "Mac privacy app" },
  nav: {
    primary: [
      { href: "/", label: "Overview" },
      { href: "/traffic", label: "Traffic" },
      { href: "/downloads", label: "Downloads" },
      { href: "/installs", label: "Installs" },
      { href: "/issues", label: "Issues" },
      { href: "/diagnostics", label: "Diagnostics" },
    ],
    groups: [
      {
        label: "Customers",
        items: [
          { href: "/licenses", label: "Licences" },
          { href: "/waitlist", label: "Waitlist" },
        ],
      },
      {
        label: "Commerce",
        items: [{ href: "/revenue", label: "Revenue" }],
      },
    ],
    defaultSections: {},
  },
};
