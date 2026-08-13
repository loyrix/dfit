"use server";

import { revalidatePath } from "next/cache";

import { requireAdminSession } from "../../lib/session";
import { runPrivydockSnapshot } from "./snapshots";

/**
 * Manual capture, for when you want history recorded now rather than waiting
 * for the next console visit to trip the freshness window.
 *
 * Unlike the automatic path this ignores the freshness guard entirely — an
 * explicit click should always do the thing it says.
 */
export async function capturePrivydockNow() {
  await requireAdminSession();
  await runPrivydockSnapshot(7);
  revalidatePath("/privydock");
}
