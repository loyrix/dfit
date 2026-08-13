import { notFound } from "next/navigation";

import { getProjectSource } from "../lib/registry";

/**
 * Validates the project segment before anything below it renders. An unknown id
 * is a 404 rather than a crash, so a mistyped URL cannot surface a stack trace.
 */
export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ project: string }>;
}) {
  const { project } = await params;
  if (!getProjectSource(project)) notFound();

  return children;
}
