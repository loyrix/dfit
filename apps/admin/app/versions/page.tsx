import { AdminShell } from "../components/shell";
import { Badge, PageHeader } from "../components/ui";
import { updateAppUpdatePolicyAction } from "../lib/actions";
import { adminGet, type AppUpdatePlatformPolicy, type AppUpdatePolicy } from "../lib/api";
import { createMutationKey } from "../lib/idempotency";

export const dynamic = "force-dynamic";

export default async function VersionsPage() {
  const { policy } = await adminGet<{ policy: AppUpdatePolicy }>("/admin/app-update-policy");

  return (
    <AdminShell>
      <PageHeader
        eyebrow="Release safety"
        title="App version controls"
        description="Set optional or mandatory update prompts by platform build number. Mandatory updates block app usage until the user opens the store."
      />

      <form action={updateAppUpdatePolicyAction} className="grid gap-4">
        <input
          name="idempotencyKey"
          type="hidden"
          value={createMutationKey("app-update-policy:update")}
        />

        <section className="panel">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">Runtime policy</h2>
              <p className="muted mt-1 text-sm">
                Keep this disabled until you are ready to show prompts in production.
              </p>
            </div>
            <label className="flex items-center gap-2">
              <input name="enabled" type="checkbox" defaultChecked={policy.enabled} /> Enabled
            </label>
          </div>
          <div className="mt-3 flex gap-2">
            <Badge tone={policy.enabled ? "green" : "red"}>
              {policy.enabled ? "Live" : "Disabled"}
            </Badge>
            <span className="badge">Build below latest = optional</span>
            <span className="badge">Build below minimum = mandatory</span>
          </div>
        </section>

        <section className="grid two-col">
          <PlatformPolicyPanel platform="ios" title="iOS" policy={policy.ios} />
          <PlatformPolicyPanel platform="android" title="Android" policy={policy.android} />
        </section>

        <section className="panel">
          <label className="block">
            <span className="font-semibold">Reason</span>
            <input
              className="input mt-2"
              name="reason"
              placeholder="Why this update policy is changing"
              minLength={8}
              maxLength={500}
              required
            />
          </label>
          <div className="mt-4 flex justify-end">
            <button className="button" type="submit">
              Save version policy
            </button>
          </div>
        </section>
      </form>
    </AdminShell>
  );
}

function PlatformPolicyPanel({
  platform,
  title,
  policy,
}: {
  platform: "ios" | "android";
  title: string;
  policy: AppUpdatePlatformPolicy;
}) {
  return (
    <div className="panel">
      <h2 className="text-xl font-bold">{title}</h2>
      <p className="muted mt-1 text-sm">
        Current build must be greater than or equal to the minimum supported build.
      </p>

      <div className="form-grid mt-4">
        <label>
          <span className="font-semibold">Latest build</span>
          <input
            className="input mt-2"
            name={`${platform}.latestBuild`}
            type="number"
            min="0"
            step="1"
            defaultValue={policy.latestBuild}
            required
          />
        </label>
        <label>
          <span className="font-semibold">Minimum supported build</span>
          <input
            className="input mt-2"
            name={`${platform}.minSupportedBuild`}
            type="number"
            min="0"
            step="1"
            defaultValue={policy.minSupportedBuild}
            required
          />
        </label>
        <label>
          <span className="font-semibold">Latest version name</span>
          <input
            className="input mt-2"
            name={`${platform}.latestVersion`}
            defaultValue={policy.latestVersion ?? ""}
            placeholder="1.0.0"
            maxLength={32}
          />
        </label>
        <label>
          <span className="font-semibold">Store URL</span>
          <input
            className="input mt-2"
            name={`${platform}.storeUrl`}
            defaultValue={policy.storeUrl ?? ""}
            placeholder="https://..."
            maxLength={500}
          />
        </label>
        <label>
          <span className="font-semibold">Optional title</span>
          <input
            className="input mt-2"
            name={`${platform}.optionalTitle`}
            defaultValue={policy.optionalTitle}
            minLength={3}
            maxLength={120}
            required
          />
        </label>
        <label>
          <span className="font-semibold">Optional message</span>
          <textarea
            className="textarea mt-2"
            name={`${platform}.optionalMessage`}
            defaultValue={policy.optionalMessage}
            minLength={3}
            maxLength={500}
            required
          />
        </label>
        <label>
          <span className="font-semibold">Mandatory title</span>
          <input
            className="input mt-2"
            name={`${platform}.mandatoryTitle`}
            defaultValue={policy.mandatoryTitle}
            minLength={3}
            maxLength={120}
            required
          />
        </label>
        <label>
          <span className="font-semibold">Mandatory message</span>
          <textarea
            className="textarea mt-2"
            name={`${platform}.mandatoryMessage`}
            defaultValue={policy.mandatoryMessage}
            minLength={3}
            maxLength={500}
            required
          />
        </label>
      </div>
    </div>
  );
}
