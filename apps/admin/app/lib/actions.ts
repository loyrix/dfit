"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { adminSend } from "./api";
import { readMutationKey } from "./idempotency";
import {
  clearAdminSession,
  createAdminSession,
  requireAdminSession,
  validateAdminCredentials,
} from "./session";

export async function loginAction(formData: FormData) {
  const username = stringValue(formData, "username");
  const password = stringValue(formData, "password");

  if (!validateAdminCredentials(username, password)) {
    redirect("/login?error=invalid");
  }

  await createAdminSession(username);
  redirect("/");
}

export async function logoutAction() {
  await clearAdminSession();
  redirect("/login");
}

export async function grantCreditsAction(formData: FormData) {
  await requireAdminSession();
  const profileId = stringValue(formData, "profileId");
  await adminSend(
    `/admin/users/${profileId}/grants`,
    {
      creditType: stringValue(formData, "creditType"),
      amount: numberValue(formData, "amount"),
      reason: stringValue(formData, "reason"),
    },
    { idempotencyKey: readMutationKey(formData) },
  );
  revalidatePath("/users");
  redirect(`/users?profileId=${encodeURIComponent(profileId)}`);
}

export async function reactivateUserAction(formData: FormData) {
  await requireAdminSession();
  const profileId = stringValue(formData, "profileId");
  await adminSend(
    `/admin/users/${profileId}/reactivate`,
    {
      reason: stringValue(formData, "reason"),
    },
    { idempotencyKey: readMutationKey(formData), method: "PATCH" },
  );
  revalidatePath("/users");
  redirect(`/users?profileId=${encodeURIComponent(profileId)}`);
}

export async function setDefaultModelAction(formData: FormData) {
  await requireAdminSession();
  await adminSend(
    "/admin/ai/models/default",
    {
      key: stringValue(formData, "key"),
      reason: stringValue(formData, "reason"),
    },
    { idempotencyKey: readMutationKey(formData), method: "PUT" },
  );
  revalidatePath("/ai");
  redirect("/ai");
}

export async function updateModelAction(formData: FormData) {
  await requireAdminSession();
  const key = stringValue(formData, "key");
  await adminSend(
    `/admin/ai/models/${encodeURIComponent(key)}`,
    {
      enabled: formData.get("enabled") === "on",
      maxOutputTokens: numberValue(formData, "maxOutputTokens"),
      temperature: numberValue(formData, "temperature"),
      topP: numberValue(formData, "topP"),
      notes: stringValue(formData, "notes"),
      reason: stringValue(formData, "reason"),
    },
    { idempotencyKey: readMutationKey(formData), method: "PATCH" },
  );
  revalidatePath("/ai");
  redirect("/ai");
}

export async function createPromptAction(formData: FormData) {
  await requireAdminSession();
  await adminSend(
    "/admin/ai/prompts",
    {
      version: stringValue(formData, "version"),
      title: stringValue(formData, "title"),
      body: stringValue(formData, "body"),
      reason: stringValue(formData, "reason"),
    },
    { idempotencyKey: readMutationKey(formData) },
  );
  revalidatePath("/ai");
  redirect("/ai");
}

export async function activatePromptAction(formData: FormData) {
  await requireAdminSession();
  await adminSend(
    "/admin/ai/prompts/active",
    {
      id: stringValue(formData, "id"),
      reason: stringValue(formData, "reason"),
    },
    { idempotencyKey: readMutationKey(formData), method: "PUT" },
  );
  revalidatePath("/ai");
  redirect("/ai");
}

export async function updateFeatureFlagAction(formData: FormData) {
  await requireAdminSession();
  const key = stringValue(formData, "key");
  await adminSend(
    `/admin/feature-flags/${encodeURIComponent(key)}`,
    {
      value: formData.get("value") === "on",
      description: stringValue(formData, "description"),
      reason: stringValue(formData, "reason"),
    },
    { idempotencyKey: readMutationKey(formData), method: "PUT" },
  );
  revalidatePath("/flags");
  redirect("/flags");
}

export async function createNoticeAction(formData: FormData) {
  await requireAdminSession();
  await adminSend(
    "/admin/notices",
    {
      title: stringValue(formData, "title"),
      body: stringValue(formData, "body"),
      severity: stringValue(formData, "severity"),
      active: formData.get("active") === "on",
      ctaLabel: optionalStringValue(formData, "ctaLabel"),
      ctaUrl: optionalStringValue(formData, "ctaUrl"),
      reason: stringValue(formData, "reason"),
    },
    { idempotencyKey: readMutationKey(formData) },
  );
  revalidatePath("/flags");
  redirect("/flags");
}

export async function updateNoticeAction(formData: FormData) {
  await requireAdminSession();
  const noticeId = stringValue(formData, "noticeId");
  await adminSend(
    `/admin/notices/${noticeId}`,
    {
      active: formData.get("active") === "on",
      reason: stringValue(formData, "reason"),
    },
    { idempotencyKey: readMutationKey(formData), method: "PATCH" },
  );
  revalidatePath("/flags");
  redirect("/flags");
}

export async function updateAppUpdatePolicyAction(formData: FormData) {
  await requireAdminSession();
  await adminSend(
    "/admin/app-update-policy",
    {
      enabled: formData.get("enabled") === "on",
      ios: readPlatformPolicy(formData, "ios"),
      android: readPlatformPolicy(formData, "android"),
      reason: stringValue(formData, "reason"),
    },
    { idempotencyKey: readMutationKey(formData), method: "PUT" },
  );
  revalidatePath("/versions");
  redirect("/versions");
}

const stringValue = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();

const optionalStringValue = (formData: FormData, key: string) => {
  const value = stringValue(formData, key);
  return value ? value : undefined;
};

const numberValue = (formData: FormData, key: string) => Number(formData.get(key) ?? 0);

const readPlatformPolicy = (formData: FormData, platform: "ios" | "android") => ({
  latestBuild: numberValue(formData, `${platform}.latestBuild`),
  minSupportedBuild: numberValue(formData, `${platform}.minSupportedBuild`),
  latestVersion: optionalStringValue(formData, `${platform}.latestVersion`),
  storeUrl: optionalStringValue(formData, `${platform}.storeUrl`),
  optionalTitle: stringValue(formData, `${platform}.optionalTitle`),
  optionalMessage: stringValue(formData, `${platform}.optionalMessage`),
  mandatoryTitle: stringValue(formData, `${platform}.mandatoryTitle`),
  mandatoryMessage: stringValue(formData, `${platform}.mandatoryMessage`),
});
