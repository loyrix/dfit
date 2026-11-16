import { APP_CONFIG } from "@/config/app";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/types";

interface DataDeletionViewProps {
  locale: Locale;
  dict: Dictionary;
}

export function DataDeletionView({ locale, dict }: DataDeletionViewProps) {
  const t = dict.dataDeletion;
  const isEn = locale === "en";
  const canonicalUrl = isEn
    ? `${APP_CONFIG.websiteUrl}/data-deletion`
    : `${APP_CONFIG.websiteUrl}/${locale}/eliminacion-de-datos`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `${APP_CONFIG.appName} Data Deletion`,
    description: t.metaDescription,
    url: canonicalUrl,
  };

  return (
    <div className="min-h-screen px-5 pb-24 pt-28 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mx-auto flex max-w-2xl flex-col gap-10">
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
          <p className="text-[16px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {t.intro}
          </p>
        </header>

        <section className="flex flex-col gap-4">
          <h2
            className="font-display text-xl font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            {t.inAppHeading}
          </h2>
          <ul
            className="ml-5 flex list-disc flex-col gap-2 text-[15px] leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
          >
            {t.inAppSteps.map((step, idx) => (
              <li key={idx}>{step}</li>
            ))}
          </ul>
        </section>

        <section className="flex flex-col gap-4">
          <h2
            className="font-display text-xl font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            {t.webHeading}
          </h2>
          <div
            className="rounded-[24px] border p-5"
            style={{
              borderColor: "var(--border)",
              background: "linear-gradient(135deg, rgba(239, 189, 68, 0.12), var(--app-card))",
            }}
          >
            <p
              className="text-[12px] font-semibold uppercase tracking-[0.26em]"
              style={{ color: "var(--app-amber)" }}
            >
              App installed?
            </p>
            <p
              className="mt-3 text-[15px] leading-relaxed"
              style={{ color: "var(--text-secondary)" }}
            >
              {t.inAppNote}
            </p>
            <a
              href={APP_CONFIG.deleteAccountDeepLink}
              className="mt-5 inline-flex rounded-full px-5 py-3 text-[14px] font-semibold transition hover:scale-[1.01]"
              style={{
                background: "var(--app-amber)",
                color: "#2b210a",
                boxShadow: "0 18px 34px rgba(239, 189, 68, 0.22)",
              }}
            >
              {t.openAppButton}
            </a>
          </div>
          <div
            className="flex flex-col gap-3 text-[15px] leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
          >
            <p>{t.webText}</p>
            <p>
              <a
                href={`mailto:${APP_CONFIG.supportEmail}?subject=${encodeURIComponent(t.webEmailSubject)}`}
                className="underline underline-offset-4 font-medium"
                style={{ color: "var(--app-amber)" }}
              >
                {t.webEmailButton}
              </a>
            </p>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h2
            className="font-display text-xl font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            {t.retentionHeading}
          </h2>
          <p className="text-[15px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {t.retentionText}
          </p>
        </section>
      </div>
    </div>
  );
}
