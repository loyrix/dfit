import { createPublicKey, createVerify } from "node:crypto";
import { OAuth2Client } from "google-auth-library";
import type { ApiConfig } from "../config.js";

export type OAuthProvider = "apple" | "google";

export type OAuthVerificationInput = {
  provider: OAuthProvider;
  idToken: string;
  authorizationCode?: string;
  nonce?: string;
  displayName?: string;
};

export type VerifiedOAuthIdentity = {
  provider: OAuthProvider;
  providerSubject: string;
  email?: string;
  emailVerified?: boolean;
  displayName?: string;
};

export interface OAuthIdentityVerifier {
  verify(input: OAuthVerificationInput): Promise<VerifiedOAuthIdentity>;
}

export class OAuthVerificationError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode = 401,
  ) {
    super(message);
    this.name = "OAuthVerificationError";
  }
}

type AppleJwtHeader = {
  alg?: string;
  kid?: string;
};

type AppleJwtPayload = {
  iss?: string;
  aud?: string | string[];
  exp?: number;
  sub?: string;
  email?: string;
  email_verified?: boolean | "true" | "false";
  nonce?: string;
};

type AppleJwk = {
  kty: string;
  kid: string;
  use?: string;
  alg?: string;
  n: string;
  e: string;
};

type AppleJwksResponse = {
  keys?: AppleJwk[];
};

type CachedAppleKeys = {
  keys: AppleJwk[];
  expiresAt: number;
};

const appleIssuer = "https://appleid.apple.com";
const defaultAppleKeyCacheTtlMs = 24 * 60 * 60 * 1000;

export class ConfiguredOAuthIdentityVerifier implements OAuthIdentityVerifier {
  private readonly googleClient = new OAuth2Client();
  private appleKeys?: CachedAppleKeys;

  constructor(private readonly authConfig: ApiConfig["auth"]) {}

  async verify(input: OAuthVerificationInput): Promise<VerifiedOAuthIdentity> {
    return input.provider === "google" ? this.verifyGoogle(input) : this.verifyApple(input);
  }

  private async verifyGoogle(input: OAuthVerificationInput): Promise<VerifiedOAuthIdentity> {
    if (this.authConfig.googleClientIds.length === 0) {
      throw new OAuthVerificationError(
        "oauth_provider_not_configured",
        "Google sign-in is not configured.",
        503,
      );
    }

    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken: input.idToken,
        audience: this.authConfig.googleClientIds,
      });
      const payload = ticket.getPayload();
      if (!payload?.sub) {
        throw new OAuthVerificationError("invalid_oauth_token", "Invalid Google token.");
      }

      return {
        provider: "google",
        providerSubject: payload.sub,
        email: normalizeOptionalEmail(payload.email),
        emailVerified: payload.email_verified === true,
        displayName: cleanOptionalString(payload.name),
      };
    } catch (error) {
      if (error instanceof OAuthVerificationError) throw error;
      throw new OAuthVerificationError("invalid_oauth_token", "Invalid Google token.");
    }
  }

  private async verifyApple(input: OAuthVerificationInput): Promise<VerifiedOAuthIdentity> {
    if (this.authConfig.appleClientIds.length === 0) {
      throw new OAuthVerificationError(
        "oauth_provider_not_configured",
        "Apple sign-in is not configured.",
        503,
      );
    }

    const parsed = parseJwt(input.idToken);
    if (parsed.header.alg !== "RS256" || !parsed.header.kid) {
      throw new OAuthVerificationError("invalid_oauth_token", "Invalid Apple token.");
    }

    const key = await this.getAppleKey(parsed.header.kid);
    const publicKey = createPublicKey({ key, format: "jwk" });
    const verifier = createVerify("RSA-SHA256");
    verifier.update(parsed.signedContent);
    verifier.end();

    if (!verifier.verify(publicKey, parsed.signature)) {
      throw new OAuthVerificationError("invalid_oauth_token", "Invalid Apple token signature.");
    }

    const payload = parsed.payload;
    if (payload.iss !== appleIssuer) {
      throw new OAuthVerificationError("invalid_oauth_token", "Invalid Apple token issuer.");
    }
    if (!audienceMatches(payload.aud, this.authConfig.appleClientIds)) {
      throw new OAuthVerificationError("invalid_oauth_token", "Invalid Apple token audience.");
    }
    if (!payload.exp || payload.exp * 1000 <= Date.now()) {
      throw new OAuthVerificationError("invalid_oauth_token", "Apple token has expired.");
    }
    if (!payload.sub) {
      throw new OAuthVerificationError("invalid_oauth_token", "Invalid Apple token subject.");
    }
    if (input.nonce && payload.nonce !== input.nonce) {
      throw new OAuthVerificationError("invalid_oauth_token", "Invalid Apple token nonce.");
    }

    return {
      provider: "apple",
      providerSubject: payload.sub,
      email: normalizeOptionalEmail(payload.email),
      emailVerified: parseBooleanClaim(payload.email_verified),
      displayName: cleanOptionalString(input.displayName),
    };
  }

  private async getAppleKey(kid: string): Promise<AppleJwk> {
    const now = Date.now();
    if (!this.appleKeys || this.appleKeys.expiresAt <= now) {
      this.appleKeys = {
        keys: await fetchAppleKeys(this.authConfig.appleJwksUrl),
        expiresAt: now + defaultAppleKeyCacheTtlMs,
      };
    }

    const key = this.appleKeys.keys.find((candidate) => candidate.kid === kid);
    if (!key) {
      this.appleKeys = {
        keys: await fetchAppleKeys(this.authConfig.appleJwksUrl),
        expiresAt: now + defaultAppleKeyCacheTtlMs,
      };
    }

    const refreshedKey = this.appleKeys.keys.find((candidate) => candidate.kid === kid);
    if (!refreshedKey) {
      throw new OAuthVerificationError(
        "oauth_provider_unavailable",
        "Apple sign-in keys are temporarily unavailable.",
        503,
      );
    }
    return refreshedKey;
  }
}

const fetchAppleKeys = async (url: string): Promise<AppleJwk[]> => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Apple JWKS request failed with ${response.status}`);
    }

    const body = (await response.json()) as AppleJwksResponse;
    const keys = body.keys?.filter(isAppleRsaKey) ?? [];
    if (keys.length === 0) throw new Error("Apple JWKS response did not include RSA keys.");
    return keys;
  } catch (error) {
    throw new OAuthVerificationError(
      "oauth_provider_unavailable",
      "Apple sign-in is temporarily unavailable.",
      503,
    );
  }
};

const parseJwt = (
  token: string,
): {
  header: AppleJwtHeader;
  payload: AppleJwtPayload;
  signedContent: string;
  signature: Buffer;
} => {
  const parts = token.split(".");
  if (parts.length !== 3 || parts.some((part) => !part)) {
    throw new OAuthVerificationError("invalid_oauth_token", "Invalid OAuth token.");
  }

  try {
    return {
      header: JSON.parse(base64UrlToBuffer(parts[0]).toString("utf8")) as AppleJwtHeader,
      payload: JSON.parse(base64UrlToBuffer(parts[1]).toString("utf8")) as AppleJwtPayload,
      signedContent: `${parts[0]}.${parts[1]}`,
      signature: base64UrlToBuffer(parts[2]),
    };
  } catch {
    throw new OAuthVerificationError("invalid_oauth_token", "Invalid OAuth token.");
  }
};

const base64UrlToBuffer = (value: string): Buffer => {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "="), "base64");
};

const audienceMatches = (audience: string | string[] | undefined, allowed: string[]): boolean => {
  if (typeof audience === "string") return allowed.includes(audience);
  return Array.isArray(audience) && audience.some((item) => allowed.includes(item));
};

const isAppleRsaKey = (key: AppleJwk): boolean =>
  key.kty === "RSA" && Boolean(key.kid) && Boolean(key.n) && Boolean(key.e);

const cleanOptionalString = (value: unknown): string | undefined => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
};

const normalizeOptionalEmail = (value: unknown): string | undefined => {
  const email = cleanOptionalString(value);
  return email?.toLowerCase();
};

const parseBooleanClaim = (value: AppleJwtPayload["email_verified"]): boolean | undefined => {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
};
