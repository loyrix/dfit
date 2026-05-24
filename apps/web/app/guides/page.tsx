import type { Metadata } from "next";
import Link from "next/link";
import { APP_CONFIG } from "@/config/app";
import { guides, guideLastUpdated } from "./content";

export const metadata: Metadata = {
  title: "Guides and Blog",
  description:
    "Practical LogMyPlate guides for AI calorie tracking, Indian food calories, photo food journals, macro tracking, privacy, and daily calorie targets.",
  alternates: { canonical: "/guides" },
  openGraph: {
    title: "LogMyPlate Guides and Blog",
    description:
      "Helpful guides for AI calorie tracking, meal photos, Indian food calories, macros, privacy, and daily targets.",
    url: "/guides",
  },
};

export default function GuidesIndexPage() {
  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "LogMyPlate Guides and Blog",
    description: metadata.description,
    url: `${APP_CONFIG.websiteUrl}/guides`,
    dateModified: guideLastUpdated,
    mainEntity: guides.map((guide) => ({
      "@type": "Article",
      headline: guide.title,
      description: guide.description,
      url: `${APP_CONFIG.websiteUrl}/guides/${guide.slug}`,
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
              Resources
            </p>
            <h1
              className="font-display text-4xl font-bold tracking-tight sm:text-5xl"
              style={{ color: "var(--text-primary)" }}
            >
              Guides and blog
            </h1>
          </div>
          <p
            className="max-w-2xl text-[16px] leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
          >
            Practical content for users searching for AI calorie tracking, Indian food calories,
            macro estimates, meal photos, data deletion, and privacy-safe food journaling.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {guides.map((guide) => (
            <Link
              key={guide.slug}
              href={`/guides/${guide.slug}`}
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
              <span
                className="mt-auto pt-6 text-[13px] font-semibold"
                style={{ color: guide.accent }}
              >
                Read guide
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
