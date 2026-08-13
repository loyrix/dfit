import "server-only";

/**
 * Cloudflare GraphQL analytics for PrivyDock.
 *
 * The Free plan imposes limits this module works around rather than hides:
 *  - httpRequests1dGroups: 90-day retention, no path dimension. The only history.
 *  - httpRequestsAdaptiveGroups: path and host dimensions, but 8-day retention
 *    and a 1-day maximum query window, so it is queried a day at a time.
 *  - r2OperationsAdaptiveGroups: 90 days, 32-day maximum window, 1:10 sampled.
 *  - botScore and edgeResponseContentTypeName are Enterprise-only.
 *
 * The token is account-owned; it verifies at /accounts/{id}/tokens/verify, not
 * the user endpoint, which misleadingly reports "Invalid API Token".
 */

const ENDPOINT = "https://api.cloudflare.com/client/v4/graphql";

/** Browser families Cloudflare reports that indicate a real person. */
const HUMAN_BROWSERS = new Set([
  "Chrome",
  "MobileSafari",
  "Safari",
  "Firefox",
  "Edge",
  "ChromeMobile",
  "MobileFirefox",
  "Opera",
  "SamsungBrowser",
  "MobileChrome",
  "Vivaldi",
  "Brave",
  "Yandex",
  "UCBrowser",
  "MIUIBrowser",
  "IE",
]);

export type DailyTraffic = {
  date: string;
  pageViews: number;
  humanPageViews: number;
  botPageViews: number;
  unknownPageViews: number;
  uniqueIps: number;
  requests: number;
};

export type DownloadObject = {
  object: string;
  requests: number;
  bytes: number;
  /** Whole-file equivalents, for .dmg objects. */
  completed: number;
};

export type PathHit = { host: string; path: string; status: number; count: number };

function config() {
  const token = process.env.PRIVYDOCK_CLOUDFLARE_API_TOKEN;
  const account = process.env.PRIVYDOCK_CLOUDFLARE_ACCOUNT_ID;
  const zone = process.env.PRIVYDOCK_CLOUDFLARE_ZONE_ID;
  if (!token || !account || !zone) {
    throw new Error(
      "PRIVYDOCK_CLOUDFLARE_API_TOKEN, PRIVYDOCK_CLOUDFLARE_ACCOUNT_ID and PRIVYDOCK_CLOUDFLARE_ZONE_ID are required for the PrivyDock source.",
    );
  }
  return { token, account, zone };
}

async function graphql<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const { token } = config();
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });

  const payload = (await response.json()) as { data?: T; errors?: { message: string }[] };
  if (payload.errors?.length) {
    throw new Error(`Cloudflare analytics: ${payload.errors.map((e) => e.message).join("; ")}`);
  }
  if (!payload.data) throw new Error("Cloudflare analytics returned no data.");
  return payload.data;
}

/** Daily traffic with a human/bot split derived from browser family. */
export async function dailyTraffic(from: string, to: string): Promise<DailyTraffic[]> {
  const { zone } = config();
  const data = await graphql<{
    viewer: {
      zones: {
        httpRequests1dGroups: {
          dimensions: { date: string };
          sum: {
            pageViews: number;
            requests: number;
            browserMap: { pageViews: number; uaBrowserFamily: string }[];
          };
          uniq: { uniques: number };
        }[];
      }[];
    };
  }>(
    `
      query ($zone: String!, $from: Date!, $to: Date!) {
        viewer {
          zones(filter: { zoneTag: $zone }) {
            httpRequests1dGroups(
              limit: 100
              filter: { date_geq: $from, date_leq: $to }
              orderBy: [date_ASC]
            ) {
              dimensions {
                date
              }
              sum {
                pageViews
                requests
                browserMap {
                  pageViews
                  uaBrowserFamily
                }
              }
              uniq {
                uniques
              }
            }
          }
        }
      }
    `,
    { zone, from, to },
  );

  return (data.viewer.zones[0]?.httpRequests1dGroups ?? []).map((row) => {
    let human = 0;
    let unknown = 0;
    let bot = 0;
    for (const entry of row.sum.browserMap) {
      if (HUMAN_BROWSERS.has(entry.uaBrowserFamily)) human += entry.pageViews;
      else if (entry.uaBrowserFamily === "Unknown") unknown += entry.pageViews;
      else bot += entry.pageViews;
    }
    return {
      date: row.dimensions.date,
      pageViews: row.sum.pageViews,
      humanPageViews: human,
      botPageViews: bot,
      unknownPageViews: unknown,
      uniqueIps: row.uniq.uniques,
      requests: row.sum.requests,
    };
  });
}

/**
 * R2 object activity. Windows wider than 32 days are split, since the API
 * rejects them outright rather than truncating.
 */
export async function downloadObjects(
  from: Date,
  to: Date,
  bucket = "privydock-downloads",
): Promise<DownloadObject[]> {
  const { account } = config();
  const totals = new Map<string, { requests: number; bytes: number }>();

  for (const [start, end] of splitWindows(from, to, 31)) {
    const data = await graphql<{
      viewer: {
        accounts: {
          r2OperationsAdaptiveGroups: {
            dimensions: { objectName: string | null };
            sum: { requests: number; responseBytes: number };
          }[];
        }[];
      };
    }>(
      `
        query ($account: String!, $from: Time!, $to: Time!, $bucket: String!) {
          viewer {
            accounts(filter: { accountTag: $account }) {
              r2OperationsAdaptiveGroups(
                limit: 500
                filter: { datetime_geq: $from, datetime_leq: $to, bucketName: $bucket }
              ) {
                dimensions {
                  objectName
                }
                sum {
                  requests
                  responseBytes
                }
              }
            }
          }
        }
      `,
      { account, from: start.toISOString(), to: end.toISOString(), bucket },
    );

    for (const row of data.viewer.accounts[0]?.r2OperationsAdaptiveGroups ?? []) {
      const name = row.dimensions.objectName;
      if (!name) continue;
      const current = totals.get(name) ?? { requests: 0, bytes: 0 };
      current.requests += row.sum.requests;
      current.bytes += row.sum.responseBytes;
      totals.set(name, current);
    }
  }

  return [...totals.entries()]
    .map(([object, { requests, bytes }]) => ({
      object,
      requests,
      bytes,
      // Bytes are the honest download proxy: request counts include range and
      // revalidation requests that never transfer a whole file.
      completed: object.endsWith(".dmg") && bytes > 0 ? Math.round(bytes / DMG_BYTES) : 0,
    }))
    .sort((a, b) => b.bytes - a.bytes || b.requests - a.requests);
}

/** Size of a PrivyDock DMG. Used to convert bytes into whole downloads. */
const DMG_BYTES = 3_739_695;

/**
 * Top paths for a single day. The adaptive dataset caps queries at one day and
 * retains eight, so callers loop over recent days and aggregate.
 */
export async function pathHits(day: string, limit = 200): Promise<PathHit[]> {
  const { zone } = config();
  const data = await graphql<{
    viewer: {
      zones: {
        httpRequestsAdaptiveGroups: {
          count: number;
          dimensions: {
            clientRequestHTTPHost: string;
            clientRequestPath: string;
            edgeResponseStatus: number;
          };
        }[];
      }[];
    };
  }>(
    `
      query ($zone: String!, $from: Time!, $to: Time!, $limit: Int!) {
        viewer {
          zones(filter: { zoneTag: $zone }) {
            httpRequestsAdaptiveGroups(
              limit: $limit
              filter: { datetime_geq: $from, datetime_leq: $to }
              orderBy: [count_DESC]
            ) {
              count
              dimensions {
                clientRequestHTTPHost
                clientRequestPath
                edgeResponseStatus
              }
            }
          }
        }
      }
    `,
    { zone, from: `${day}T00:00:00Z`, to: `${day}T23:59:59Z`, limit },
  );

  return (data.viewer.zones[0]?.httpRequestsAdaptiveGroups ?? []).map((row) => ({
    host: row.dimensions.clientRequestHTTPHost,
    path: row.dimensions.clientRequestPath,
    status: row.dimensions.edgeResponseStatus,
    count: row.count,
  }));
}

function splitWindows(from: Date, to: Date, maxDays: number): [Date, Date][] {
  const windows: [Date, Date][] = [];
  const span = maxDays * 24 * 60 * 60 * 1000;
  let cursor = from.getTime();
  while (cursor < to.getTime()) {
    const end = Math.min(cursor + span, to.getTime());
    windows.push([new Date(cursor), new Date(end)]);
    cursor = end;
  }
  return windows;
}
