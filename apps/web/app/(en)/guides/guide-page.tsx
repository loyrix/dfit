import type { Metadata } from "next";
import Link from "next/link";
import { DownloadBadges } from "@/components/download-badges";
import { APP_CONFIG } from "@/config/app";
import { type Locale, getAlternateMetadata, getRelativeLocalizedUrl } from "@/lib/i18n/config";
import { getLocalizedGuide } from "@/lib/i18n/data";
import { type Guide, getGuide, guideLastUpdated } from "./content";

export const guideMetadata = (guide: Guide): Metadata => ({
  metadataBase: new URL(APP_CONFIG.websiteUrl),
  title: guide.title,
  description: guide.description,
  keywords: guide.keywords,
  alternates: getAlternateMetadata(`guides/${guide.slug}`, "en"),
  openGraph: {
    type: "article",
    url: `/guides/${guide.slug}`,
    title: guide.title,
    description: guide.description,
    siteName: APP_CONFIG.appName,
    publishedTime: guideLastUpdated,
    modifiedTime: guideLastUpdated,
    authors: [APP_CONFIG.brandName],
    tags: guide.keywords,
  },
  twitter: {
    card: "summary_large_image",
    title: guide.title,
    description: guide.description,
  },
});

export function GuideArticle({
  slug,
  locale = "en",
}: {
  slug: string;
  locale?: Locale;
}) {
  const guide = getLocalizedGuide(slug, locale) ?? getGuide(slug);

  if (!guide) {
    return null;
  }

  const isEs = locale === "es";
  const isPtBr = locale === "pt-br";
  const isDe = locale === "de";
  const isFr = locale === "fr";
  const canonicalUrl = getAlternateMetadata(`guides/${guide.slug}`, locale).canonical;
  const backLink = getRelativeLocalizedUrl("guidesIndex", locale);

  const homeLabel = isEs
    ? "Inicio"
    : isPtBr
    ? "Início"
    : isDe
    ? "Startseite"
    : isFr
    ? "Accueil"
    : "Home";
  const guidesLabel = isEs
    ? "Guías"
    : isPtBr
    ? "Guias"
    : isDe
    ? "Ratgeber"
    : isFr
    ? "Guides"
    : "Guides";

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: guide.title,
      description: guide.description,
      datePublished: guideLastUpdated,
      dateModified: guideLastUpdated,
      author: {
        "@type": "Organization",
        name: APP_CONFIG.brandName,
        url: APP_CONFIG.websiteUrl,
      },
      publisher: {
        "@type": "Organization",
        name: APP_CONFIG.brandName,
        logo: {
          "@type": "ImageObject",
          url: `${APP_CONFIG.websiteUrl}/icon.png`,
        },
      },
      mainEntityOfPage: canonicalUrl,
      image: `${APP_CONFIG.websiteUrl}/screenshots/appstore/today-dashboard-light.webp`,
      keywords: guide.keywords.join(", "),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: homeLabel,
          item: APP_CONFIG.websiteUrl,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: guidesLabel,
          item: `${APP_CONFIG.websiteUrl}${backLink}`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: guide.title,
          item: canonicalUrl,
        },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: guide.faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer,
        },
      })),
    },
  ];

  return (
    <article className="min-h-screen px-5 pb-24 pt-28 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mx-auto grid max-w-6xl gap-14 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="mx-auto flex max-w-3xl flex-col gap-10">
          <header className="flex flex-col gap-5">
            <Link
              href={backLink}
              className="w-fit text-[12px] font-medium opacity-60 transition-opacity hover:opacity-100"
              style={{ color: "var(--text-secondary)" }}
            >
              {isEs
                ? "← Volver a guías"
                : isPtBr
                ? "← Voltar para guias"
                : isDe
                ? "← Zurück zur Übersicht"
                : isFr
                ? "← Retour aux guides"
                : "← Back to guides"}
            </Link>
            <div className="flex flex-wrap items-center gap-3">
              <span
                className="rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em]"
                style={{
                  borderColor: "var(--border)",
                  color: guide.accent,
                  background: "var(--app-card)",
                }}
              >
                {guide.category}
              </span>
              <span className="text-[12px]" style={{ color: "var(--text-muted)" }}>
                {guide.readTime} ·{" "}
                {isEs
                  ? "Actualizado el 24 de mayo de 2026"
                  : isPtBr
                  ? "Atualizado em 24 de maio de 2026"
                  : isDe
                  ? "Aktualisiert am 24. Mai 2026"
                  : isFr
                  ? "Mis à jour le 24 mai 2026"
                  : "Updated May 24, 2026"}
              </span>
            </div>
            <h1
              className="font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl"
              style={{ color: "var(--text-primary)" }}
            >
              {guide.title}
            </h1>
            <p className="text-[18px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {guide.description}
            </p>
          </header>

          <div
            className="flex flex-col gap-9 text-[16px] leading-[1.85]"
            style={{ color: "var(--text-secondary)" }}
          >
            {guide.sections.map((section) => (
              <section key={section.heading} className="flex flex-col gap-4">
                <h2
                  className="font-display text-2xl font-semibold tracking-tight"
                  style={{ color: "var(--text-primary)" }}
                >
                  {section.heading}
                </h2>
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </section>
            ))}
          </div>

          <section
            className="rounded-[28px] border p-6 sm:p-8"
            style={{ borderColor: "var(--border)", background: "var(--app-card)" }}
          >
            <h2
              className="font-display text-2xl font-semibold tracking-tight"
              style={{ color: "var(--text-primary)" }}
            >
              {isEs
                ? "Preguntas frecuentes"
                : isPtBr
                ? "Perguntas frequentes"
                : isDe
                ? "Häufig gestellte Fragen (FAQ)"
                : isFr
                ? "Foire aux questions (FAQ)"
                : "FAQs"}
            </h2>
            <div className="mt-5 flex flex-col divide-y" style={{ borderColor: "var(--border)" }}>
              {guide.faqs.map((faq) => (
                <div key={faq.question} className="py-5 first:pt-0 last:pb-0">
                  <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>
                    {faq.question}
                  </h3>
                  <p
                    className="mt-2 text-[14px] leading-relaxed"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <div
            className="rounded-[28px] border p-6"
            style={{ borderColor: "var(--border)", background: "var(--app-card)" }}
          >
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.28em]"
              style={{ color: "var(--app-amber)" }}
            >
              {isEs
                ? "Prueba LogMyPlate"
                : isPtBr
                ? "Experimente o LogMyPlate"
                : isDe
                ? "Teste LogMyPlate"
                : isFr
                ? "Essayez LogMyPlate"
                : "Try LogMyPlate"}
            </p>
            <h2
              className="mt-3 font-display text-2xl font-semibold tracking-tight"
              style={{ color: "var(--text-primary)" }}
            >
              {isEs
                ? "Registra una comida a partir de una foto."
                : isPtBr
                ? "Registre uma refeição a partir de uma foto."
                : isDe
                ? "Erfasse Mahlzeiten mit einem Foto."
                : isFr
                ? "Suivez un repas à partir d'une photo."
                : "Track a meal from one photo."}
            </h2>
            <p
              className="mt-3 text-[14px] leading-relaxed"
              style={{ color: "var(--text-secondary)" }}
            >
              {isEs
                ? "Agrega una nota breve, revisa la estimación de calorías y macros, y guárdala en tu diario."
                : isPtBr
                ? "Adicione uma nota breve, confira a estimativa de calorias e macros, e salve no seu diário."
                : isDe
                ? "Füge eine kurze Notiz hinzu, prüfe die Kalorien- und Makroschätzung und speichere sie in deinem Tagebuch."
                : isFr
                ? "Ajoutez une brève note, examinez l'estimation des calories et macros, et enregistrez-la dans votre journal."
                : "Add a short note, review the calorie and macro estimate, then save it to your journal."}
            </p>
            <DownloadBadges size="sm" className="mt-5" placement="guide_sidebar" />
            <p className="mt-4 text-[11px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
              {isEs
                ? "Las estimaciones de IA son aproximadas y no constituyen asesoramiento médico."
                : isPtBr
                ? "As estimativas por IA são aproximações e não constituem orientação médica."
                : isDe
                ? "KI-Schätzungen sind Näherungswerte und stellen keine medizinische Beratung dar."
                : isFr
                ? "Les estimations par IA sont approximatives et ne constituent pas un avis médical."
                : "AI estimates are approximate and are not medical advice."}
            </p>
          </div>
        </aside>
      </div>
    </article>
  );
}
