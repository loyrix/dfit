import "server-only";

import { randomUUID } from "node:crypto";

const unsafeScopeChars = /[^a-zA-Z0-9:_-]+/g;

export function createMutationKey(scope: string) {
  const safeScope = scope.trim().replace(unsafeScopeChars, "-").replace(/-+/g, "-").slice(0, 80);
  return `admin:${safeScope || "mutation"}:${randomUUID()}`;
}

export function readMutationKey(formData: FormData) {
  const value = String(formData.get("idempotencyKey") ?? "").trim();
  return value ? value : undefined;
}
