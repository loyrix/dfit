import { loginAction } from "../lib/actions";
import { getAdminSession } from "../lib/session";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const session = await getAdminSession();
  if (session) redirect("/");
  const params = await searchParams;

  return (
    <main className="grid min-h-screen place-items-center px-5 py-10">
      <section className="panel w-full max-w-md">
        <img className="brand-mark mb-6" src="/icon.png" alt="" />
        <div className="eyebrow">Restricted</div>
        <h1 className="title text-4xl">Admin login</h1>
        <p className="muted mt-3">Use the operational credentials configured for LogMyPlate.</p>

        {params?.error ? (
          <div className="error-callout mt-5">Invalid admin credentials.</div>
        ) : null}

        <form action={loginAction} className="form-grid mt-6">
          <label className="grid gap-2">
            <span className="text-sm muted">Username</span>
            <input className="input" name="username" required autoComplete="username" />
          </label>
          <label className="grid gap-2">
            <span className="text-sm muted">Password</span>
            <input
              className="input"
              name="password"
              required
              type="password"
              autoComplete="current-password"
            />
          </label>
          <button className="button mt-2" type="submit">
            Sign in
          </button>
        </form>
      </section>
    </main>
  );
}
