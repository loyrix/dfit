import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { projectOwnsPath } from "./app/lib/registry";
import { adminCookieName, isValidSessionCookie } from "./app/lib/session";

/**
 * Optimistic auth pre-filter.
 *
 * This runs before every request and turns the backoffice fail-closed: a route
 * added without an auth check is redirected here rather than being public by
 * default. It only reads and verifies the session cookie — no database or API
 * calls, since this also runs for prefetched routes.
 *
 * This is deliberately not the only line of defence. The authoritative check is
 * in `adminFetch` (app/lib/api.ts), next to the data itself, and every server
 * action calls `requireAdminSession()` on its own.
 */
export function proxy(request: NextRequest) {
  if (isPublicPath(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  if (!isValidSessionCookie(request.cookies.get(adminCookieName)?.value)) {
    return NextResponse.redirect(new URL("/login", request.nextUrl));
  }

  // Routes live in one shared `app/[project]/…` tree, so a project must declare
  // a route in its nav to serve it. Without this, `/privydock/users` would
  // render LogMyPlate's page against LogMyPlate's data.
  const [, projectId, ...rest] = request.nextUrl.pathname.split("/");
  if (projectId && !projectOwnsPath(projectId, `/${rest.join("/")}`.replace(/\/$/, ""))) {
    return new NextResponse("Not found", { status: 404 });
  }

  return NextResponse.next();
}

function isPublicPath(pathname: string) {
  return (
    pathname === "/login" ||
    pathname === "/favicon.ico" ||
    pathname === "/icon.png" ||
    pathname === "/apple-icon.png"
  );
}

export const config = {
  // Everything except Next internals and files served from /public. Auth runs on
  // all remaining routes rather than an allowlist, so new pages are covered by
  // default. Static files must be excluded by extension: their first path
  // segment is a filename, not a project, so the ownership check below would
  // otherwise 404 them.
  matcher: [
    "/((?!_next/static|_next/image|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|avif|woff2?|txt|xml|json|map)$).*)",
  ],
};
