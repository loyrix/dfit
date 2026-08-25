/**
 * Thin wrapper over the GA4 tag.
 *
 * The tag only loads on the real site (`APP_CONFIG.analyticsHost`), so
 * localhost and Vercel preview deploys never report into the property. Every
 * helper below no-ops when the tag is absent, so callers never have to guard —
 * analytics must not be able to break a page.
 */

import { APP_CONFIG } from "@/config/app";

export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || APP_CONFIG.gaMeasurementId;

/**
 * Whether the tag should load. Client-only: it depends on the hostname, so on
 * the server this is always false and the component renders nothing.
 */
export function shouldLoadAnalytics(): boolean {
  if (typeof window === "undefined") return false;
  if (!GA_MEASUREMENT_ID) return false;
  const host = window.location.hostname;
  return host === APP_CONFIG.analyticsHost || host.endsWith(`.${APP_CONFIG.analyticsHost}`);
}

type GtagArgs =
  | ["js", Date]
  | ["config", string, Record<string, unknown>?]
  | ["event", string, Record<string, unknown>?];

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: GtagArgs) => void;
  }
}

/**
 * Send a GA4 event. The presence of `window.gtag` is the single source of truth
 * for whether reporting is live — that covers the tag never loading, being
 * blocked by an extension, or being switched off for this host.
 */
export function trackEvent(name: string, parameters: Record<string, unknown> = {}): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  try {
    window.gtag("event", name, parameters);
  } catch {
    // A blocked or half-initialised tag must not surface to the user.
  }
}

/**
 * Send a page_view for client-side navigation. The initial view comes from the
 * `config` call in the tag itself, so this is only for route changes.
 */
export function trackPageView(path: string): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  try {
    window.gtag("event", "page_view", {
      page_path: path,
      page_location: window.location.href,
      page_title: document.title,
    });
  } catch {
    // As above.
  }
}
