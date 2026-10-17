import "server-only";

import { unstable_cache } from "next/cache";

/**
 * Paddle transactions for PrivyDock revenue. Read-only; the console never
 * mutates billing state.
 */

/** One try at paying, as Paddle recorded it. */
export type PaymentAttempt = {
  status: string;
  error_code: string | null;
  /** "card", "paypal", "apple_pay", … */
  method: string | null;
  created_at: string;
};

export type Transaction = {
  id: string;
  status: string;
  currency_code: string;
  created_at: string;
  billed_at: string | null;
  customer_id: string | null;
  /** Null when Paddle has no customer yet, or the key may not read customers. */
  email: string | null;
  /** Minor units, e.g. cents. */
  total: number;
  country: string | null;
  /** Percentage taken off, when a percentage discount was applied. */
  discount_percent: number | null;
  /** Oldest first. */
  attempts: PaymentAttempt[];
};

function config() {
  const key = process.env.PRIVYDOCK_PADDLE_API_KEY;
  if (!key) throw new Error("PRIVYDOCK_PADDLE_API_KEY is required for PrivyDock revenue.");
  const environment = (process.env.PRIVYDOCK_PADDLE_ENV ?? "production").toLowerCase();
  const base =
    environment === "sandbox" ? "https://sandbox-api.paddle.com" : "https://api.paddle.com";
  return { key, base };
}

type PaddleTransaction = {
  id: string;
  status: string;
  currency_code: string;
  created_at: string;
  billed_at: string | null;
  customer_id: string | null;
  customer?: { email?: string } | null;
  discount?: { type?: string; amount?: string } | null;
  details?: { totals?: { total?: string; grand_total?: string } };
  billing_details?: { address?: { country_code?: string } };
  address?: { country_code?: string } | null;
  payments?: {
    status: string;
    error_code: string | null;
    created_at: string;
    method_details?: { type?: string } | null;
  }[];
};

/**
 * The customer, address and discount are separate entities in Paddle, each
 * behind its own permission. A key that can read transactions but not those
 * gets a 403 for asking, so the request is repeated without them: the page
 * loses the email column rather than the whole panel.
 */
const RELATED = "&include=customer,address,discount";

export async function listTransactions(limit = 100): Promise<Transaction[]> {
  const { key, base } = config();
  const url = `${base}/transactions?per_page=${limit}&order_by=created_at[DESC]`;
  const read = (extra: string) =>
    fetch(url + extra, { headers: { authorization: `Bearer ${key}` }, cache: "no-store" });

  let response = await read(RELATED);
  if (response.status === 403) response = await read("");

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Paddle ${response.status}: ${text.slice(0, 300)}`);
  }

  const payload = (await response.json()) as { data?: PaddleTransaction[] };
  return (payload.data ?? []).map((row) => ({
    id: row.id,
    status: row.status,
    currency_code: row.currency_code,
    created_at: row.created_at,
    billed_at: row.billed_at,
    customer_id: row.customer_id,
    email: row.customer?.email ?? null,
    // What the customer is asked to pay, tax included; `total` is the fallback
    // for rows old enough not to carry it.
    total:
      Number.parseInt(row.details?.totals?.grand_total ?? row.details?.totals?.total ?? "0", 10) ||
      0,
    country: row.billing_details?.address?.country_code ?? row.address?.country_code ?? null,
    discount_percent:
      row.discount?.type === "percentage" ? Number(row.discount.amount) || null : null,
    attempts: (row.payments ?? [])
      .map((payment) => ({
        status: payment.status,
        error_code: payment.error_code,
        method: payment.method_details?.type ?? null,
        created_at: payment.created_at,
      }))
      .sort((left, right) => left.created_at.localeCompare(right.created_at)),
  }));
}

export type Outcome = {
  /** Short enough to group and count by. */
  stage: string;
  /** One sentence on what Paddle saw. */
  detail: string;
  tone: "green" | "red" | "gray";
};

/** What Paddle's error codes mean for the person looking at the row. */
const FAILURES: Record<string, string> = {
  authentication_failed: "The bank's verification step failed.",
  blocked_card: "The card is blocked by its issuer.",
  canceled: "The customer cancelled the payment.",
  declined: "The bank declined the payment.",
  declined_not_retryable: "The bank declined the payment and will not accept a retry.",
  expired_card: "The card has expired.",
  fraud: "Blocked as suspected fraud.",
  invalid_amount: "The bank rejected the amount.",
  invalid_payment_details: "The payment details were entered wrongly.",
  issuer_unavailable: "The bank could not be reached.",
  not_enough_balance: "Not enough balance on the card or account.",
  preferred_network_not_supported: "The card network is not supported.",
  psp_error: "The payment processor failed. Not the customer's doing.",
  system_error: "Paddle failed. Not the customer's doing.",
  transaction_not_permitted: "The bank does not allow this kind of payment on the card.",
};

const METHODS: Record<string, string> = {
  card: "card",
  paypal: "PayPal",
  apple_pay: "Apple Pay",
  google_pay: "Google Pay",
};

/**
 * Why a transaction is where it is, as far as Paddle can know.
 *
 * Paddle records how far a checkout got and what the bank or wallet answered.
 * It does not know why someone closed a window, so an abandoned step is named
 * for the step, never for a motive.
 */
export function explainTransaction(transaction: Transaction): Outcome {
  const { status, attempts } = transaction;
  const last = attempts.at(-1);
  const method = last?.method ? (METHODS[last.method] ?? last.method) : "an unknown method";
  const tries = attempts.length > 1 ? ` ${attempts.length} attempts.` : "";

  if (status === "completed" || status === "billed" || status === "paid") {
    return { stage: "Paid", detail: "Payment taken.", tone: "green" };
  }
  if (status === "canceled") {
    return { stage: "Cancelled", detail: "Cancelled in Paddle.", tone: "gray" };
  }
  if (status === "past_due") {
    return { stage: "Past due", detail: "Payment is overdue.", tone: "red" };
  }

  if (!last) {
    return transaction.customer_id
      ? {
          stage: "Left before paying",
          detail: "Gave an email and address, then never submitted a payment.",
          tone: "gray",
        }
      : {
          stage: "Only opened checkout",
          detail: "Opened the checkout and left without entering an email.",
          tone: "gray",
        };
  }

  if (last.status === "error") {
    const code = last.error_code ?? "unknown";
    return {
      stage: code === "psp_error" || code === "system_error" ? "Processor failed" : "Declined",
      detail: `${FAILURES[code] ?? `Failed with "${code}".`} Tried to pay by ${method}.${tries}`,
      tone: "red",
    };
  }

  if (last.status === "action_required") {
    // The payment is waiting on the customer, somewhere Paddle cannot see into.
    if (last.method === "paypal") {
      return {
        stage: "PayPal not approved",
        detail: `Chose PayPal and was sent there to approve; the approval never came back.${tries}`,
        tone: "gray",
      };
    }
    if (last.method === "card") {
      return {
        stage: "Bank check not finished",
        detail: `The bank asked the cardholder to verify the payment (3-D Secure) and that was never completed.${tries}`,
        tone: "gray",
      };
    }
    return {
      stage: "Waiting on customer",
      detail: `Paying by ${method} needed a further step from the customer that was never completed.${tries}`,
      tone: "gray",
    };
  }

  if (last.status === "pending") {
    return {
      stage: "In progress",
      detail: `Payment by ${method} is being processed.`,
      tone: "gray",
    };
  }
  if (last.status === "canceled") {
    return {
      stage: "Customer cancelled",
      detail: `Started paying by ${method} and cancelled.${tries}`,
      tone: "gray",
    };
  }

  return {
    stage: "Finishing",
    detail: `Payment by ${method} is ${last.status}; Paddle has not completed the order yet.`,
    tone: "gray",
  };
}

/** Completed revenue in major units, net of refunded and cancelled rows. */
export function netRevenue(transactions: Transaction[]) {
  return (
    transactions
      .filter(
        (transaction) => transaction.status === "completed" || transaction.status === "billed",
      )
      .reduce((sum, transaction) => sum + transaction.total, 0) / 100
  );
}

/** Cached for the panels; revenue changes on the order of days, not seconds. */
export const cachedTransactions = unstable_cache(
  (limit: number) => listTransactions(limit),
  ["privydock", "transactions"],
  { revalidate: 60 },
);
