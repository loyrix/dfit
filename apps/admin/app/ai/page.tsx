import { AdminShell } from "../components/shell";
import { Badge, PageHeader, formatDate } from "../components/ui";
import {
  activatePromptAction,
  createPromptAction,
  setDefaultModelAction,
  updateModelAction,
} from "../lib/actions";
import { adminGet, type AiModel, type AiPrompt } from "../lib/api";

export const dynamic = "force-dynamic";

export default async function AiPage() {
  const [{ models }, { prompts }] = await Promise.all([
    adminGet<{ models: AiModel[] }>("/admin/ai/models"),
    adminGet<{ prompts: AiPrompt[] }>("/admin/ai/prompts"),
  ]);
  const activePrompt = prompts.find((prompt) => prompt.isActive);

  return (
    <AdminShell>
      <PageHeader
        eyebrow="Vertex AI"
        title="Model and prompt controls"
        description="Switch the active Vertex Gemini model, tune safe generation parameters, create prompt versions, and activate a rollback without releasing a mobile build."
      />

      <section className="grid two-col">
        <div className="panel">
          <h2 className="text-xl font-bold">Vertex models</h2>
          <div className="mt-4 grid gap-4">
            {models.map((model) => (
              <div className="panel-light rounded-lg p-4" key={model.key}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold">{model.displayName}</h3>
                      {model.isDefault ? <Badge>Default</Badge> : null}
                      <Badge tone={model.enabled ? "green" : "red"}>
                        {model.enabled ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                    <p className="muted mt-1 text-sm">
                      {model.platform} / {model.modelFamily} / {model.model}
                    </p>
                  </div>
                </div>

                <form action={updateModelAction} className="form-grid mt-4">
                  <input name="key" type="hidden" value={model.key} />
                  <label className="flex items-center gap-2 text-sm">
                    <input name="enabled" type="checkbox" defaultChecked={model.enabled} /> Enabled
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <label className="grid gap-2">
                      <span className="text-sm muted">Max tokens</span>
                      <input
                        className="input"
                        name="maxOutputTokens"
                        type="number"
                        defaultValue={model.maxOutputTokens}
                      />
                    </label>
                    <label className="grid gap-2">
                      <span className="text-sm muted">Temperature</span>
                      <input
                        className="input"
                        name="temperature"
                        type="number"
                        step="0.01"
                        defaultValue={model.temperature}
                      />
                    </label>
                    <label className="grid gap-2">
                      <span className="text-sm muted">Top P</span>
                      <input
                        className="input"
                        name="topP"
                        type="number"
                        step="0.01"
                        defaultValue={model.topP}
                      />
                    </label>
                  </div>
                  <input
                    className="input"
                    name="notes"
                    placeholder="Notes"
                    defaultValue={model.notes ?? ""}
                  />
                  <input
                    className="input"
                    name="reason"
                    placeholder="Reason for model config change"
                    required
                  />
                  <button className="button button-secondary" type="submit">
                    Save model settings
                  </button>
                </form>

                {!model.isDefault ? (
                  <form action={setDefaultModelAction} className="mt-3 flex gap-3">
                    <input name="key" type="hidden" value={model.key} />
                    <input
                      className="input"
                      name="reason"
                      placeholder="Reason for switching default model"
                      required
                    />
                    <button className="button" type="submit">
                      Make default
                    </button>
                  </form>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <h2 className="text-xl font-bold">Active prompt</h2>
          {activePrompt ? (
            <div className="mt-4">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">{activePrompt.title}</h3>
                <Badge>{activePrompt.version}</Badge>
              </div>
              <p className="muted mt-1 text-sm">
                Updated {formatDate(activePrompt.updatedAt)} by{" "}
                {activePrompt.updatedBy ?? "unknown"}
              </p>
              <pre className="mt-4 max-h-[360px] overflow-auto rounded-lg bg-black/30 p-3 text-xs">
                {activePrompt.body}
              </pre>
            </div>
          ) : (
            <p className="muted mt-3">No active prompt is configured.</p>
          )}
        </div>
      </section>

      <section className="grid two-col mt-4">
        <div className="panel">
          <h2 className="text-xl font-bold">Prompt versions</h2>
          <table className="table mt-4">
            <thead>
              <tr>
                <th>Version</th>
                <th>Status</th>
                <th>Updated</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {prompts.map((prompt) => (
                <tr key={prompt.id}>
                  <td>
                    <div className="font-semibold">{prompt.title}</div>
                    <div className="muted text-xs">{prompt.version}</div>
                  </td>
                  <td>{prompt.isActive ? <Badge>Active</Badge> : prompt.status}</td>
                  <td>{formatDate(prompt.updatedAt)}</td>
                  <td>
                    {!prompt.isActive ? (
                      <form action={activatePromptAction} className="flex gap-2">
                        <input name="id" type="hidden" value={prompt.id} />
                        <input
                          className="input"
                          name="reason"
                          placeholder="Activation reason"
                          required
                        />
                        <button className="button" type="submit">
                          Activate
                        </button>
                      </form>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="panel">
          <h2 className="text-xl font-bold">Create prompt draft</h2>
          <form action={createPromptAction} className="form-grid mt-4">
            <input className="input" name="version" placeholder="food_photo_v6" required />
            <input className="input" name="title" placeholder="Prompt title" required />
            <textarea
              className="textarea"
              name="body"
              placeholder="Prompt body. Include {{USER_HINT_BLOCK}} where the user food note should be inserted."
              required
            />
            <input
              className="input"
              name="reason"
              placeholder="Reason for creating this prompt"
              required
            />
            <button className="button" type="submit">
              Create draft
            </button>
          </form>
        </div>
      </section>
    </AdminShell>
  );
}
