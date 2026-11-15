import Link from "next/link";
import Image from "next/image";
import { APP_CONFIG } from "@/config/app";
import { LanguageSwitcher } from "@/components/language-switcher";
import { type Locale, CORE_ROUTES } from "@/lib/i18n";
import type { FooterDict } from "@/lib/i18n/types";

interface FooterProps {
  locale?: Locale;
  dict?: FooterDict;
}

export function Footer({ locale = "en", dict }: FooterProps) {
  const year = new Date().getFullYear();

  const homeHref = locale === "en" ? "/" : `/${locale}`;
  const downloadHref = locale === "en" ? "/download" : `/${locale}/${CORE_ROUTES.download[locale]}`;
  const guidesHref = locale === "en" ? "/guides" : `/${locale}/${CORE_ROUTES.guidesIndex[locale]}`;
  const supportHref = locale === "en" ? "/support" : `/${locale}/${CORE_ROUTES.support[locale]}`;
  const privacyHref = locale === "en" ? "/privacy" : `/${locale}/${CORE_ROUTES.privacy[locale]}`;
  const termsHref = locale === "en" ? "/terms" : `/${locale}/${CORE_ROUTES.terms[locale]}`;
  const dataDeletionHref = locale === "en" ? "/data-deletion" : `/${locale}/${CORE_ROUTES.dataDeletion[locale]}`;

  const footerGroups = [
    {
      title: dict?.groupProduct ?? "Product",
      links: [
        { label: dict?.linkDownload ?? "Download", href: downloadHref },
        { label: dict?.linkHowItWorks ?? "How it works", href: `${homeHref}#how-it-works` },
        { label: dict?.linkGuides ?? "Guides", href: guidesHref },
      ],
    },
    {
      title: dict?.groupSupport ?? "Support",
      links: [
        { label: dict?.linkHelpFaq ?? "Help & FAQ", href: supportHref },
        { label: dict?.linkEmailUs ?? "Email us", href: `mailto:${APP_CONFIG.supportEmail}` },
      ],
    },
    {
      title: dict?.groupLegal ?? "Legal",
      links: [
        { label: dict?.linkPrivacy ?? "Privacy Policy", href: privacyHref },
        { label: dict?.linkTerms ?? "Terms of Service", href: termsHref },
        { label: dict?.linkDataDeletion ?? "Data Deletion", href: dataDeletionHref },
        { label: dict?.linkAppAds ?? "app-ads.txt", href: "/app-ads.txt" },
      ],
    },
  ];

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
            <Link href={homeHref} className="flex items-center gap-2 mb-3">
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
              {dict?.brandDescription ??
                "Track meals from a photo. AI-powered calorie and macro estimation for every plate."}
            </p>
          </div>

          {/* Links */}
          {footerGroups.map((group) => (
            <div key={group.title}>
              <p
                className="text-[11px] font-semibold uppercase tracking-widest mb-3"
                style={{ color: "var(--text-muted)" }}
              >
                {group.title}
              </p>
              <ul className="flex flex-col gap-2">
                {group.links.map((link) => (
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
          className="pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4 text-[12px]"
          style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
        >
          <div className="flex items-center gap-4">
            <span>© {year} {dict?.copyright ?? "LogMyPlate. All rights reserved."}</span>
            <LanguageSwitcher currentLocale={locale} variant="footer" />
          </div>
          <span className="text-center sm:text-right">
            {dict?.medicalDisclaimer ??
              "AI estimates are not medical advice. Always consult a qualified professional."}
          </span>
        </div>
      </div>
    </footer>
  );
}
