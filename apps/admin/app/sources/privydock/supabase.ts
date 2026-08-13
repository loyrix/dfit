import "server-only";

/**
 * PrivyDock has no admin API, so the console reads its Supabase directly over
 * PostgREST. Service-role key, server-only — RLS is enabled and every table is
 * revoked from anon/authenticated, so nothing here works from a browser.
 */

export type License = {
  id: string;
  license_key: string;
  customer_email: string;
  status: "active" | "revoked" | "refunded";
  plan_code: string;
  paddle_transaction_id: string;
  activated_at: string | null;
  last_validated_at: string | null;
  created_at: string;
};

export type LicenseActivation = {
  id: string;
  license_id: string;
  device_name: string;
  app_version: string | null;
  os_version: string | null;
  first_activated_at: string;
  last_validated_at: string;
};

export type WaitlistSignup = {
  email: string;
  normalized_email: string;
  source: string;
  first_joined_at: string;
  last_joined_at: string;
};

export type PaddleWebhookEvent = {
  event_id: string;
  event_type: string;
  occurred_at: string;
  processed_at: string;
};

function config() {
  const url = process.env.PRIVYDOCK_SUPABASE_URL;
  const key = process.env.PRIVYDOCK_SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "PRIVYDOCK_SUPABASE_URL and PRIVYDOCK_SUPABASE_SERVICE_ROLE_KEY are required for the PrivyDock source.",
    );
  }
  return { url: url.replace(/\/$/, ""), key };
}

/**
 * Returns rows plus the exact total. PostgREST reports the count in
 * `content-range` when asked, which avoids a second round trip for pagination.
 */
async function select<T>(
  table: string,
  query: string,
  { limit }: { limit?: number } = {},
): Promise<{ rows: T[]; total: number }> {
  const { url, key } = config();
  const separator = query ? "&" : "";
  const range = limit ? `0-${limit - 1}` : undefined;

  const response = await fetch(`${url}/rest/v1/${table}?${query}${separator}`, {
    headers: {
      apikey: key,
      authorization: `Bearer ${key}`,
      prefer: "count=exact",
      ...(range ? { range } : {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase ${table} ${response.status}: ${text.slice(0, 300)}`);
  }

  const rows = (await response.json()) as T[];
  const total = Number.parseInt(
    response.headers.get("content-range")?.split("/")[1] ?? `${rows.length}`,
    10,
  );

  return { rows, total: Number.isFinite(total) ? total : rows.length };
}

export function listLicenses(limit = 100) {
  return select<License>(
    "licenses",
    "select=id,license_key,customer_email,status,plan_code,paddle_transaction_id,activated_at,last_validated_at,created_at&order=created_at.desc",
    { limit },
  );
}

export function listActivations(limit = 500) {
  return select<LicenseActivation>(
    "license_activations",
    "select=id,license_id,device_name,app_version,os_version,first_activated_at,last_validated_at&order=last_validated_at.desc",
    { limit },
  );
}

export function listWaitlist(limit = 200) {
  return select<WaitlistSignup>(
    "waitlist_signups",
    "select=email,normalized_email,source,first_joined_at,last_joined_at&order=first_joined_at.desc",
    { limit },
  );
}

export function listWebhookEvents(limit = 20) {
  return select<PaddleWebhookEvent>(
    "paddle_webhook_events",
    "select=event_id,event_type,occurred_at,processed_at&order=occurred_at.desc",
    { limit },
  );
}

/** Cheap existence-free count: ask for zero rows and read the header. */
export async function countRows(table: string) {
  const { total } = await select(table, "select=*", { limit: 1 });
  return total;
}

export type Snapshot = {
  project: string;
  metric: string;
  /** ISO date, YYYY-MM-DD. */
  day: string;
  value: number;
};

const SNAPSHOT_TABLE = "loyrix_metric_snapshots";

/**
 * Upserts on the (project, metric, day) primary key, so re-running a day
 * overwrites rather than duplicating and a backfill can be repeated safely.
 * Batched because a 90-day backfill is a few thousand rows.
 */
export async function upsertSnapshots(rows: Snapshot[], batchSize = 500) {
  if (!rows.length) return 0;
  const { url, key } = config();

  for (let index = 0; index < rows.length; index += batchSize) {
    const batch = rows.slice(index, index + batchSize);
    const response = await fetch(`${url}/rest/v1/${SNAPSHOT_TABLE}`, {
      method: "POST",
      headers: {
        apikey: key,
        authorization: `Bearer ${key}`,
        "content-type": "application/json",
        prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify(batch),
      cache: "no-store",
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Supabase snapshot upsert ${response.status}: ${text.slice(0, 300)}`);
    }
  }

  return rows.length;
}

export function listSnapshots(project: string, metric: string, sinceDay: string) {
  return select<Snapshot>(
    SNAPSHOT_TABLE,
    `select=project,metric,day,value&project=eq.${project}&metric=eq.${metric}&day=gte.${sinceDay}&order=day.asc`,
    { limit: 400 },
  );
}
