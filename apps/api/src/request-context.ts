import { AsyncLocalStorage } from "node:async_hooks";
import type { FastifyInstance, FastifyRequest } from "fastify";

export type RequestIdentity = {
  installId?: string;
  sessionToken?: string;
  platform?: "ios" | "android";
  appVersion?: string;
  appBuild?: number;
  locale?: string;
  region?: string;
  timezone?: string;
};

const identityStorage = new AsyncLocalStorage<RequestIdentity>();

export const registerRequestContext = async (app: FastifyInstance): Promise<void> => {
  app.addHook("onRequest", (request, _reply, done) => {
    identityStorage.run(readIdentity(request), done);
  });
};

export const currentRequestIdentity = (): RequestIdentity => identityStorage.getStore() ?? {};

const readIdentity = (request: FastifyRequest): RequestIdentity => ({
  installId: cleanHeader(request.headers["x-logmyplate-install-id"], 128),
  sessionToken: cleanBearerToken(request.headers.authorization),
  platform:
    cleanPlatform(request.headers["x-logmyplate-platform"]) ??
    cleanPlatform(request.headers["x-logmyplate-app-platform"]),
  appVersion: cleanHeader(request.headers["x-logmyplate-app-version"], 32),
  appBuild: cleanIntegerHeader(request.headers["x-logmyplate-app-build"]),
  locale: cleanHeader(request.headers["x-logmyplate-locale"], 32),
  region: cleanHeader(request.headers["x-logmyplate-region"], 16),
  timezone: cleanHeader(request.headers["x-logmyplate-timezone"], 64),
});

const cleanHeader = (value: unknown, maxLength: number): string | undefined => {
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== "string") return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, maxLength);
};

const cleanPlatform = (value: unknown): RequestIdentity["platform"] => {
  const platform = cleanHeader(value, 16);
  return platform === "ios" || platform === "android" ? platform : undefined;
};

const cleanIntegerHeader = (value: unknown): number | undefined => {
  const raw = cleanHeader(value, 16);
  if (!raw || !/^\d+$/.test(raw)) return undefined;
  const parsed = Number(raw);
  return Number.isSafeInteger(parsed) ? parsed : undefined;
};

const cleanBearerToken = (value: unknown): string | undefined => {
  const authorization = cleanHeader(value, 512);
  if (!authorization) return undefined;
  const [scheme, token] = authorization.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return undefined;
  return token.trim().slice(0, 384);
};
