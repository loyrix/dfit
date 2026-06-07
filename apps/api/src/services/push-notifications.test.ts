import { describe, expect, it } from "vitest";
import {
  parsePushNotificationSendError,
  pushNotificationFailureKey,
} from "./push-notifications.js";

describe("push notification send errors", () => {
  it("preserves APNs provider reasons from Firebase failures", () => {
    const error = parsePushNotificationSendError({
      error: {
        code: 401,
        message: "Auth error from APNS or Web Push Service",
        status: "UNAUTHENTICATED",
        details: [
          {
            "@type": "type.googleapis.com/google.firebase.fcm.v1.FcmError",
            errorCode: "THIRD_PARTY_AUTH_ERROR",
          },
          {
            "@type": "type.googleapis.com/google.firebase.fcm.v1.ApnsError",
            statusCode: 403,
            reason: "InvalidProviderToken",
          },
        ],
      },
    });

    expect(error).toEqual({
      errorCode: "THIRD_PARTY_AUTH_ERROR",
      errorReason: "InvalidProviderToken",
    });
    expect(pushNotificationFailureKey({ success: false, status: 401, ...error })).toBe(
      "THIRD_PARTY_AUTH_ERROR:InvalidProviderToken",
    );
  });
});
