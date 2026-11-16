import { APP_CONFIG } from "@/config/app";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/types";

interface PrivacyViewProps {
  locale: Locale;
  dict: Dictionary;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-display text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
        {title}
      </h2>
      <div
        className="flex flex-col gap-3 text-[15px] leading-relaxed"
        style={{ color: "var(--text-secondary)" }}
      >
        {children}
      </div>
    </section>
  );
}

export function PrivacyView({ locale, dict }: PrivacyViewProps) {
  const t = dict.privacy;
  const isEn = locale === "en";
  const canonicalUrl = isEn
    ? `${APP_CONFIG.websiteUrl}/privacy`
    : `${APP_CONFIG.websiteUrl}/${locale}/privacidad`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "PrivacyPolicy",
    name: `${APP_CONFIG.appName} Privacy Policy`,
    url: canonicalUrl,
    dateModified: "2026-06-07",
    publisher: {
      "@type": "Organization",
      name: APP_CONFIG.brandName,
      url: APP_CONFIG.websiteUrl,
    },
  };

  return (
    <div className="min-h-screen px-5 pb-24 pt-28 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mx-auto flex max-w-2xl flex-col gap-12">
        <header className="flex flex-col gap-3">
          <p
            className="text-[12px] font-semibold uppercase tracking-[0.32em]"
            style={{ color: "var(--app-amber)" }}
          >
            {t.badge}
          </p>
          <h1
            className="font-display text-4xl font-bold tracking-tight sm:text-5xl"
            style={{ color: "var(--text-primary)" }}
          >
            {t.headline}
          </h1>
          <p className="text-[14px]" style={{ color: "var(--text-muted)" }}>
            {t.lastUpdated}
          </p>

          {t.legallyBindingNotice && (
            <div
              className="mt-2 rounded-2xl p-4 text-[13px] font-medium leading-relaxed"
              style={{
                background: "rgba(239, 189, 68, 0.15)",
                border: "1px solid rgba(239, 189, 68, 0.35)",
                color: "var(--text-primary)",
              }}
            >
              {t.legallyBindingNotice}
            </div>
          )}
        </header>

        {t.sections.map((section, idx) => (
          <Section key={idx} title={section.title}>
            {section.content.map((paragraph, pIdx) => (
              <p key={pIdx}>{paragraph}</p>
            ))}
          </Section>
        ))}
      </div>
    </div>
  );
}
