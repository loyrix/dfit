import "server-only";

import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const adminCookieName = "loyrix_admin_session";
const sessionTtlMs = 8 * 60 * 60 * 1000;

type AdminSession = {
  actor: string;
  expiresAt: number;
};

export async function createAdminSession(actor: string) {
  const expiresAt = Date.now() + sessionTtlMs;
  const value = signSession({ actor, expiresAt });
  const cookieStore = await cookies();

  cookieStore.set(adminCookieName, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(expiresAt),
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(adminCookieName);
}

export async function getAdminSession(): Promise<AdminSession | undefined> {
  const value = (await cookies()).get(adminCookieName)?.value;
  if (!value) return undefined;
  const session = verifySession(value);
  if (!session || session.expiresAt <= Date.now()) return undefined;
  return session;
}

export async function requireAdminSession() {
  const session = await getAdminSession();
  if (!session) redirect("/login");
  return session;
}

export function validateAdminCredentials(username: string, password: string) {
  const expectedUsername =
    process.env.ADMIN_USERNAME ??
    process.env.ADMIN_API_USERNAME ??
    process.env.ADMIN_DASHBOARD_USERNAME;
  const expectedPassword =
    process.env.ADMIN_PASSWORD ??
    process.env.ADMIN_API_PASSWORD ??
    process.env.ADMIN_DASHBOARD_PASSWORD;

  if (!expectedUsername || !expectedPassword) return false;
  return safeEqual(username, expectedUsername) && safeEqual(password, expectedPassword);
}

/**
 * Optimistic check for `proxy.ts`. Verifies the signature and expiry of a raw
 * cookie value without touching `cookies()`, so it can run in the proxy layer.
 * This is a pre-filter only — the authoritative check lives in `adminFetch`.
 */
export function isValidSessionCookie(value: string | undefined): boolean {
  if (!value) return false;
  const session = verifySession(value);
  return Boolean(session && session.expiresAt > Date.now());
}

const signSession = (session: AdminSession) => {
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  return `${payload}.${signature(payload)}`;
};

const verifySession = (value: string): AdminSession | undefined => {
  const [payload, receivedSignature] = value.split(".");
  if (!payload || !receivedSignature) return undefined;
  if (!safeEqual(signature(payload), receivedSignature)) return undefined;

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as AdminSession;
    if (!parsed.actor || !Number.isFinite(parsed.expiresAt)) return undefined;
    return parsed;
  } catch {
    return undefined;
  }
};

const signature = (payload: string) =>
  createHmac("sha256", sessionSecret()).update(payload).digest("base64url");

const sessionSecret = () => {
  const secret =
    process.env.ADMIN_SESSION_SECRET ??
    process.env.ADMIN_API_PASSWORD ??
    process.env.ADMIN_DASHBOARD_PASSWORD;

  // Never fall back to a literal default. A checked-in secret means anyone with
  // repository access can forge an admin session cookie.
  if (!secret) {
    throw new Error(
      "ADMIN_SESSION_SECRET is required. Refusing to sign admin sessions without a configured secret.",
    );
  }

  return secret;
};

// Digest both sides first so the comparison is over fixed-length buffers.
// Comparing raw strings leaks the expected length via the early return.
const safeEqual = (left: string, right: string) =>
  timingSafeEqual(
    createHash("sha256").update(left).digest(),
    createHash("sha256").update(right).digest(),
  );
