import type { ProjectSource } from "../types";

/**
 * PrivyDock has no admin API. Its data comes from three upstreams read directly:
 * Supabase for licences and waitlist, Cloudflare for traffic and downloads, and
 * Paddle for revenue. The panels compose them; nothing needed to change in the
 * PrivyDock app itself to onboard it.
 */
export const privydockSource: ProjectSource = {
  id: "privydock",
  label: "PrivyDock",
  nav: {
    primary: [
      { href: "/", label: "Overview" },
      { href: "/traffic", label: "Traffic" },
      { href: "/downloads", label: "Downloads" },
    ],
    groups: [
      {
        label: "Customers",
        items: [
          { href: "/licenses", label: "Licences" },
          { href: "/waitlist", label: "Waitlist" },
        ],
      },
      {
        label: "Commerce",
        items: [{ href: "/revenue", label: "Revenue" }],
      },
    ],
    defaultSections: {},
  },
};
