import { logmyplateSource } from "../sources/logmyplate";
import { privydockSource } from "../sources/privydock";
import type { ProjectSource } from "../sources/types";

/** Every project the backoffice can operate. Order drives the switcher. */
const sources: ProjectSource[] = [logmyplateSource, privydockSource];

/** Used when no project is in the URL and none has been visited yet. */
export const defaultProjectId = logmyplateSource.id;

/** Cookie holding the last project the operator looked at. */
export const projectCookieName = "loyrix_project";

export function listProjects(): ProjectSource[] {
  return sources;
}

/** Returns undefined for unknown ids so callers can render a 404 rather than throw. */
export function getProjectSource(id: string): ProjectSource | undefined {
  return sources.find((source) => source.id === id);
}

/** Prefixes a project-relative path with its project segment. */
export function projectHref(projectId: string, path: string) {
  if (path === "/") return `/${projectId}`;
  return `/${projectId}${path}`;
}

/**
 * Whether a project declares a route in its nav. Routes live in one shared
 * `app/[project]/…` tree, so without this check `/privydock/users` would render
 * LogMyPlate's page. Enforced centrally in `proxy.ts`.
 */
export function projectOwnsPath(projectId: string, path: string): boolean {
  const source = getProjectSource(projectId);
  if (!source) return false;
  if (path === "" || path === "/") return true;

  const owned = new Set(
    [...source.nav.primary, ...source.nav.groups.flatMap((group) => group.items)].map(
      (item) => item.href.split("?")[0],
    ),
  );
  return owned.has(path);
}

/**
 * Reads the active project from a pathname such as "/logmyplate/users".
 * Returns undefined on routes outside a project, e.g. "/login".
 */
export function projectIdFromPathname(pathname: string): string | undefined {
  const [, first] = pathname.split("/");
  return first && getProjectSource(first) ? first : undefined;
}
