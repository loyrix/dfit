import { createPublicKey, verify as verifySignature } from "node:crypto";

export type AdMobRewardedSsvCallback = {
  adNetwork?: string;
  adUnitId?: string;
  customData?: string;
  keyId: string;
  rewardAmount?: number;
  rewardType?: string;
  signature: string;
  timestamp?: string;
  transactionId: string;
  userId?: string;
  rawQuery: Record<string, string>;
};

export interface AdMobRewardedAdVerifier {
  verifyCallbackUrl(rawUrl: string): Promise<AdMobRewardedSsvCallback>;
}

type AdMobVerifierKey = {
  keyId: number;
  pem?: string;
  base64?: string;
};

type AdMobVerifierKeysResponse = {
  keys?: AdMobVerifierKey[];
};

export class AdMobSsvVerificationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AdMobSsvVerificationError";
  }
}

export class GoogleAdMobRewardedAdVerifier implements AdMobRewardedAdVerifier {
  private cachedKeys?: { expiresAt: number; keys: Map<string, string> };

  constructor(
    private readonly options: {
      publicKeysUrl: string;
      keyCacheTtlMs: number;
    },
  ) {}

  async verifyCallbackUrl(rawUrl: string): Promise<AdMobRewardedSsvCallback> {
    const content = extractVerifiableContent(rawUrl);
    const callback = parseRewardedSsvCallback(content.query);
    const keys = await this.verifierKeys();
    const publicKeyPem = keys.get(callback.keyId);
    if (!publicKeyPem) {
      throw new AdMobSsvVerificationError(
        `No AdMob SSV public key found for key_id ${callback.keyId}.`,
      );
    }

    const verified = verifySignature(
      "sha256",
      Buffer.from(content.dataToVerify, "utf8"),
      { key: createPublicKey(publicKeyPem), dsaEncoding: "der" },
      decodeBase64Url(callback.signature),
    );

    if (!verified) {
      throw new AdMobSsvVerificationError("AdMob SSV signature verification failed.");
    }

    return callback;
  }

  private async verifierKeys(): Promise<Map<string, string>> {
    if (this.cachedKeys && this.cachedKeys.expiresAt > Date.now()) {
      return this.cachedKeys.keys;
    }

    const response = await fetch(this.options.publicKeysUrl);
    if (!response.ok) {
      throw new AdMobSsvVerificationError(
        `Could not fetch AdMob SSV public keys: ${response.status}.`,
      );
    }

    const payload = (await response.json()) as AdMobVerifierKeysResponse;
    const keys = new Map<string, string>();
    for (const key of payload.keys ?? []) {
      const pem = key.pem ?? (key.base64 ? base64PublicKeyToPem(key.base64) : undefined);
      if (pem) keys.set(String(key.keyId), pem);
    }

    if (keys.size === 0) {
      throw new AdMobSsvVerificationError("AdMob SSV public key response was empty.");
    }

    this.cachedKeys = {
      expiresAt: Date.now() + this.options.keyCacheTtlMs,
      keys,
    };
    return keys;
  }
}

export const parseRewardedSsvCallback = (query: string): AdMobRewardedSsvCallback => {
  const params = new URLSearchParams(query);
  const rawQuery = Object.fromEntries(params.entries());
  const keyId = rawQuery.key_id?.trim();
  const signature = rawQuery.signature?.trim();
  const transactionId = rawQuery.transaction_id?.trim();

  if (!keyId) throw new AdMobSsvVerificationError("AdMob SSV callback is missing key_id.");
  if (!signature) throw new AdMobSsvVerificationError("AdMob SSV callback is missing signature.");
  if (!transactionId) {
    throw new AdMobSsvVerificationError("AdMob SSV callback is missing transaction_id.");
  }

  return {
    adNetwork: cleanOptional(rawQuery.ad_network),
    adUnitId: cleanOptional(rawQuery.ad_unit),
    customData: cleanOptional(rawQuery.custom_data),
    keyId,
    rewardAmount: parsePositiveInteger(rawQuery.reward_amount),
    rewardType: cleanOptional(rawQuery.reward_item),
    signature,
    timestamp: cleanOptional(rawQuery.timestamp),
    transactionId,
    userId: cleanOptional(rawQuery.user_id),
    rawQuery,
  };
};

const extractVerifiableContent = (rawUrl: string): { query: string; dataToVerify: string } => {
  const questionIndex = rawUrl.indexOf("?");
  const query = questionIndex >= 0 ? rawUrl.slice(questionIndex + 1) : rawUrl;
  const signatureIndex = query.indexOf("&signature=");
  if (signatureIndex <= 0) {
    throw new AdMobSsvVerificationError("AdMob SSV callback must include signature after content.");
  }

  return {
    query,
    dataToVerify: query.slice(0, signatureIndex),
  };
};

const cleanOptional = (value: string | undefined): string | undefined => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

const parsePositiveInteger = (value: string | undefined): number | undefined => {
  if (!value || !/^\d+$/.test(value)) return undefined;
  return Number(value);
};

const decodeBase64Url = (value: string): Buffer => {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  return Buffer.from(padded, "base64");
};

const base64PublicKeyToPem = (value: string): string => {
  const lines = value.match(/.{1,64}/g) ?? [value];
  return ["-----BEGIN PUBLIC KEY-----", ...lines, "-----END PUBLIC KEY-----"].join("\n");
};
