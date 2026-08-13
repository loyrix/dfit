import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

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

  if (isValidSessionCookie(request.cookies.get(adminCookieName)?.value)) {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL("/login", request.nextUrl));
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
  // Everything except Next internals and static assets. Auth should run on all
  // remaining routes rather than an allowlist, so new pages are covered by default.
  matcher: ["/((?!_next/static|_next/image).*)"],
};
