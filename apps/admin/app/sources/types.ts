/**
 * The contract every project in the Loyrix backoffice obeys.
 *
 * Nav is declared per project rather than derived from a fixed capability enum.
 * Projects differ too much for a shared enum to describe them without flattening
 * everything to what they have in common: LogMyPlate has twelve pages across four
 * groups with `?section=` sub-navigation, while PrivyDock will have a handful of
 * read-only panels. A per-project manifest keeps each one whole.
 *
 * Hrefs in a manifest are always project-relative ("/users"). The nav prefixes
 * them with the active project segment at render time, so a source never has to
 * know its own URL prefix.
 */

export type NavItem = {
  /** Project-relative path, e.g. "/users" or "/ai?section=models". */
  href: string;
  label: string;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export type ProjectNav = {
  /** Top-level links, always visible. */
  primary: NavItem[];
  /** Collapsible groups below the primary links. */
  groups: NavGroup[];
  /**
   * For pages that use `?section=` sub-navigation, the section that is active
   * when the parameter is absent. Keyed by project-relative path.
   */
  defaultSections: Record<string, string>;
};

/** Visual identity a project carries into the console. */
export type ProjectBrand = {
  /** Path under /public. */
  logo: string;
  tagline: string;
};

export type ProjectSource = {
  /** URL segment and registry key, e.g. "logmyplate". */
  id: string;
  /** Display name for the switcher. */
  label: string;
  brand?: ProjectBrand;
  nav: ProjectNav;
};
