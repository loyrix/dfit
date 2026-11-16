import Link from "next/link";
import { APP_CONFIG } from "@/config/app";
import type { Locale } from "@/lib/i18n/config";
import { getLocalizedUrl } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/types";

interface SupportViewProps {
  locale: Locale;
  dict: Dictionary;
}

export function SupportView({ locale, dict }: SupportViewProps) {
  const t = dict.support;

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: t.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  };

  return (
    <div className="min-h-screen pt-28 pb-24 px-5 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <div className="max-w-2xl mx-auto flex flex-col gap-12">
        {/* Header */}
        <div className="flex flex-col gap-3">
          <p
            className="text-[12px] font-semibold uppercase tracking-widest"
            style={{ color: "#5bbcaa" }}
          >
            {t.badge}
          </p>
          <h1
            className="font-display text-4xl sm:text-5xl font-bold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            {t.headline}
          </h1>
          <p className="text-[16px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {t.subtitle}{" "}
            <a
              href={`mailto:${APP_CONFIG.supportEmail}?subject=${encodeURIComponent(`${APP_CONFIG.brandName} support request`)}`}
              className="underline underline-offset-4 font-medium"
              style={{ color: "#f5a623" }}
            >
              {t.contactButton}
            </a>
            .
          </p>
        </div>

        {/* FAQ */}
        <div className="flex flex-col gap-0 divide-y" style={{ borderColor: "var(--border)" }}>
          {t.faqs.map((faq, i) => (
            <div key={i} className="py-6 flex flex-col gap-2">
              <p className="font-semibold text-[15px]" style={{ color: "var(--text-primary)" }}>
                {faq.q}
              </p>
              <p className="text-[14px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {faq.a}
              </p>
            </div>
          ))}
        </div>

        {/* Contact */}
        <div
          className="rounded-2xl p-8 flex flex-col gap-4"
          style={{
            background: "var(--surface-50)",
            border: "1px solid var(--border)",
          }}
        >
          <h2
            className="font-display text-xl font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            {t.contactBoxHeading}
          </h2>
          <p className="text-[14px]" style={{ color: "var(--text-secondary)" }}>
            {t.contactBoxText}
          </p>
          <a
            id="support-email-link"
            href={`mailto:${APP_CONFIG.supportEmail}?subject=${encodeURIComponent(`${APP_CONFIG.brandName} support request`)}`}
            className="inline-flex items-center gap-2 text-[14px] font-semibold underline underline-offset-4"
            style={{ color: "#f5a623" }}
          >
            {t.contactButton}
          </a>

          <div
            className="pt-2 flex flex-col gap-2 text-[13px]"
            style={{ color: "var(--text-muted)" }}
          >
            <p>More resources:</p>
            <Link
              href={getLocalizedUrl("guides", locale)}
              className="underline underline-offset-4 hover:opacity-100 opacity-70"
            >
              Browse meal tracking guides →
            </Link>
            <Link
              href={getLocalizedUrl("privacy", locale)}
              className="underline underline-offset-4 hover:opacity-100 opacity-70"
            >
              Privacy Policy →
            </Link>
            <Link
              href={getLocalizedUrl("terms", locale)}
              className="underline underline-offset-4 hover:opacity-100 opacity-70"
            >
              Terms of Service →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
