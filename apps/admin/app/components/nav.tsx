"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { getProjectSource, projectIdFromPathname } from "../lib/registry";

/**
 * Renders whatever nav the active project declares. Hrefs arrive project-relative
 * and are prefixed here, so a source never encodes its own URL prefix.
 *
 * The active project is read from the pathname rather than passed down, so pages
 * do not have to thread it through the shell. Nav manifests are pure data with no
 * credentials in them, which is what makes resolving the registry here safe.
 */
export function AdminNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const projectId = projectIdFromPathname(pathname);
  const source = projectId ? getProjectSource(projectId) : undefined;
  if (!projectId || !source) return null;
  const nav = source.nav;

  const isActive = (href: string) =>
    isActivePath(pathname, searchParams, href, projectId, nav.defaultSections);

  return (
    <nav className="admin-nav" aria-label="Admin navigation">
      <div className="nav-primary">
        {nav.primary.map(({ href, label }) => {
          const active = isActive(href);
          return (
            <Link
              aria-current={active ? "page" : undefined}
              className={`nav-link${active ? " nav-link-active" : ""}`}
              href={withProject(projectId, href)}
              key={href}
            >
              {label}
            </Link>
          );
        })}
      </div>

      {nav.groups.map((group) => (
        <details
          className="nav-section nav-dropdown"
          key={group.label}
          open={group.items.some(({ href }) => isActive(href))}
        >
          <summary className="nav-section-label">{group.label}</summary>
          <div className="grid gap-1">
            {group.items.map(({ href, label }) => {
              const active = isActive(href);
              return (
                <Link
                  aria-current={active ? "page" : undefined}
                  className={`nav-link nav-link-sub${active ? " nav-link-active" : ""}`}
                  href={withProject(projectId, href)}
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

function withProject(projectId: string, href: string) {
  if (href === "/") return `/${projectId}`;
  return `/${projectId}${href}`;
}

function isActivePath(
  pathname: string,
  searchParams: URLSearchParams,
  href: string,
  projectId: string,
  defaultSections: Record<string, string>,
) {
  const [pathAndQuery] = href.split("#");
  const [hrefPath, hrefQuery] = pathAndQuery.split("?");
  const target = withProject(projectId, hrefPath);
  const projectRoot = `/${projectId}`;

  if (hrefPath === "/") {
    return pathname === projectRoot;
  }
  if (!(pathname === target || pathname.startsWith(`${target}/`))) {
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
