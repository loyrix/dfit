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

    let errorCode: string | undefined;
    try {
      const payload = (await response.json()) as { error?: { status?: string } };
      errorCode = payload.error?.status;
    } catch {
      errorCode = undefined;
    }
    return { success: false, status: response.status, errorCode };
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

const normalizePrivateKey = (value: string) => value.replace(/\\n/g, "\n");
