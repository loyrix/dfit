/**
 * Acquisition-source tracking for the marketing site.
 *
 * Two jobs, both client-side:
 *
 *  1. Work out where this visit came from (`resolveVisitSource`) — from the
 *     landing URL's utm_* params, an ad click id, or the referring host — and
 *     remember it for the rest of the session so internal navigation does not
 *     dissolve the answer into "direct".
 *
 *  2. Carry that source across the store handoff (`buildStoreUrl`). Play accepts
 *     an install `referrer` string that Firebase reads back on `first_open`, so
 *     an Android install can be traced to the campaign that produced it. Apple
 *     has no equivalent that reaches Firebase — see `appleProviderToken` below.
 *
 * The bare `APP_CONFIG.appStoreUrl` / `playStoreUrl` stay campaign-free on
 * purpose: they are also used for JSON-LD, og tags and app links, where a
 * tracking suffix would be wrong.
 */

import { APP_CONFIG } from "@/config/app";

export type StoreTarget = "ios" | "android";

export interface VisitSource {
  /** utm_source, or a host-derived label like "google_organic". */
  source: string;
  /** utm_medium, or a coarse guess: "organic", "referral", "none". */
  medium: string;
  /** utm_campaign when present, otherwise "(not set)". */
  campaign: string;
}

const SESSION_KEY = "lmp_visit_source";

const DIRECT: VisitSource = { source: "direct", medium: "none", campaign: "(not set)" };

/**
 * Referring hosts we can name with confidence. Anything else is "referral" with
 * the bare hostname, which is honest about what we actually know.
 */
const KNOWN_REFERRERS: ReadonlyArray<[RegExp, string]> = [
  [/(^|\.)google\./, "google"],
  [/(^|\.)bing\./, "bing"],
  [/(^|\.)duckduckgo\./, "duckduckgo"],
  [/(^|\.)yahoo\./, "yahoo"],
  [/(^|\.)reddit\./, "reddit"],
  [/(^|\.)instagram\./, "instagram"],
  [/(^|\.)facebook\./, "facebook"],
  [/(^|\.)youtube\./, "youtube"],
  [/(^|\.)linkedin\./, "linkedin"],
  [/(^|\.)x\.com$/, "x"],
  [/(^|\.)twitter\./, "x"],
  [/(^|\.)quora\./, "quora"],
  [/(^|\.)pinterest\./, "pinterest"],
  [/(^|\.)whatsapp\./, "whatsapp"],
  [/(^|\.)t\.co$/, "x"],
];

const isSearchEngine = (label: string) =>
  label === "google" || label === "bing" || label === "duckduckgo" || label === "yahoo";

const clean = (value: string | null | undefined): string => {
  if (!value) return "";
  // Analytics dimensions are low-cardinality by nature; anything longer than
  // this is a tracking blob rather than a campaign name.
  return value.trim().slice(0, 100);
};

/** Classify a document.referrer URL into a source/medium pair. */
function fromReferrer(referrer: string): VisitSource {
  let host: string;
  try {
    host = new URL(referrer).hostname.toLowerCase();
  } catch {
    return DIRECT;
  }

  // Our own pages are not an acquisition source.
  if (host.endsWith("logmyplate.com")) return DIRECT;

  const known = KNOWN_REFERRERS.find(([pattern]) => pattern.test(host))?.[1];
  if (known) {
    return {
      source: known,
      medium: isSearchEngine(known) ? "organic" : "referral",
      campaign: "(not set)",
    };
  }

  return { source: host, medium: "referral", campaign: "(not set)" };
}

/** Read utm_* / ad click ids off a URL's query string. */
function fromQuery(params: URLSearchParams): VisitSource | null {
  const utmSource = clean(params.get("utm_source"));
  if (utmSource) {
    return {
      source: utmSource,
      medium: clean(params.get("utm_medium")) || "(not set)",
      campaign: clean(params.get("utm_campaign")) || "(not set)",
    };
  }

  // Ad platforms that stamp a click id but no utm_source.
  if (params.get("gclid")) return { source: "google", medium: "cpc", campaign: "(not set)" };
  if (params.get("fbclid")) return { source: "facebook", medium: "social", campaign: "(not set)" };

  // Short hand-written links: /?ref=newsletter
  const ref = clean(params.get("ref"));
  if (ref) return { source: ref, medium: "referral", campaign: "(not set)" };

  return null;
}

function readStored(): VisitSource | null {
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<VisitSource>;
    if (!parsed || typeof parsed.source !== "string") return null;
    return {
      source: parsed.source,
      medium: typeof parsed.medium === "string" ? parsed.medium : "(not set)",
      campaign: typeof parsed.campaign === "string" ? parsed.campaign : "(not set)",
    };
  } catch {
    // Private browsing, disabled storage, or malformed JSON. Not worth failing over.
    return null;
  }
}

function store(source: VisitSource): void {
  try {
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(source));
  } catch {
    // Same as above — attribution is best-effort, never load-bearing.
  }
}

/**
 * The source for this visit. The first page of a session decides it; later
 * pages reuse that answer rather than re-reading a now-internal referrer.
 *
 * An explicit utm_* on the current URL always wins, so a mid-session click on a
 * fresh campaign link re-attributes the visit.
 */
export function resolveVisitSource(): VisitSource {
  if (typeof window === "undefined") return DIRECT;

  const explicit = fromQuery(new URLSearchParams(window.location.search));
  if (explicit) {
    store(explicit);
    return explicit;
  }

  const stored = readStored();
  if (stored) return stored;

  const resolved = document.referrer ? fromReferrer(document.referrer) : DIRECT;
  store(resolved);
  return resolved;
}

/**
 * A store URL that carries the campaign that produced the click.
 *
 * `placement` names the spot on the site the badge was in (hero, footer,
 * guide…), so we can tell which surfaces actually drive installs.
 */
export function buildStoreUrl(
  target: StoreTarget,
  placement: string,
  visit: VisitSource = DIRECT,
): string {
  return target === "android" ? buildPlayUrl(placement, visit) : buildAppStoreUrl(placement, visit);
}

/**
 * Play reads the `referrer` value at install time and Firebase surfaces it as
 * the campaign on `first_open` — no SDK work needed on our side. The value is a
 * URL-encoded query string in its own right, hence the double encoding.
 */
function buildPlayUrl(placement: string, visit: VisitSource): string {
  const referrer = new URLSearchParams({
    utm_source: visit.source,
    utm_medium: visit.medium === "none" ? "website" : visit.medium,
    utm_campaign: visit.campaign === "(not set)" ? "web_download" : visit.campaign,
    utm_content: placement,
  }).toString();

  return `${APP_CONFIG.playStoreUrl}&referrer=${encodeURIComponent(referrer)}`;
}

/**
 * Apple campaign links need a provider token from App Store Connect; `ct` alone
 * is ignored. Until `appleProviderToken` is filled in we hand out the plain
 * store URL rather than a link that looks tracked but is not.
 *
 * Note this data lands in App Store Connect's App Analytics, NOT in Firebase —
 * iOS install attribution never reaches GA4 without an SKAdNetwork/MMP setup.
 */
function buildAppStoreUrl(placement: string, visit: VisitSource): string {
  const providerToken = APP_CONFIG.appleProviderToken;
  if (!providerToken) return APP_CONFIG.appStoreUrl;

  // App Store Connect caps the campaign token at 30 characters; anything longer
  // is truncated on Apple's side, which would silently merge distinct campaigns
  // into one bucket. Truncating here keeps what we send and what Apple records
  // identical.
  const campaign = `${visit.source}_${placement}`.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 30);

  return `${APP_CONFIG.appStoreCampaignBaseUrl}?pt=${encodeURIComponent(providerToken)}&ct=${encodeURIComponent(campaign)}&mt=8`;
}
