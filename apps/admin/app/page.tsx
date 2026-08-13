import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { defaultProjectId, getProjectSource, projectCookieName } from "./lib/registry";

export const dynamic = "force-dynamic";

/**
 * The root has no content of its own — it forwards to whichever project was last
 * open, falling back to the default. The cookie is written by the switcher.
 */
export default async function RootPage() {
  const remembered = (await cookies()).get(projectCookieName)?.value;
  const project = remembered && getProjectSource(remembered) ? remembered : defaultProjectId;

  redirect(`/${project}`);
}
