"use client";

import { usePathname } from "next/navigation";

import { switchProjectAction } from "../lib/actions";
import { listProjects, projectIdFromPathname } from "../lib/registry";

/**
 * Switches which project the backoffice is operating.
 *
 * Submitting is a server action rather than a plain link because the choice is
 * remembered in a cookie, which only an action can write. With a single project
 * registered there is nothing to choose, so it renders as a label instead.
 */
export function ProjectSwitcher() {
  const pathname = usePathname();
  const projects = listProjects();
  const current = projectIdFromPathname(pathname) ?? projects[0]?.id;
  const currentLabel = projects.find((project) => project.id === current)?.label;

  if (projects.length < 2) {
    return (
      <div className="admin-project">
        <div className="text-sm muted">Project</div>
        <div className="mt-1 font-semibold">{currentLabel ?? "Unknown"}</div>
      </div>
    );
  }

  return (
    <form action={switchProjectAction} className="admin-project">
      <label className="grid gap-2">
        <span className="text-sm muted">Project</span>
        <select
          className="input"
          defaultValue={current}
          key={current}
          name="project"
          onChange={(event) => event.currentTarget.form?.requestSubmit()}
        >
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.label}
            </option>
          ))}
        </select>
      </label>
      <noscript>
        <button className="button button-secondary mt-2 w-full" type="submit">
          Switch
        </button>
      </noscript>
    </form>
  );
}
