import type { Metadata } from "next";
import Link from "next/link";
import { DownloadBadges } from "@/components/download-badges";
import { APP_CONFIG } from "@/config/app";
import { type FoodPage, foodDataUpdated, getFood, scale } from "./food-data";

export const foodMetadata = (food: FoodPage): Metadata => ({
  title: food.title,
  description: food.description,
  keywords: [
    `calories in ${food.name.toLowerCase()}`,
    `${food.name.toLowerCase()} calories`,
    `${food.name.toLowerCase()} protein`,
    `${food.name.toLowerCase()} nutrition`,
    ...food.aka.map((alias) => `calories in ${alias}`),
  ],
  alternates: { canonical: `/calories/${food.slug}` },
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

export function FoodArticle({ slug }: { slug: string }) {
  const food = getFood(slug);
  if (!food) return null;

  const url = `${APP_CONFIG.websiteUrl}/calories/${food.slug}`;
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
      mainEntityOfPage: url,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: APP_CONFIG.websiteUrl },
        {
          "@type": "ListItem",
          position: 2,
          name: "Calories",
          item: `${APP_CONFIG.websiteUrl}/calories`,
        },
        { "@type": "ListItem", position: 3, name: food.name, item: url },
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
              href="/calories"
              className="w-fit text-[12px] font-medium opacity-60 transition-opacity hover:opacity-100"
              style={{ color: "var(--text-secondary)" }}
            >
              All foods
            </Link>
            <h1
              className="font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl"
              style={{ color: "var(--text-primary)" }}
            >
              Calories in {food.name.toLowerCase()}
            </h1>
            {food.aka.length > 0 && (
              <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>
                Also known as {food.aka.join(", ")}
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
              {food.name} calories by portion
            </h2>
            <div className="overflow-x-auto rounded-[20px] border" style={cellStyle}>
              <table className="w-full min-w-[520px] border-collapse text-[14px]">
                <thead>
                  <tr style={{ background: "var(--app-card)" }}>
                    {["Portion", "Weight", "Calories", "Protein", "Carbs", "Fat", "Fibre"].map(
                      (head) => (
                        <th
                          key={head}
                          className="border-b px-4 py-3 text-left font-semibold"
                          style={{ ...cellStyle, color: "var(--text-primary)" }}
                        >
                          {head}
                        </th>
                      ),
                    )}
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
              Per 100 g: {food.per100g.calories} cal · {food.per100g.protein} g protein ·{" "}
              {food.per100g.carbs} g carbs · {food.per100g.fat} g fat
              {food.per100g.fiber !== undefined && ` · ${food.per100g.fiber} g fibre`}
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
              Why one number isn&apos;t enough
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
              What actually changes the number
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
              Reading the macros
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
                    {["", "Calories", "Protein", "Fibre"].map((head) => (
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
                    const other = getFood(item.slug);
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
                              href={`/calories/${item.slug}`}
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
              FAQs
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
              Related foods
            </h2>
            <div className="flex flex-wrap gap-2">
              {food.related.map((relatedSlug) => {
                const related = getFood(relatedSlug);
                if (!related) return null;
                return (
                  <Link
                    key={relatedSlug}
                    href={`/calories/${relatedSlug}`}
                    className="rounded-full border px-4 py-2 text-[13px] font-medium transition-opacity hover:opacity-70"
                    style={{
                      borderColor: "var(--border)",
                      color: "var(--text-primary)",
                      background: "var(--app-card)",
                    }}
                  >
                    Calories in {related.name.toLowerCase()}
                  </Link>
                );
              })}
            </div>
          </section>

          <p className="text-[12px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
            Figures come from the LogMyPlate food database and are estimates for typical
            preparations. They are not medical advice. Last updated {foodDataUpdated}.
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
              Stop looking this up
            </p>
            <h2
              className="mt-3 font-display text-2xl font-semibold tracking-tight"
              style={{ color: "var(--text-primary)" }}
            >
              Photograph the plate instead.
            </h2>
            <p
              className="mt-3 text-[14px] leading-relaxed"
              style={{ color: "var(--text-secondary)" }}
            >
              LogMyPlate reads {food.name.toLowerCase()} — and everything else on the plate — from
              one photo, in the portions you actually eat.
            </p>
            <p className="mt-3 text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>
              Every food. Actually good at Indian.
            </p>
            <DownloadBadges size="sm" className="mt-5" />
          </div>
        </aside>
      </div>
    </article>
  );
}
