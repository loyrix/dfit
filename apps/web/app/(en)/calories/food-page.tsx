import type { Metadata } from "next";
import Link from "next/link";
import { DownloadBadges } from "@/components/download-badges";
import { APP_CONFIG } from "@/config/app";
import { type Locale, getAlternateMetadata, getRelativeLocalizedUrl } from "@/lib/i18n/config";
import { getLocalizedFood } from "@/lib/i18n/data";
import { type FoodPage, foodDataUpdated, getFood, scale } from "./food-data";

export const foodMetadata = (food: FoodPage): Metadata => ({
  metadataBase: new URL(APP_CONFIG.websiteUrl),
  title: food.title,
  description: food.description,
  keywords: [
    `calories in ${food.name.toLowerCase()}`,
    `${food.name.toLowerCase()} calories`,
    `${food.name.toLowerCase()} protein`,
    `${food.name.toLowerCase()} nutrition`,
    ...food.aka.map((alias) => `calories in ${alias}`),
  ],
  alternates: getAlternateMetadata(`calories/${food.slug}`, "en"),
  openGraph: {
    type: "article",
    url: `/calories/${food.slug}`,
    title: food.title,
    description: food.description,
    siteName: APP_CONFIG.appName,
    publishedTime: foodDataUpdated,
    modifiedTime: foodDataUpdated,
    authors: [APP_CONFIG.brandName],
  },
  twitter: {
    card: "summary_large_image",
    title: food.title,
    description: food.description,
  },
});

const num = (value: number | undefined, unit = "g") =>
  value === undefined ? "—" : `${value}${unit}`;

export function FoodArticle({
  slug,
  locale = "en",
}: {
  slug: string;
  locale?: Locale;
}) {
  const food = getLocalizedFood(slug, locale) ?? getFood(slug);
  if (!food) return null;

  const isEs = locale === "es";
  const isPtBr = locale === "pt-br";
  const isDe = locale === "de";
  const canonicalUrl = getAlternateMetadata(`calories/${food.slug}`, locale).canonical;
  const backLink = getRelativeLocalizedUrl("calories", locale);

  const homeLabel = isEs ? "Inicio" : isPtBr ? "Início" : isDe ? "Startseite" : "Home";
  const caloriesLabel = isEs ? "Calorías" : isPtBr ? "Calorias" : isDe ? "Kalorien" : "Calories";

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: food.title,
      description: food.description,
      datePublished: foodDataUpdated,
      dateModified: foodDataUpdated,
      author: { "@type": "Organization", name: APP_CONFIG.brandName, url: APP_CONFIG.websiteUrl },
      publisher: {
        "@type": "Organization",
        name: APP_CONFIG.brandName,
        logo: { "@type": "ImageObject", url: `${APP_CONFIG.websiteUrl}/icon.png` },
      },
      mainEntityOfPage: canonicalUrl,
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
          name: caloriesLabel,
          item: `${APP_CONFIG.websiteUrl}${backLink}`,
        },
        { "@type": "ListItem", position: 3, name: food.name, item: canonicalUrl },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: food.faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: { "@type": "Answer", text: faq.answer },
      })),
    },
  ];

  const cellStyle = { borderColor: "var(--border)" };

  const tableHeaders = isEs
    ? ["Porción", "Peso", "Calorías", "Proteína", "Carbohidratos", "Grasa", "Fibra"]
    : isPtBr
    ? ["Porção", "Peso", "Calorias", "Proteína", "Carboidratos", "Gordura", "Fibra"]
    : isDe
    ? ["Portion", "Gewicht", "Kalorien", "Protein", "Kohlenhydrate", "Fett", "Ballaststoffe"]
    : ["Portion", "Weight", "Calories", "Protein", "Carbs", "Fat", "Fibre"];

  const compHeaders = isEs
    ? ["", "Calorías", "Proteína", "Fibra"]
    : isPtBr
    ? ["", "Calorias", "Proteína", "Fibra"]
    : isDe
    ? ["", "Kalorien", "Protein", "Ballaststoffe"]
    : ["", "Calories", "Protein", "Fibre"];

  return (
    <article className="min-h-screen px-5 pb-24 pt-28 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mx-auto grid max-w-6xl gap-14 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-10">
          <header className="flex flex-col gap-5">
            <Link
              href={backLink}
              className="w-fit text-[12px] font-medium opacity-60 transition-opacity hover:opacity-100"
              style={{ color: "var(--text-secondary)" }}
            >
              {isEs
                ? "← Todos los alimentos"
                : isPtBr
                ? "← Todos os alimentos"
                : isDe
                ? "← Alle Lebensmittel"
                : "← All foods"}
            </Link>
            <h1
              className="font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl"
              style={{ color: "var(--text-primary)" }}
            >
              {isEs
                ? `Calorías en: ${food.name.toLowerCase()}`
                : isPtBr
                ? `Calorias em: ${food.name.toLowerCase()}`
                : isDe
                ? `Kalorien in: ${food.name}`
                : `Calories in ${food.name.toLowerCase()}`}
            </h1>
            {food.aka.length > 0 && (
              <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>
                {isEs
                  ? "También conocido como "
                  : isPtBr
                  ? "Também conhecido como "
                  : isDe
                  ? "Auch bekannt als "
                  : "Also known as "}
                {food.aka.join(", ")}
              </p>
            )}
          </header>

          <div
            className="flex flex-col gap-4 text-[16px] leading-[1.85]"
            style={{ color: "var(--text-secondary)" }}
          >
            {food.intro.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>

          {/* The portion table — the reason this page exists. */}
          <section className="flex flex-col gap-4">
            <h2
              className="font-display text-2xl font-semibold tracking-tight"
              style={{ color: "var(--text-primary)" }}
            >
              {isEs
                ? `${food.name}: calorías por porción`
                : isPtBr
                ? `${food.name}: calorias por porção`
                : isDe
                ? `${food.name}: Kalorien nach Portionen`
                : `${food.name} calories by portion`}
            </h2>
            <div className="overflow-x-auto rounded-[20px] border" style={cellStyle}>
              <table className="w-full min-w-[520px] border-collapse text-[14px]">
                <thead>
                  <tr style={{ background: "var(--app-card)" }}>
                    {tableHeaders.map((head) => (
                      <th
                        key={head}
                        className="border-b px-4 py-3 text-left font-semibold"
                        style={{ ...cellStyle, color: "var(--text-primary)" }}
                      >
                        {head}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {food.portions.map((portion) => {
                    const macros = scale(food.per100g, portion.grams);
                    return (
                      <tr key={portion.label}>
                        <td
                          className="border-b px-4 py-3"
                          style={{ ...cellStyle, color: "var(--text-primary)" }}
                        >
                          <span className="font-medium">{portion.label}</span>
                          {portion.note && (
                            <span
                              className="block text-[12px]"
                              style={{ color: "var(--text-muted)" }}
                            >
                              {portion.note}
                            </span>
                          )}
                        </td>
                        <td
                          className="border-b px-4 py-3"
                          style={{ ...cellStyle, color: "var(--text-secondary)" }}
                        >
                          {portion.grams} g
                        </td>
                        <td
                          className="border-b px-4 py-3 font-semibold"
                          style={{ ...cellStyle, color: "var(--app-amber)" }}
                        >
                          {macros.calories}
                        </td>
                        <td
                          className="border-b px-4 py-3"
                          style={{ ...cellStyle, color: "var(--text-secondary)" }}
                        >
                          {num(macros.protein)}
                        </td>
                        <td
                          className="border-b px-4 py-3"
                          style={{ ...cellStyle, color: "var(--text-secondary)" }}
                        >
                          {num(macros.carbs)}
                        </td>
                        <td
                          className="border-b px-4 py-3"
                          style={{ ...cellStyle, color: "var(--text-secondary)" }}
                        >
                          {num(macros.fat)}
                        </td>
                        <td
                          className="border-b px-4 py-3"
                          style={{ ...cellStyle, color: "var(--text-secondary)" }}
                        >
                          {num(macros.fiber)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>
              {isEs
                ? `Por 100 g: ${food.per100g.calories} cal · ${food.per100g.protein} g proteína · ${food.per100g.carbs} g carbohidratos · ${food.per100g.fat} g grasa${food.per100g.fiber !== undefined ? ` · ${food.per100g.fiber} g fibra` : ""}`
                : isPtBr
                ? `Por 100 g: ${food.per100g.calories} cal · ${food.per100g.protein} g proteína · ${food.per100g.carbs} g carboidratos · ${food.per100g.fat} g gordura${food.per100g.fiber !== undefined ? ` · ${food.per100g.fiber} g fibra` : ""}`
                : isDe
                ? `Pro 100 g: ${food.per100g.calories} kcal · ${food.per100g.protein} g Protein · ${food.per100g.carbs} g Kohlenhydrate · ${food.per100g.fat} g Fett${food.per100g.fiber !== undefined ? ` · ${food.per100g.fiber} g Ballaststoffe` : ""}`
                : `Per 100 g: ${food.per100g.calories} cal · ${food.per100g.protein} g protein · ${food.per100g.carbs} g carbs · ${food.per100g.fat} g fat${food.per100g.fiber !== undefined ? ` · ${food.per100g.fiber} g fibre` : ""}`}
            </p>
          </section>

          {/* Portion honesty — the section no competitor has. */}
          <section
            className="flex flex-col gap-4 rounded-[28px] border p-6 sm:p-8"
            style={{ borderColor: "var(--border)", background: "var(--app-card)" }}
          >
            <h2
              className="font-display text-2xl font-semibold tracking-tight"
              style={{ color: "var(--text-primary)" }}
            >
              {isEs
                ? "Por qué una sola cifra no es suficiente"
                : isPtBr
                ? "Por que um único valor não é suficiente"
                : isDe
                ? "Warum eine einzige Zahl nicht ausreicht"
                : "Why one number isn't enough"}
            </h2>
            <p className="text-[15px] font-medium" style={{ color: "var(--app-amber)" }}>
              {food.observedRange}
            </p>
            <div
              className="flex flex-col gap-3 text-[15px] leading-[1.8]"
              style={{ color: "var(--text-secondary)" }}
            >
              {food.portionHonesty.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </section>

          <section className="flex flex-col gap-4">
            <h2
              className="font-display text-2xl font-semibold tracking-tight"
              style={{ color: "var(--text-primary)" }}
            >
              {isEs
                ? "Qué modifica realmente la cifra"
                : isPtBr
                ? "O que realmente altera o valor"
                : isDe
                ? "Was den Wert tatsächlich verändert"
                : "What actually changes the number"}
            </h2>
            <div className="flex flex-col gap-5">
              {food.whatChangesIt.map((item) => (
                <div key={item.heading} className="flex flex-col gap-1">
                  <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>
                    {item.heading}
                  </h3>
                  <p
                    className="text-[15px] leading-[1.8]"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="flex flex-col gap-4">
            <h2
              className="font-display text-2xl font-semibold tracking-tight"
              style={{ color: "var(--text-primary)" }}
            >
              {isEs
                ? "Cómo leer los macronutrientes"
                : isPtBr
                ? "Como interpretar os macronutrientes"
                : isDe
                ? "Nährwerte richtig einordnen"
                : "Reading the macros"}
            </h2>
            <div
              className="flex flex-col gap-3 text-[15px] leading-[1.8]"
              style={{ color: "var(--text-secondary)" }}
            >
              {food.macroContext.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </section>

          {/* Inline comparison — stands in until /compare/* exists. No broken links. */}
          <section className="flex flex-col gap-4">
            <h2
              className="font-display text-2xl font-semibold tracking-tight"
              style={{ color: "var(--text-primary)" }}
            >
              {food.comparison.heading}
            </h2>
            <p className="text-[15px] leading-[1.8]" style={{ color: "var(--text-secondary)" }}>
              {food.comparison.intro}
            </p>
            <div className="overflow-x-auto rounded-[20px] border" style={cellStyle}>
              <table className="w-full min-w-[420px] border-collapse text-[14px]">
                <thead>
                  <tr style={{ background: "var(--app-card)" }}>
                    {compHeaders.map((head) => (
                      <th
                        key={head}
                        className="border-b px-4 py-3 text-left font-semibold"
                        style={{ ...cellStyle, color: "var(--text-primary)" }}
                      >
                        {head}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {food.comparison.items.map((item) => {
                    const other = getLocalizedFood(item.slug, locale) ?? getFood(item.slug);
                    if (!other) return null;
                    const macros = scale(other.per100g, item.grams);
                    return (
                      <tr key={item.label}>
                        <td
                          className="border-b px-4 py-3 font-medium"
                          style={{ ...cellStyle, color: "var(--text-primary)" }}
                        >
                          {item.slug === food.slug ? (
                            item.label
                          ) : (
                            <Link
                              href={getRelativeLocalizedUrl(`calories/${item.slug}`, locale)}
                              className="underline underline-offset-4"
                            >
                              {item.label}
                            </Link>
                          )}
                        </td>
                        <td
                          className="border-b px-4 py-3 font-semibold"
                          style={{ ...cellStyle, color: "var(--app-amber)" }}
                        >
                          {macros.calories}
                        </td>
                        <td
                          className="border-b px-4 py-3"
                          style={{ ...cellStyle, color: "var(--text-secondary)" }}
                        >
                          {num(macros.protein)}
                        </td>
                        <td
                          className="border-b px-4 py-3"
                          style={{ ...cellStyle, color: "var(--text-secondary)" }}
                        >
                          {num(macros.fiber)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-[15px] leading-[1.8]" style={{ color: "var(--text-secondary)" }}>
              {food.comparison.footnote}
            </p>
          </section>

          <section
            className="rounded-[28px] border p-6 sm:p-8"
            style={{ borderColor: "var(--border)", background: "var(--app-card)" }}
          >
            <h2
              className="font-display text-2xl font-semibold tracking-tight"
              style={{ color: "var(--text-primary)" }}
            >
              {isEs ? "Preguntas frecuentes" : "FAQs"}
            </h2>
            <div className="mt-5 flex flex-col divide-y" style={cellStyle}>
              {food.faqs.map((faq) => (
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

          <section className="flex flex-col gap-3">
            <h2
              className="font-display text-xl font-semibold tracking-tight"
              style={{ color: "var(--text-primary)" }}
            >
              {isEs
                ? "Alimentos relacionados"
                : isPtBr
                ? "Alimentos relacionados"
                : isDe
                ? "Ähnliche Lebensmittel"
                : "Related foods"}
            </h2>
            <div className="flex flex-wrap gap-2">
              {food.related.map((relatedSlug) => {
                const related = getLocalizedFood(relatedSlug, locale) ?? getFood(relatedSlug);
                if (!related) return null;
                return (
                  <Link
                    key={relatedSlug}
                    href={getRelativeLocalizedUrl(`calories/${relatedSlug}`, locale)}
                    className="rounded-full border px-4 py-2 text-[13px] font-medium transition-opacity hover:opacity-70"
                    style={{
                      borderColor: "var(--border)",
                      color: "var(--text-primary)",
                      background: "var(--app-card)",
                    }}
                  >
                    {isEs
                      ? `Calorías en: ${related.name.toLowerCase()}`
                      : isPtBr
                      ? `Calorias em: ${related.name.toLowerCase()}`
                      : isDe
                      ? `Kalorien in: ${related.name}`
                      : `Calories in ${related.name.toLowerCase()}`}
                  </Link>
                );
              })}
            </div>
          </section>

          <p className="text-[12px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
            {isEs
              ? `Las cifras provienen de la base de datos de alimentos de LogMyPlate y son estimaciones para preparaciones típicas. No constituyen asesoramiento médico. Última actualización: ${foodDataUpdated}.`
              : isPtBr
              ? `Os valores provêm do banco de dados de alimentos do LogMyPlate e são estimativas para preparações típicas. Não constituem orientação médica. Última atualização: ${foodDataUpdated}.`
              : isDe
              ? `Die Nährwerte stammen aus der LogMyPlate Lebensmitteldatenbank und sind Schätzungen für typische Zubereitungen. Keine medizinische Beratung. Stand: ${foodDataUpdated}.`
              : `Figures come from the LogMyPlate food database and are estimates for typical preparations. They are not medical advice. Last updated ${foodDataUpdated}.`}
          </p>
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
                ? "Deja de buscarlo"
                : isPtBr
                ? "Chega de pesquisar tabelas"
                : isDe
                ? "Hör auf zu suchen"
                : "Stop looking this up"}
            </p>
            <h2
              className="mt-3 font-display text-2xl font-semibold tracking-tight"
              style={{ color: "var(--text-primary)" }}
            >
              {isEs
                ? "Fotografía el plato directamente."
                : isPtBr
                ? "Fotografe o prato diretamente."
                : isDe
                ? "Fotografiere einfach deinen Teller."
                : "Photograph the plate instead."}
            </h2>
            <p
              className="mt-3 text-[14px] leading-relaxed"
              style={{ color: "var(--text-secondary)" }}
            >
              {isEs
                ? `LogMyPlate reconoce ${food.name.toLowerCase()} — y todo lo demás en tu plato — a partir de una sola foto, en las porciones que realmente comes.`
                : isPtBr
                ? `O LogMyPlate reconhece ${food.name.toLowerCase()} — e tudo o mais no seu prato — a partir de uma única foto, nas porções reais que você consome.`
                : isDe
                ? `LogMyPlate erkennt ${food.name} — und alles andere auf deinem Teller — mit einem einzigen Foto in den Portionen, die du tatsächlich isst.`
                : `LogMyPlate reads ${food.name.toLowerCase()} — and everything else on the plate — from one photo, in the portions you actually eat.`}
            </p>
            <p className="mt-3 text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>
              {isEs
                ? "Cualquier comida. Con soporte para platos de todo el mundo."
                : isPtBr
                ? "Qualquer comida. Reconhece pratos do mundo todo."
                : isDe
                ? "Jede Mahlzeit. Erkennt Speisen aus aller Welt."
                : "Every food. Actually good at Indian."}
            </p>
            <DownloadBadges size="sm" className="mt-5" placement="food_page_sidebar" />
          </div>
        </aside>
      </div>
    </article>
  );
}
