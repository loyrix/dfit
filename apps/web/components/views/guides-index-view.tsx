import Link from "next/link";
import { APP_CONFIG } from "@/config/app";
import type { Locale } from "@/lib/i18n/config";
import { getRelativeLocalizedUrl } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/types";
import { type Guide, guides as defaultGuides, guideLastUpdated } from "@/app/(en)/guides/content";

interface GuidesIndexViewProps {
  locale: Locale;
  dict: Dictionary;
  guidesList?: Guide[];
}

export function GuidesIndexView({ locale, dict, guidesList }: GuidesIndexViewProps) {
  const t = dict.guidesIndex;
  const allGuides: Guide[] = guidesList ?? defaultGuides;
  const isEn = locale === "en";
  const canonicalUrl = isEn
    ? `${APP_CONFIG.websiteUrl}/guides`
    : `${APP_CONFIG.websiteUrl}/${locale}/guias`;

  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: t.metaTitle,
    description: t.metaDescription,
    url: canonicalUrl,
    dateModified: guideLastUpdated,
    mainEntity: allGuides.map((guide) => ({
      "@type": "Article",
      headline: guide.title,
      description: guide.description,
      url: `${APP_CONFIG.websiteUrl}${getRelativeLocalizedUrl(`guides/${guide.slug}`, locale)}`,
    })),
  };

  return (
    <div className="min-h-screen px-5 pb-24 pt-28 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />
      <div className="mx-auto flex max-w-6xl flex-col gap-12">
        <div className="grid gap-8 lg:grid-cols-[0.82fr_1fr] lg:items-end">
          <div className="flex flex-col gap-3">
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
          </div>
          <p
            className="max-w-2xl text-[16px] leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
          >
            {t.subtitle}
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {allGuides.map((guide) => {
            const href = getRelativeLocalizedUrl(`guides/${guide.slug}`, locale);
            return (
              <Link
                key={guide.slug}
                href={href}
                className="group flex min-h-[260px] flex-col rounded-[28px] border p-6 transition-transform hover:-translate-y-1"
                style={{ borderColor: "var(--border)", background: "var(--app-card)" }}
              >
                <div className="mb-5 flex items-center justify-between gap-4">
                  <span
                    className="rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em]"
                    style={{
                      borderColor: "var(--border)",
                      color: guide.accent,
                      background: "var(--background)",
                    }}
                  >
                    {guide.category}
                  </span>
                  <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                    {guide.readTime}
                  </span>
                </div>
                <h2
                  className="font-display text-[22px] font-semibold leading-tight tracking-tight"
                  style={{ color: "var(--text-primary)" }}
                >
                  {guide.title}
                </h2>
                <p
                  className="mt-3 text-[14px] leading-relaxed"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {guide.summary}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
