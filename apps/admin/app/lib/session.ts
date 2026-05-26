import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const cookieName = "logmyplate_admin_session";
const sessionTtlMs = 8 * 60 * 60 * 1000;

type AdminSession = {
  actor: string;
  expiresAt: number;
};

export async function createAdminSession(actor: string) {
  const expiresAt = Date.now() + sessionTtlMs;
  const value = signSession({ actor, expiresAt });
  const cookieStore = await cookies();

  cookieStore.set(cookieName, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(expiresAt),
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(cookieName);
}

export async function getAdminSession(): Promise<AdminSession | undefined> {
  const value = (await cookies()).get(cookieName)?.value;
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

const sessionSecret = () =>
  process.env.ADMIN_SESSION_SECRET ??
  process.env.ADMIN_API_PASSWORD ??
  process.env.ADMIN_DASHBOARD_PASSWORD ??
  "logmyplate-local-admin-session-secret";

const safeEqual = (left: string, right: string) => {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
};
