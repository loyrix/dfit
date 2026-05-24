import Link from "next/link";
import Image from "next/image";
import { APP_CONFIG } from "@/config/app";

const footerLinks = {
  Product: [
    { label: "Download", href: "/download" },
    { label: "How it works", href: "/#how-it-works" },
    { label: "Guides", href: "/guides" },
  ],
  Support: [
    { label: "Help & FAQ", href: "/support" },
    { label: `Email us`, href: `mailto:${APP_CONFIG.supportEmail}` },
  ],
  Legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Data Deletion", href: "/data-deletion" },
    { label: "app-ads.txt", href: "/app-ads.txt" },
  ],
};

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      className="border-t pt-12 pb-8 px-5 sm:px-6 mt-24"
      style={{ borderColor: "var(--border)", background: "var(--surface-50)" }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Top row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-3">
              <Image
                src="/icon.png"
                alt="LogMyPlate"
                width={28}
                height={28}
                className="rounded-lg"
              />
              <span
                className="font-display font-semibold text-[14px]"
                style={{ color: "var(--text-primary)" }}
              >
                LogMyPlate
              </span>
            </Link>
            <p
              className="text-[13px] leading-relaxed max-w-[220px]"
              style={{ color: "var(--text-muted)" }}
            >
              Track meals from a photo. AI-powered calorie and macro estimation for every plate.
            </p>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([group, links]) => (
            <div key={group}>
              <p
                className="text-[11px] font-semibold uppercase tracking-widest mb-3"
                style={{ color: "var(--text-muted)" }}
              >
                {group}
              </p>
              <ul className="flex flex-col gap-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-[13px] transition-opacity hover:opacity-100 opacity-70"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom row */}
        <div
          className="pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px]"
          style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
        >
          <span>© {year} LogMyPlate. All rights reserved.</span>
          <span className="text-center sm:text-right">
            AI estimates are not medical advice. Always consult a qualified professional.
          </span>
        </div>
      </div>
    </footer>
  );
}
