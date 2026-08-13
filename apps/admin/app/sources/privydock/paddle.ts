import "server-only";

import { unstable_cache } from "next/cache";

/**
 * Paddle transactions for PrivyDock revenue. Read-only; the console never
 * mutates billing state.
 */

export type Transaction = {
  id: string;
  status: string;
  currency_code: string;
  created_at: string;
  billed_at: string | null;
  customer_id: string | null;
  /** Minor units, e.g. cents. */
  total: number;
  country: string | null;
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
  details?: { totals?: { total?: string } };
  billing_details?: { address?: { country_code?: string } };
  address?: { country_code?: string };
};

export async function listTransactions(limit = 100): Promise<Transaction[]> {
  const { key, base } = config();
  const response = await fetch(`${base}/transactions?per_page=${limit}&order_by=created_at[DESC]`, {
    headers: { authorization: `Bearer ${key}` },
    cache: "no-store",
  });

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
    total: Number.parseInt(row.details?.totals?.total ?? "0", 10) || 0,
    country: row.billing_details?.address?.country_code ?? row.address?.country_code ?? null,
  }));
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
