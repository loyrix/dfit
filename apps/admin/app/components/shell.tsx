import { AdminNav } from "./nav";
import { ProjectSwitcher } from "./project-switcher";
import { logoutAction } from "../lib/actions";
import { requireAdminSession } from "../lib/session";
import type { ProjectSource } from "../sources/types";

/**
 * `project` is optional so pages that predate the registry keep working. When
 * given, the shell wears that product's mark and palette — operating the wrong
 * product by mistake should be visibly obvious, not a matter of reading the URL.
 */
export async function AdminShell({
  children,
  project,
}: {
  children: React.ReactNode;
  project?: ProjectSource;
}) {
  const session = await requireAdminSession();
  const brand = project?.brand;

  return (
    <div className="admin-shell" data-project={project?.id}>
      <aside className="sidebar">
        <div className="flex items-center gap-3">
          <img className="brand-mark" src={brand?.logo ?? "/icon.png"} alt="" />
          <div>
            <div className="font-bold">{project?.label ?? "Loyrix"}</div>
            <div className="text-sm muted">{brand?.tagline ?? "Centralized backoffice"}</div>
          </div>
        </div>

        <ProjectSwitcher />

        <AdminNav />

        <div className="admin-account">
          <div className="text-sm muted">Signed in as</div>
          <div className="mt-1 font-semibold">{session.actor}</div>
          <form action={logoutAction} className="mt-4">
            <button className="button button-secondary w-full" type="submit">
              Sign out
            </button>
          </form>
        </div>
      </aside>
      <main className="content">{children}</main>
    </div>
  );
}
