import type {
  SubscriptionStatusValue,
  SubscriptionStore,
  UpsertSubscriptionEntitlementInput,
} from "../repositories/app-repository.js";

export type RevenueCatConfig = {
  restApiKey?: string;
  apiBaseUrl: string;
  entitlementId: string;
};

type RevenueCatSubscriberResponse = {
  subscriber?: {
    entitlements?: Record<string, RevenueCatEntitlementInfo | undefined>;
    subscriptions?: Record<string, RevenueCatSubscriptionInfo | undefined>;
  };
};

type RevenueCatEntitlementInfo = {
  expires_date?: string | null;
  purchase_date?: string | null;
  product_identifier?: string | null;
};

type RevenueCatSubscriptionInfo = {
  expires_date?: string | null;
  purchase_date?: string | null;
  store?: string | null;
  unsubscribe_detected_at?: string | null;
  billing_issues_detected_at?: string | null;
};

export type RevenueCatWebhookEvent = {
  id: string;
  type: string;
  appUserId?: string;
  entitlementIds: string[];
  productId?: string;
  store?: SubscriptionStore;
  environment?: string;
  purchasedAt?: string;
  expirationAt?: string;
  willRenew?: boolean;
  rawPayload: unknown;
};

export class RevenueCatClient {
  constructor(private readonly config: RevenueCatConfig) {}

  async fetchEntitlement(
    appUserId: string,
  ): Promise<UpsertSubscriptionEntitlementInput | undefined> {
    const apiKey = this.config.restApiKey?.trim();
    if (!apiKey) return undefined;

    const response = await fetch(
      `${this.config.apiBaseUrl.replace(/\/$/, "")}/subscribers/${encodeURIComponent(appUserId)}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: "application/json",
        },
      },
    );
    if (!response.ok) {
      throw new Error(`RevenueCat subscriber lookup failed with ${response.status}.`);
    }

    const payload = (await response.json()) as RevenueCatSubscriberResponse;
    return parseSubscriberEntitlement(payload, appUserId, this.config.entitlementId);
  }
}

export const parseSubscriberEntitlement = (
  payload: RevenueCatSubscriberResponse,
  appUserId: string,
  entitlementId: string,
): UpsertSubscriptionEntitlementInput | undefined => {
  const entitlement = payload.subscriber?.entitlements?.[entitlementId];
  if (!entitlement) return undefined;

  const productId = cleanString(entitlement?.product_identifier);
  const subscription = productId ? payload.subscriber?.subscriptions?.[productId] : undefined;
  const expiration = cleanString(entitlement?.expires_date ?? subscription?.expires_date);
  const purchase = cleanString(entitlement?.purchase_date ?? subscription?.purchase_date);
  const active = expiration == null || Date.parse(expiration) > Date.now();
  const status = subscription?.billing_issues_detected_at
    ? "billing_issue"
    : subscription?.unsubscribe_detected_at
      ? "cancelled"
      : active
        ? "active"
        : "expired";

  return {
    appUserId,
    entitlementId,
    status,
    store: mapStore(subscription?.store),
    productId,
    currentPeriodStart: purchase,
    currentPeriodEnd: expiration ?? undefined,
    willRenew: !subscription?.unsubscribe_detected_at && active,
    rawPayload: payload,
  };
};

export const parseRevenueCatWebhookEvent = (
  payload: unknown,
  entitlementId: string,
): RevenueCatWebhookEvent | undefined => {
  if (!isRecord(payload)) return undefined;
  const event = payload.event;
  if (!isRecord(event)) return undefined;

  const id = cleanString(event.id);
  const type = cleanString(event.type);
  if (!id || !type) return undefined;

  const entitlementIds = parseEntitlementIds(event);
  const appUserId = cleanString(event.app_user_id);
  const productId = cleanString(event.product_id);
  const expirationAt = millisToIso(event.expiration_at_ms);
  const purchasedAt = millisToIso(event.purchased_at_ms);

  if (!entitlementIds.includes(entitlementId)) {
    return {
      id,
      type,
      appUserId,
      entitlementIds,
      productId,
      store: mapStore(event.store),
      environment: cleanString(event.environment),
      purchasedAt,
      expirationAt,
      rawPayload: payload,
    };
  }

  return {
    id,
    type,
    appUserId,
    entitlementIds,
    productId,
    store: mapStore(event.store),
    environment: cleanString(event.environment),
    purchasedAt,
    expirationAt,
    willRenew: webhookWillRenew(type),
    rawPayload: payload,
  };
};

export const webhookStatus = (
  eventType: string,
  expirationAt?: string,
): SubscriptionStatusValue => {
  const normalized = eventType.trim().toUpperCase();
  if (normalized === "EXPIRATION" || normalized === "REFUND" || normalized === "TRANSFER") {
    return "expired";
  }
  if (normalized === "CANCELLATION") return "cancelled";
  if (normalized === "BILLING_ISSUE") return "billing_issue";
  if (
    [
      "INITIAL_PURCHASE",
      "RENEWAL",
      "UNCANCELLATION",
      "PRODUCT_CHANGE",
      "SUBSCRIPTION_EXTENDED",
      "TEMPORARY_ENTITLEMENT_GRANT",
    ].includes(normalized)
  ) {
    return "active";
  }
  if (expirationAt && Date.parse(expirationAt) <= Date.now()) return "expired";
  return "unknown";
};

const webhookWillRenew = (eventType: string): boolean | undefined => {
  const normalized = eventType.trim().toUpperCase();
  if (normalized === "CANCELLATION" || normalized === "EXPIRATION" || normalized === "REFUND") {
    return false;
  }
  if (
    normalized === "INITIAL_PURCHASE" ||
    normalized === "RENEWAL" ||
    normalized === "UNCANCELLATION"
  ) {
    return true;
  }
  return undefined;
};

const parseEntitlementIds = (event: Record<string, unknown>): string[] => {
  const ids = event.entitlement_ids;
  if (Array.isArray(ids)) {
    return ids.map(cleanString).filter((value): value is string => Boolean(value));
  }
  const legacy = cleanString(event.entitlement_id);
  return legacy ? [legacy] : [];
};

const mapStore = (value: unknown): SubscriptionStore | undefined => {
  const store = cleanString(value)?.toLowerCase();
  if (!store) return undefined;
  if (["app_store", "mac_app_store"].includes(store)) return "app_store";
  if (store === "play_store") return "play_store";
  if (store === "stripe" || store === "rc_billing" || store === "paddle") return "stripe";
  if (store === "promotional" || store === "test_store") return "promotional";
  return "unknown";
};

const millisToIso = (value: unknown): string | undefined => {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  return new Date(value).toISOString();
};

const cleanString = (value: unknown): string | undefined => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
