import * as crypto from "node:crypto";
import * as http2 from "node:http2";
import { JWT } from "google-auth-library";
import type { ApiConfig } from "../config.js";

export type PushNotificationMessage = {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
};

/** Extended message type that includes routing info for the push notification router. */
export type RoutedPushNotificationMessage = PushNotificationMessage & {
  provider: "fcm" | "apns";
  apnsSandbox?: boolean | null;
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

// ---------------------------------------------------------------------------
// Apple Push Notification service (APNs) — direct HTTP/2 sender
// ---------------------------------------------------------------------------

export type ApnsConfig = {
  apnsKeyBase64?: string;
  apnsKeyId?: string;
  apnsTeamId?: string;
  apnsBundleId?: string;
};

type CachedApnsJwt = { token: string; expiresAt: number };

const APNS_JWT_LIFETIME_MS = 50 * 60 * 1_000; // 50 minutes (Apple allows 1 hour)
const APNS_PRODUCTION_HOST = "api.push.apple.com";
const APNS_SANDBOX_HOST = "api.sandbox.push.apple.com";

export class ApplePushNotificationSender {
  private readonly keyId: string;
  private readonly teamId: string;
  private readonly bundleId: string;
  private readonly privateKey: string;
  private cachedJwt: CachedApnsJwt | null = null;

  constructor(options: ApnsConfig) {
    const keyBase64 = options.apnsKeyBase64?.trim();
    const keyId = options.apnsKeyId?.trim();
    const teamId = options.apnsTeamId?.trim();
    if (!keyBase64 || !keyId || !teamId) {
      throw new PushNotificationConfigurationError(
        "APNS_KEY_BASE64, APNS_KEY_ID, and APNS_TEAM_ID are all required for direct APNs.",
      );
    }
    this.keyId = keyId;
    this.teamId = teamId;
    this.bundleId = options.apnsBundleId?.trim() || "com.logmyplate.app";
    this.privateKey = Buffer.from(keyBase64, "base64").toString("utf8").trim();
    if (!this.privateKey.includes("-----BEGIN PRIVATE KEY-----")) {
      throw new PushNotificationConfigurationError(
        "APNS_KEY_BASE64 does not contain a valid PKCS#8 PEM private key.",
      );
    }
  }

  static isConfigured(options: ApnsConfig): boolean {
    return Boolean(
      options.apnsKeyBase64?.trim() && options.apnsKeyId?.trim() && options.apnsTeamId?.trim(),
    );
  }

  async send(
    message: PushNotificationMessage,
    sandbox?: boolean | null,
  ): Promise<PushNotificationSendResult> {
    const jwt = this.getOrCreateJwt();
    const host = sandbox ? APNS_SANDBOX_HOST : APNS_PRODUCTION_HOST;

    return new Promise<PushNotificationSendResult>((resolve, reject) => {
      const client = http2.connect(`https://${host}:443`);

      client.on("error", (error) => {
        reject(new Error(`APNs HTTP/2 connection failed: ${error.message}`));
      });

      const requestBody = JSON.stringify({
        aps: {
          alert: {
            title: message.title,
            body: message.body,
          },
          sound: "default",
        },
        ...Object.fromEntries(
          Object.entries(message.data ?? {}).map(([key, value]) => [key, value]),
        ),
      });

      const req = client.request({
        ":method": "POST",
        ":path": `/3/device/${message.token}`,
        authorization: `bearer ${jwt}`,
        "apns-topic": this.bundleId,
        "apns-push-type": "alert",
        "apns-priority": "10",
        "content-type": "application/json",
        "content-length": String(Buffer.byteLength(requestBody)),
      });

      let responseData = "";
      let statusCode = 0;

      req.on("response", (headers) => {
        statusCode = Number(headers[":status"]);
      });

      req.on("data", (chunk: Buffer) => {
        responseData += chunk.toString();
      });

      req.on("end", () => {
        client.close();
        if (statusCode >= 200 && statusCode < 300) {
          resolve({ success: true, status: statusCode });
          return;
        }

        let apnsReason: string | undefined;
        try {
          const body = JSON.parse(responseData) as { reason?: string };
          apnsReason = body.reason;
        } catch {
          // ignore parse failures
        }
        resolve({
          success: false,
          status: statusCode,
          errorCode: apnsReason ?? `apns_http_${statusCode}`,
          errorReason: apnsReason,
        });
      });

      req.on("error", (error) => {
        client.close();
        reject(error);
      });

      req.write(requestBody);
      req.end();

      // Timeout safety — Vercel functions have a 10s limit
      setTimeout(() => {
        client.close();
        resolve({
          success: false,
          status: 504,
          errorCode: "APNS_TIMEOUT",
          errorReason: "APNs request timed out",
        });
      }, 8_000);
    });
  }

  private getOrCreateJwt(): string {
    const now = Date.now();
    if (this.cachedJwt && now < this.cachedJwt.expiresAt) {
      return this.cachedJwt.token;
    }

    const header = { alg: "ES256", kid: this.keyId };
    const payload = { iss: this.teamId, iat: Math.floor(now / 1_000) };
    const encodedHeader = Buffer.from(JSON.stringify(header)).toString("base64url");
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const signingInput = `${encodedHeader}.${encodedPayload}`;

    const signature = crypto.sign("SHA256", Buffer.from(signingInput), {
      key: this.privateKey,
      dsaEncoding: "ieee-p1363",
    });

    const token = `${signingInput}.${signature.toString("base64url")}`;
    this.cachedJwt = { token, expiresAt: now + APNS_JWT_LIFETIME_MS };
    return token;
  }
}

// ---------------------------------------------------------------------------
// Router — sends iOS via APNs, Android via FCM
// ---------------------------------------------------------------------------

export class PushNotificationRouter {
  constructor(
    private readonly fcm: FirebaseCloudMessagingSender,
    private readonly apns: ApplePushNotificationSender | null,
  ) {}

  get configured(): boolean {
    return this.fcm.configured || this.apns !== null;
  }

  async send(message: RoutedPushNotificationMessage): Promise<PushNotificationSendResult> {
    if (message.provider === "apns" && this.apns) {
      return this.apns.send(message, message.apnsSandbox);
    }
    return this.fcm.send(message);
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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
