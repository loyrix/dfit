/**
 * PrivyDock composes three independent upstreams. One of them being down must
 * degrade its own panel rather than blank the whole screen, so panels resolve
 * through `safe()` and render this in place of their contents on failure.
 */
export function SourceError({ source, message }: { source: string; message: string }) {
  return (
    <div className="panel">
      <div className="metric-label">{source}</div>
      <p className="muted mt-2 text-sm">Unavailable — {message}</p>
    </div>
  );
}

export type Result<T> = { ok: true; data: T } | { ok: false; error: string };

export async function safe<T>(load: () => Promise<T>): Promise<Result<T>> {
  try {
    return { ok: true, data: await load() };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "unknown error" };
  }
}
