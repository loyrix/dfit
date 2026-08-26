import { describe, expect, it } from "vitest";
import {
  parsePushNotificationSendError,
  pushNotificationFailureKey,
  shouldDisablePushToken,
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

describe("shouldDisablePushToken", () => {
  it("disables the token when direct APNs reports an uninstalled app", () => {
    // APNs answers 410 with the mixed-case reason "Unregistered", which an exact
    // uppercase comparison against 404/UNREGISTERED silently missed.
    expect(
      shouldDisablePushToken({
        success: false,
        status: 410,
        errorCode: "Unregistered",
        errorReason: "Unregistered",
      }),
    ).toBe(true);
  });

  it("disables the token when FCM reports it unregistered", () => {
    expect(shouldDisablePushToken({ success: false, status: 404, errorCode: "UNREGISTERED" })).toBe(
      true,
    );
    expect(shouldDisablePushToken({ success: false, status: 404, errorCode: "NOT_FOUND" })).toBe(
      true,
    );
  });

  it("disables the token when Firebase relays an APNs Unregistered reason", () => {
    expect(
      shouldDisablePushToken({
        success: false,
        status: 400,
        errorCode: "INVALID_ARGUMENT",
        errorReason: "Unregistered",
      }),
    ).toBe(true);
  });

  it("keeps the token for failures that are not the token's fault", () => {
    expect(
      shouldDisablePushToken({
        success: false,
        status: 401,
        errorCode: "THIRD_PARTY_AUTH_ERROR",
        errorReason: "InvalidProviderToken",
      }),
    ).toBe(false);
    expect(
      shouldDisablePushToken({ success: false, status: 400, errorCode: "BadDeviceToken" }),
    ).toBe(false);
    expect(shouldDisablePushToken({ success: false, status: 503, errorCode: "UNAVAILABLE" })).toBe(
      false,
    );
    expect(shouldDisablePushToken({ success: false, status: 504, errorCode: "APNS_TIMEOUT" })).toBe(
      false,
    );
  });

  it("never disables a token on a successful send", () => {
    expect(shouldDisablePushToken({ success: true, status: 200 })).toBe(false);
  });
});
