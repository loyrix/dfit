"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  ["/", "Overview"],
  ["/cost", "AI Usage"],
  ["/conversions", "Conversion"],
  ["/users", "Users"],
  ["/scans", "Scans"],
  ["/ai", "AI Controls"],
  ["/growth", "Growth Controls"],
  ["/flags", "Flags & Notices"],
  ["/versions", "App Versions"],
  ["/audit", "Audit Log"],
] as const;

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="mt-8 grid gap-1" aria-label="Admin navigation">
      {navItems.map(([href, label]) => {
        const active = isActivePath(pathname, href);
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
    </nav>
  );
}

function isActivePath(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
