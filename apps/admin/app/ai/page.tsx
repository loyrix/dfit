import { AdminShell } from "../components/shell";
import { Badge, EmptyState, Metric, PageHeader, formatDate } from "../components/ui";
import {
  activatePromptAction,
  createPromptAction,
  setDefaultModelAction,
  updateModelAction,
} from "../lib/actions";
import { adminGet, type AiModel, type AiPrompt } from "../lib/api";
import { createMutationKey } from "../lib/idempotency";

export const dynamic = "force-dynamic";

type AiSearchParams = {
  modelQuery?: string;
  modelStatus?: string;
  promptQuery?: string;
  promptStatus?: string;
};

export default async function AiPage({ searchParams }: { searchParams?: Promise<AiSearchParams> }) {
  const params = (await searchParams) ?? {};
  const [{ models }, { prompts }] = await Promise.all([
    adminGet<{ models: AiModel[] }>("/admin/ai/models"),
    adminGet<{ prompts: AiPrompt[] }>("/admin/ai/prompts"),
  ]);
  const activeModel = models.find((model) => model.isDefault);
  const activePrompts = prompts.filter((prompt) => prompt.isActive);
  const filteredModels = filterModels(models, params);
  const filteredPrompts = filterPrompts(prompts, params);

  return (
    <AdminShell>
      <PageHeader
        eyebrow="Vertex AI"
        title="Model and prompt controls"
        description="Switch the active Vertex Gemini model, tune safe generation parameters, create prompt versions, and activate a rollback without releasing a mobile build."
      />

      <section className="grid metrics">
        <Metric
          label="Default model"
          value={activeModel?.displayName ?? "None"}
          sub={activeModel?.model}
        />
        <Metric label="Enabled models" value={models.filter((model) => model.enabled).length} />
        <Metric
          label="Active prompts"
          value={activePrompts.length || "None"}
          sub={activePrompts.map((prompt) => prompt.key).join(", ") || "No prompt active"}
        />
        <Metric
          label="Prompt drafts"
          value={prompts.filter((prompt) => prompt.status === "draft").length}
        />
      </section>

      <section className="panel mt-4">
        <div className="section-head">
          <h2 className="text-xl font-bold">Vertex model configs</h2>
          <span className="muted text-sm">{filteredModels.length} shown</span>
        </div>
        <form className="toolbar toolbar-two" action="/ai">
          <label>
            <span className="metric-label">Search models</span>
            <input
              className="input"
              name="modelQuery"
              placeholder="Display name, model, or key"
              defaultValue={params.modelQuery ?? ""}
            />
          </label>
          <label>
            <span className="metric-label">Status</span>
            <select
              className="select"
              name="modelStatus"
              defaultValue={params.modelStatus ?? "all"}
            >
              <option value="all">All models</option>
              <option value="default">Default</option>
              <option value="enabled">Enabled</option>
              <option value="disabled">Disabled</option>
            </select>
          </label>
          <button className="button" type="submit">
            Filter
          </button>
        </form>
        <div className="table-wrap">
          <table className="table table-compact">
            <thead>
              <tr>
                <th>Model</th>
                <th>Status</th>
                <th>Generation</th>
                <th>Pricing</th>
                <th>Updated</th>
                <th>Reasoned update</th>
              </tr>
            </thead>
            <tbody>
              {filteredModels.map((model) => (
                <tr key={model.key}>
                  <td>
                    <div className="font-semibold">{model.displayName}</div>
                    <div className="muted text-xs break-cell">{model.key}</div>
                    <div className="muted text-xs">
                      {model.platform} / {model.modelFamily} / {model.model}
                    </div>
                  </td>
                  <td>
                    <div className="inline-controls">
                      {model.isDefault ? <Badge>Default</Badge> : null}
                      <Badge tone={model.enabled ? "green" : "red"}>
                        {model.enabled ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                    {model.fallbackKey ? (
                      <div className="muted mt-1 text-xs break-cell">
                        Fallback {model.fallbackKey}
                      </div>
                    ) : null}
                  </td>
                  <td>
                    <div>{model.maxOutputTokens} max tokens</div>
                    <div className="muted text-xs">
                      Temp {model.temperature} / Top P {model.topP}
                    </div>
                  </td>
                  <td>
                    <pre className="code-block max-h-[120px] overflow-auto">
                      {JSON.stringify(model.pricing, null, 2)}
                    </pre>
                  </td>
                  <td>
                    <div>{formatDate(model.updatedAt)}</div>
                    <div className="muted text-xs">{model.updatedBy ?? "unknown"}</div>
                  </td>
                  <td>
                    <form action={updateModelAction} className="form-grid">
                      <input name="key" type="hidden" value={model.key} />
                      <input
                        name="idempotencyKey"
                        type="hidden"
                        value={createMutationKey(`model:${model.key}:update`)}
                      />
                      <label className="inline-controls text-sm">
                        <input name="enabled" type="checkbox" defaultChecked={model.enabled} />{" "}
                        Enabled
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          className="input"
                          name="maxOutputTokens"
                          type="number"
                          min="256"
                          max="8192"
                          defaultValue={model.maxOutputTokens}
                          required
                          aria-label="Max output tokens"
                        />
                        <input
                          className="input"
                          name="temperature"
                          type="number"
                          min="0"
                          max="2"
                          step="0.01"
                          defaultValue={model.temperature}
                          required
                          aria-label="Temperature"
                        />
                        <input
                          className="input"
                          name="topP"
                          type="number"
                          min="0.01"
                          max="1"
                          step="0.01"
                          defaultValue={model.topP}
                          required
                          aria-label="Top P"
                        />
                      </div>
                      <input
                        className="input"
                        name="notes"
                        placeholder="Notes"
                        defaultValue={model.notes ?? ""}
                      />
                      <div className="mini-form">
                        <input
                          className="input"
                          name="reason"
                          placeholder="Reason for model config change"
                          minLength={8}
                          maxLength={500}
                          required
                        />
                        <button className="button button-secondary" type="submit">
                          Save
                        </button>
                      </div>
                    </form>
                    {!model.isDefault ? (
                      <form action={setDefaultModelAction} className="mini-form mt-2">
                        <input name="key" type="hidden" value={model.key} />
                        <input
                          name="idempotencyKey"
                          type="hidden"
                          value={createMutationKey(`model:${model.key}:default`)}
                        />
                        <input
                          className="input"
                          name="reason"
                          placeholder="Reason for switching default"
                          minLength={8}
                          maxLength={500}
                          required
                        />
                        <button className="button" type="submit">
                          Default
                        </button>
                      </form>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredModels.length === 0 ? <EmptyState title="No models matched" /> : null}
        </div>
      </section>

      <section className="grid two-col mt-4">
        <div className="panel">
          <div className="section-head">
            <h2 className="text-xl font-bold">Prompt versions</h2>
            <span className="muted text-sm">{filteredPrompts.length} shown</span>
          </div>
          <form className="toolbar toolbar-two" action="/ai">
            <label>
              <span className="metric-label">Search prompts</span>
              <input
                className="input"
                name="promptQuery"
                placeholder="Key, version, title, or body"
                defaultValue={params.promptQuery ?? ""}
              />
            </label>
            <label>
              <span className="metric-label">Status</span>
              <select
                className="select"
                name="promptStatus"
                defaultValue={params.promptStatus ?? "all"}
              >
                <option value="all">All prompts</option>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </label>
            <button className="button" type="submit">
              Filter
            </button>
          </form>
          <div className="table-wrap">
            <table className="table table-compact">
              <thead>
                <tr>
                  <th>Prompt</th>
                  <th>Status</th>
                  <th>Updated</th>
                  <th>Activate</th>
                </tr>
              </thead>
              <tbody>
                {filteredPrompts.map((prompt) => (
                  <tr key={prompt.id}>
                    <td>
                      <div className="font-semibold">{prompt.title}</div>
                      <div className="muted text-xs break-cell">{prompt.key}</div>
                      <div className="muted text-xs">{prompt.version}</div>
                    </td>
                    <td>{prompt.isActive ? <Badge>Active</Badge> : prompt.status}</td>
                    <td>
                      <div>{formatDate(prompt.updatedAt)}</div>
                      <div className="muted text-xs">{prompt.updatedBy ?? "unknown"}</div>
                    </td>
                    <td>
                      {!prompt.isActive ? (
                        <form action={activatePromptAction} className="mini-form">
                          <input name="id" type="hidden" value={prompt.id} />
                          <input
                            name="idempotencyKey"
                            type="hidden"
                            value={createMutationKey(`prompt:${prompt.id}:activate`)}
                          />
                          <input
                            className="input"
                            name="reason"
                            placeholder="Activation reason"
                            minLength={8}
                            maxLength={500}
                            required
                          />
                          <button className="button" type="submit">
                            Activate
                          </button>
                        </form>
                      ) : (
                        <Badge>Current</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredPrompts.length === 0 ? <EmptyState title="No prompts matched" /> : null}
          </div>
        </div>

        <div className="grid gap-4">
          <div className="panel">
            <h2 className="text-xl font-bold">Active prompt preview</h2>
            {activePrompts.length > 0 ? (
              <div className="grid gap-3 mt-4">
                {activePrompts.map((prompt) => (
                  <div key={prompt.id} className="rounded-md border border-[var(--border)] p-3">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold">{prompt.title}</h3>
                      <Badge>{prompt.key}</Badge>
                      <Badge>{prompt.version}</Badge>
                    </div>
                    <p className="muted mt-1 text-sm">
                      Updated {formatDate(prompt.updatedAt)} by {prompt.updatedBy ?? "unknown"}
                    </p>
                    <pre className="code-block mt-4 max-h-[300px] overflow-auto">{prompt.body}</pre>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted mt-3">No active prompt is configured.</p>
            )}
          </div>

          <div className="panel">
            <h2 className="text-xl font-bold">Create prompt draft</h2>
            <form action={createPromptAction} className="form-grid mt-4">
              <input
                name="idempotencyKey"
                type="hidden"
                value={createMutationKey("prompt:create")}
              />
              <input
                className="input"
                name="key"
                placeholder="Prompt key"
                list="prompt-key-options"
                defaultValue="food_photo"
                required
              />
              <datalist id="prompt-key-options">
                <option value="food_photo" />
                <option value="food_photo_IN" />
                <option value="food_photo_GLOBAL" />
              </datalist>
              <input
                className="input"
                name="version"
                placeholder="food_photo_v6"
                minLength={3}
                maxLength={80}
                required
              />
              <input
                className="input"
                name="title"
                placeholder="Prompt title"
                minLength={3}
                maxLength={160}
                required
              />
              <textarea
                className="textarea"
                name="body"
                placeholder="Prompt body. Include {{USER_HINT_BLOCK}} where the user food note should be inserted."
                minLength={100}
                maxLength={20000}
                required
              />
              <input
                className="input"
                name="reason"
                placeholder="Reason for creating this prompt"
                minLength={8}
                maxLength={500}
                required
              />
              <button className="button" type="submit">
                Create draft
              </button>
            </form>
          </div>
        </div>
      </section>
    </AdminShell>
  );
}

function filterModels(models: AiModel[], params: AiSearchParams) {
  const query = params.modelQuery?.trim().toLowerCase();
  return models.filter((model) => {
    const matchesQuery =
      !query ||
      model.key.toLowerCase().includes(query) ||
      model.model.toLowerCase().includes(query) ||
      model.displayName.toLowerCase().includes(query);
    const matchesStatus =
      !params.modelStatus ||
      params.modelStatus === "all" ||
      (params.modelStatus === "default" && model.isDefault) ||
      (params.modelStatus === "enabled" && model.enabled) ||
      (params.modelStatus === "disabled" && !model.enabled);
    return matchesQuery && matchesStatus;
  });
}

function filterPrompts(prompts: AiPrompt[], params: AiSearchParams) {
  const query = params.promptQuery?.trim().toLowerCase();
  return prompts.filter((prompt) => {
    const matchesQuery =
      !query ||
      prompt.key.toLowerCase().includes(query) ||
      prompt.version.toLowerCase().includes(query) ||
      prompt.title.toLowerCase().includes(query) ||
      prompt.body.toLowerCase().includes(query);
    const matchesStatus =
      !params.promptStatus ||
      params.promptStatus === "all" ||
      (params.promptStatus === "active" && prompt.isActive) ||
      prompt.status === params.promptStatus;
    return matchesQuery && matchesStatus;
  });
}
