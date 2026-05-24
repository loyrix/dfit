import { generateKeyPairSync, sign } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import { AdMobSsvVerificationError, GoogleAdMobRewardedAdVerifier } from "./admob-ssv.js";

const previousFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = previousFetch;
});

const mockVerifierKeysFetch = (publicKeyPem: string): void => {
  globalThis.fetch = async () =>
    new Response(JSON.stringify({ keys: [{ keyId: 123, pem: publicKeyPem }] }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
};

describe("GoogleAdMobRewardedAdVerifier", () => {
  it("verifies signed rewarded SSV callback URLs", async () => {
    const { privateKey, publicKey } = generateKeyPairSync("ec", {
      namedCurve: "prime256v1",
    });
    const publicKeyPem = publicKey.export({ type: "spki", format: "pem" }).toString();
    mockVerifierKeysFetch(publicKeyPem);

    const content =
      "ad_network=5450213213286189855&ad_unit=1712485313&custom_data=reward-token-1" +
      "&reward_amount=1&reward_item=scan&timestamp=1770000000000&transaction_id=txn-1" +
      "&user_id=profile-1";
    const signature = sign("sha256", Buffer.from(content, "utf8"), privateKey)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const verifier = new GoogleAdMobRewardedAdVerifier({
      publicKeysUrl: "https://keys.test/verifier-keys.json",
      keyCacheTtlMs: 60_000,
    });

    const callback = await verifier.verifyCallbackUrl(
      `/v1/ads/rewarded/ssv?${content}&signature=${signature}&key_id=123`,
    );

    expect(callback).toMatchObject({
      transactionId: "txn-1",
      customData: "reward-token-1",
      userId: "profile-1",
      rewardAmount: 1,
      rewardType: "scan",
    });
  });

  it("rejects tampered rewarded SSV callback URLs", async () => {
    const { privateKey, publicKey } = generateKeyPairSync("ec", {
      namedCurve: "prime256v1",
    });
    const publicKeyPem = publicKey.export({ type: "spki", format: "pem" }).toString();
    mockVerifierKeysFetch(publicKeyPem);

    const signedContent =
      "ad_network=5450213213286189855&ad_unit=1712485313&custom_data=reward-token-1" +
      "&reward_amount=1&reward_item=scan&timestamp=1770000000000&transaction_id=txn-1";
    const signature = sign("sha256", Buffer.from(signedContent, "utf8"), privateKey)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const verifier = new GoogleAdMobRewardedAdVerifier({
      publicKeysUrl: "https://keys.test/verifier-keys.json",
      keyCacheTtlMs: 60_000,
    });

    await expect(
      verifier.verifyCallbackUrl(
        `/v1/ads/rewarded/ssv?${signedContent}&reward_amount=99&signature=${signature}&key_id=123`,
      ),
    ).rejects.toBeInstanceOf(AdMobSsvVerificationError);
  });
});
