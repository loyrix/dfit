import Link from "next/link";
import { logoutAction } from "../lib/actions";
import { requireAdminSession } from "../lib/session";

const navItems = [
  ["/", "Overview"],
  ["/cost", "AI Usage"],
  ["/users", "Users"],
  ["/scans", "Scans"],
  ["/ai", "AI Controls"],
  ["/flags", "Flags & Notices"],
  ["/versions", "App Versions"],
  ["/audit", "Audit Log"],
] as const;

export async function AdminShell({ children }: { children: React.ReactNode }) {
  const session = await requireAdminSession();

  return (
    <div className="admin-shell">
      <aside className="sidebar">
        <div className="flex items-center gap-3">
          <img className="brand-mark" src="/icon.png" alt="" />
          <div>
            <div className="font-bold">LogMyPlate</div>
            <div className="text-sm muted">Admin backoffice</div>
          </div>
        </div>

        <nav className="mt-8 grid gap-1">
          {navItems.map(([href, label]) => (
            <Link className="nav-link" href={href} key={href}>
              {label}
            </Link>
          ))}
        </nav>

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
