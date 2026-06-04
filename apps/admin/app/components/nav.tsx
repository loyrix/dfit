"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const primaryItems = [
  { href: "/", label: "Overview" },
  { href: "/cost", label: "AI Usage" },
  { href: "/conversions", label: "Conversion" },
  { href: "/scans", label: "Scan Sessions" },
] as const;

const navGroups = [
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
] as const;

const defaultSections: Record<string, string> = {
  "/ai": "models",
  "/flags": "flags",
  "/growth": "analytics",
};

export function AdminNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <nav className="admin-nav" aria-label="Admin navigation">
      <div className="nav-primary">
        {primaryItems.map(({ href, label }) => {
          const active = isActivePath(pathname, searchParams, href);
          return (
            <Link
              aria-current={active ? "page" : undefined}
              className={`nav-link${active ? " nav-link-active" : ""}`}
              href={href}
              key={href}
            >
              {label}
            </Link>
          );
        })}
      </div>

      {navGroups.map((group) => (
        <details
          className="nav-section nav-dropdown"
          key={group.label}
          open={group.items.some(({ href }) => isActivePath(pathname, searchParams, href))}
        >
          <summary className="nav-section-label">{group.label}</summary>
          <div className="grid gap-1">
            {group.items.map(({ href, label }) => {
              const active = isActivePath(pathname, searchParams, href);
              return (
                <Link
                  aria-current={active ? "page" : undefined}
                  className={`nav-link nav-link-sub${active ? " nav-link-active" : ""}`}
                  href={href}
                  key={href}
                >
                  {label}
                </Link>
              );
            })}
          </div>
        </details>
      ))}
    </nav>
  );
}

function isActivePath(pathname: string, searchParams: URLSearchParams, href: string) {
  const [pathAndQuery] = href.split("#");
  const [hrefPath, hrefQuery] = pathAndQuery.split("?");
  if (hrefPath === "/") {
    return pathname === "/";
  }
  if (!(pathname === hrefPath || pathname.startsWith(`${hrefPath}/`))) {
    return false;
  }

  if (!hrefQuery) {
    const defaultSection = defaultSections[hrefPath];
    if (defaultSection) {
      return (searchParams.get("section") ?? defaultSection) === defaultSection;
    }
    return true;
  }

  const requiredParams = new URLSearchParams(hrefQuery);
  for (const [key, value] of requiredParams) {
    const currentValue =
      key === "section" && defaultSections[hrefPath]
        ? (searchParams.get(key) ?? defaultSections[hrefPath])
        : searchParams.get(key);
    if (currentValue !== value) {
      return false;
    }
  }
  return true;
}
