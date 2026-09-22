"use server";

import { revalidatePath } from "next/cache";

import { requireAdminSession } from "../../lib/session";
import { runPrivydockSnapshot } from "./snapshots";

/**
 * Manual capture, for when you want history recorded now rather than waiting
 * for the next console visit to trip the freshness window.
 *
 * Unlike the automatic path this ignores the freshness guard entirely — an
 * explicit click should always do the thing it says. It also applies the
 * 90-day retention, like every capture.
 */
export async function capturePrivydockNow() {
  await requireAdminSession();
  await runPrivydockSnapshot(7);
  revalidatePath("/privydock");
}
