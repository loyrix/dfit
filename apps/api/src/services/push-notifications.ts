import { JWT } from "google-auth-library";
import type { ApiConfig } from "../config.js";

export type PushNotificationMessage = {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
};

export type PushNotificationSendResult = {
  success: boolean;
  status: number;
  errorCode?: string;
  errorReason?: string;
};

export class PushNotificationConfigurationError extends Error {
  constructor(message = "Firebase Cloud Messaging is not configured.") {
    super(message);
    this.name = "PushNotificationConfigurationError";
  }
}

export class FirebaseCloudMessagingSender {
  constructor(private readonly options: ApiConfig["push"]) {}

  get configured(): boolean {
    return Boolean(this.options.firebaseProjectId?.trim() && this.rawCredentialsJson);
  }

  async send(message: PushNotificationMessage): Promise<PushNotificationSendResult> {
    const projectId = this.options.firebaseProjectId?.trim();
    const credentials = this.parseCredentials();
    if (!projectId) {
      throw new PushNotificationConfigurationError("FIREBASE_PROJECT_ID is required.");
    }

    const client = new JWT({
      email: credentials.client_email,
      key: normalizePrivateKey(credentials.private_key),
      scopes: ["https://www.googleapis.com/auth/firebase.messaging"],
    });
    const accessToken = await client.getAccessToken();
    if (!accessToken.token) {
      throw new PushNotificationConfigurationError("Could not create Firebase access token.");
    }

    const response = await fetch(
      `https://fcm.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/messages:send`,
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${accessToken.token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          message: {
            token: message.token,
            notification: {
              title: message.title,
              body: message.body,
            },
            data: message.data ?? {},
            android: {
              priority: "HIGH",
            },
            apns: {
              payload: {
                aps: {
                  sound: "default",
                },
              },
            },
          },
        }),
      },
    );

    if (response.ok) return { success: true, status: response.status };

    let sendError: Pick<PushNotificationSendResult, "errorCode" | "errorReason"> = {};
    try {
      sendError = parsePushNotificationSendError(await response.json());
    } catch {
      sendError = {};
    }
    return { success: false, status: response.status, ...sendError };
  }

  private get rawCredentialsJson(): string | undefined {
    if (this.options.firebaseCredentialsJson?.trim()) {
      return this.options.firebaseCredentialsJson.trim();
    }
    if (this.options.firebaseCredentialsJsonBase64?.trim()) {
      return Buffer.from(this.options.firebaseCredentialsJsonBase64, "base64").toString("utf8");
    }
    return undefined;
  }

  private parseCredentials(): { client_email: string; private_key: string } {
    const rawJson = this.rawCredentialsJson;
    if (!rawJson) {
      throw new PushNotificationConfigurationError(
        "FIREBASE_SERVICE_ACCOUNT_JSON_BASE64 is required.",
      );
    }

    let credentials: { client_email?: string; private_key?: string };
    try {
      credentials = JSON.parse(rawJson) as typeof credentials;
    } catch (error) {
      throw new PushNotificationConfigurationError(
        `Firebase service account JSON is invalid: ${String(error)}`,
      );
    }

    if (!credentials.client_email || !credentials.private_key) {
      throw new PushNotificationConfigurationError(
        "Firebase service account credentials must include client_email and private_key.",
      );
    }
    return {
      client_email: credentials.client_email,
      private_key: credentials.private_key,
    };
  }
}

export const pushNotificationFailureKey = (result: PushNotificationSendResult): string => {
  const code = result.errorCode ?? `http_${result.status}`;
  return result.errorReason ? `${code}:${result.errorReason}` : code;
};

export const parsePushNotificationSendError = (
  payload: unknown,
): Pick<PushNotificationSendResult, "errorCode" | "errorReason"> => {
  if (!isObject(payload) || !isObject(payload.error)) return {};
  const details = Array.isArray(payload.error.details) ? payload.error.details : [];
  const fcmError = details.find(
    (detail): detail is FcmErrorDetail =>
      isObject(detail) &&
      typeof detail["@type"] === "string" &&
      detail["@type"].includes("google.firebase.fcm.v1.FcmError"),
  );
  const apnsError = details.find(
    (detail): detail is FcmErrorDetail =>
      isObject(detail) &&
      typeof detail["@type"] === "string" &&
      detail["@type"].includes("google.firebase.fcm.v1.ApnsError"),
  );

  return {
    errorCode:
      typeof fcmError?.errorCode === "string"
        ? fcmError.errorCode
        : typeof payload.error.status === "string"
          ? payload.error.status
          : undefined,
    errorReason: typeof apnsError?.reason === "string" ? apnsError.reason : undefined,
  };
};

const normalizePrivateKey = (value: string) => value.replace(/\\n/g, "\n");

type FcmErrorDetail = {
  "@type"?: string;
  errorCode?: string;
  reason?: string;
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;
