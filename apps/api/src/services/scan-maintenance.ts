import type { SqlClient } from "../db/client.js";

// A scan session is created in "prepared" state when the camera opens (the
// mobile app warms up the prepare round-trip before the photo is taken), so
// sessions abandoned before capture stay "prepared" forever. Sweep them into
// "cancelled" once they are old enough that no analyze call can still arrive.
const stalePreparedAge = "1 hour";

const sweepIntervalMs = 5 * 60 * 1000;
let lastSweepStartedAt = 0;

export const reconcileStaleScanSessions = async (sql: SqlClient): Promise<number> => {
  const cancelled = await sql<{ id: string }[]>`
    update scan_sessions
    set status = 'cancelled', updated_at = now()
    where status = 'prepared'
      and created_at < now() - ${stalePreparedAge}::interval
    returning id
  `;
  return cancelled.length;
};

/**
 * Opportunistic sweep for request paths that read scan data (admin overview
 * and scan list). Runs at most once per interval per process; failures are
 * swallowed so a maintenance hiccup never breaks the read.
 */
export const reconcileStaleScanSessionsThrottled = async (sql: SqlClient): Promise<void> => {
  const now = Date.now();
  if (now - lastSweepStartedAt < sweepIntervalMs) return;
  lastSweepStartedAt = now;
  try {
    await reconcileStaleScanSessions(sql);
  } catch {
    // Retried on the next sweep window.
  }
};
