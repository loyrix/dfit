import Image from "next/image";
import Link from "next/link";
import { DownloadBadges } from "@/components/download-badges";
import { APP_CONFIG } from "@/config/app";
import type { Locale } from "@/lib/i18n/config";
import { getLocalizedUrl, LOCALE_MAP } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/types";

interface HomeViewProps {
  locale: Locale;
  dict: Dictionary;
}

function PhoneShot({
  src,
  alt,
  className = "",
  priority = false,
}: {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-[30px] border shadow-2xl ${className}`}
      style={{
        borderColor: "rgba(239, 189, 68, 0.18)",
        background: "var(--app-card)",
        boxShadow: "0 28px 80px rgba(0, 0, 0, 0.28)",
      }}
    >
      <Image
        src={src}
        alt={alt}
        width={1242}
        height={2688}
        priority={priority}
        sizes="(max-width: 768px) 58vw, 280px"
        className="h-auto w-full"
      />
    </div>
  );
}

export function HomeView({ locale, dict }: HomeViewProps) {
  const t = dict.home;
  const isEn = locale === "en";
  const canonicalUrl = isEn
    ? APP_CONFIG.websiteUrl
    : `${APP_CONFIG.websiteUrl}/${locale}`;

  const homeJsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: APP_CONFIG.brandName,
      url: APP_CONFIG.websiteUrl,
      logo: `${APP_CONFIG.websiteUrl}/icon.png`,
      contactPoint: {
        "@type": "ContactPoint",
        email: APP_CONFIG.supportEmail,
        contactType: "customer support",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: APP_CONFIG.appName,
      applicationCategory: "HealthApplication",
      operatingSystem: "iOS, Android",
      description: t.metaDescription,
      image: `${APP_CONFIG.websiteUrl}/icon.png`,
      url: canonicalUrl,
      downloadUrl: [APP_CONFIG.appStoreUrl, APP_CONFIG.playStoreUrl],
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: APP_CONFIG.appName,
      url: canonicalUrl,
      inLanguage: LOCALE_MAP[locale].htmlLang,
    },
  ];

  const heroScreens = [
    {
      src: "/screenshots/appstore/meal-result-light.webp",
      alt: t.hero.altFrenchToast,
      className: "z-30 w-[220px] sm:w-[248px] lg:w-[276px]",
    },
    {
      src: "/screenshots/appstore/review-estimate-dark.webp",
      alt: t.hero.altThaliReview,
      className:
        "z-20 hidden sm:block w-[190px] lg:w-[224px] -ml-16 translate-y-14 rotate-[5deg] opacity-90",
    },
    {
      src: "/screenshots/appstore/today-dashboard-light.webp",
      alt: t.hero.altDashboard,
      className: "z-10 hidden lg:block w-[196px] -ml-20 -translate-y-10 rotate-[-7deg] opacity-90",
    },
  ];

  const flowScreens = [
    "/screenshots/appstore/scan-ready-light.webp",
    "/screenshots/appstore/analyzing-light.webp",
    "/screenshots/appstore/review-estimate-light.webp",
    "/screenshots/appstore/today-dashboard-light.webp",
  ];

  const macroItems = [
    { label: dict.common.macros.protein, value: "25g", color: "var(--app-teal)" },
    { label: dict.common.macros.carbs, value: "113g", color: "var(--app-amber)" },
    { label: dict.common.macros.fat, value: "21g", color: "var(--app-coral)" },
  ];

  const themeShots = [
    {
      src: "/screenshots/appstore/scan-ready-dark.webp",
      alt: t.themes.cards[0]?.alt ?? "Dark theme scan screen",
      label: t.themes.cards[0]?.label ?? "Dark theme",
    },
    {
      src: "/screenshots/appstore/today-dashboard-light.webp",
      alt: t.themes.cards[1]?.alt ?? "Light theme dashboard",
      label: t.themes.cards[1]?.label ?? "Light dashboard",
    },
    {
      src: "/screenshots/appstore/edit-item-light.webp",
      alt: t.themes.cards[2]?.alt ?? "Edit item sheet",
      label: t.themes.cards[2]?.label ?? "Edit any item",
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd) }}
      />
      <section
        className="relative min-h-screen overflow-hidden px-5 pb-16 pt-24 sm:px-6 lg:pt-28"
        aria-label={`${APP_CONFIG.appName} hero`}
      >
        <div className="absolute inset-x-0 top-0 h-px bg-[var(--border)]" aria-hidden="true" />
        <div
          className="app-rings pointer-events-none absolute left-1/2 top-28 h-[360px] w-[360px] -translate-x-1/2 opacity-25"
          aria-hidden="true"
        />

        <div className="relative mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="flex flex-col items-start gap-7">
            <div
              className="inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[12px] font-semibold tracking-[0.28em]"
              style={{
                borderColor: "rgba(239, 189, 68, 0.26)",
                background: "rgba(239, 189, 68, 0.11)",
                color: "var(--app-amber)",
              }}
            >
              {t.hero.badge}
            </div>

            <div className="flex flex-col gap-5">
              <h1
                className="font-display text-5xl font-bold leading-[1.02] tracking-tight sm:text-6xl lg:text-[72px]"
                style={{ color: "var(--text-primary)" }}
              >
                {t.hero.headline}
                <br />
                {t.hero.headlineBreak}
              </h1>
              <p
                className="max-w-[520px] text-[18px] leading-relaxed sm:text-[20px]"
                style={{ color: "var(--text-secondary)" }}
              >
                {t.hero.subheadline}
              </p>
            </div>

            <DownloadBadges
              size="lg"
              placement="home_hero"
              ariaLabels={{
                appStore: dict.downloadBadges.appStoreAria,
                googlePlay: dict.downloadBadges.playStoreAria,
              }}
            />

            <div
              className="flex flex-wrap gap-3 text-[13px]"
              style={{ color: "var(--text-muted)" }}
            >
              <span
                className="rounded-full border px-4 py-2"
                style={{ borderColor: "var(--border)" }}
              >
                {t.hero.pillNoBarcode}
              </span>
              <span
                className="rounded-full border px-4 py-2"
                style={{ borderColor: "var(--border)" }}
              >
                {t.hero.pillCuisines}
              </span>
              <span
                className="rounded-full border px-4 py-2"
                style={{ borderColor: "var(--border)" }}
              >
                {t.hero.pillThemes}
              </span>
            </div>
          </div>

          <div className="relative flex min-h-[560px] items-center justify-center lg:justify-end">
            <div
              className="absolute inset-8 rounded-[48px] opacity-80 blur-3xl"
              style={{ background: "rgba(239, 189, 68, 0.13)" }}
              aria-hidden="true"
            />
            <div className="relative flex items-center justify-center">
              {heroScreens.map((screen, index) => (
                <PhoneShot
                  key={screen.src}
                  src={screen.src}
                  alt={screen.alt}
                  className={screen.className}
                  priority={index === 0}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section
        id="how-it-works"
        className="px-5 py-24 sm:px-6"
        aria-label={t.howItWorks.title}
      >
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 max-w-2xl">
            <p
              className="mb-3 text-[12px] font-semibold uppercase tracking-[0.32em]"
              style={{ color: "var(--app-amber)" }}
            >
              {t.howItWorks.badge}
            </p>
            <h2
              className="font-display text-4xl font-bold tracking-tight sm:text-5xl"
              style={{ color: "var(--text-primary)" }}
            >
              {t.howItWorks.title}
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {t.howItWorks.flow.map((item, index) => (
              <article
                key={item.title}
                className="group flex flex-col gap-5 rounded-[34px] border p-4"
                style={{ borderColor: "var(--border)", background: "var(--app-card)" }}
              >
                <PhoneShot
                  src={flowScreens[index] ?? "/screenshots/appstore/scan-ready-light.webp"}
                  alt={item.alt}
                  className="mx-auto w-[170px] shadow-xl"
                />
                <div className="px-2 pb-3">
                  <p
                    className="mb-2 text-[11px] font-semibold uppercase tracking-[0.32em]"
                    style={{ color: "var(--app-amber)" }}
                  >
                    {item.eyebrow}
                  </p>
                  <h3
                    className="font-display text-[22px] font-semibold tracking-tight"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {item.title}
                  </h3>
                  <p
                    className="mt-2 text-[14px] leading-relaxed"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {item.body}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        className="px-5 py-24 sm:px-6"
        aria-label={t.reviewEstimate.title}
        style={{ background: "var(--surface-50)" }}
      >
        <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-2">
          <div className="relative flex justify-center">
            <PhoneShot
              src="/screenshots/appstore/meal-result-dark.webp"
              alt={t.reviewEstimate.altMealDetail}
              className="w-[240px] sm:w-[286px]"
            />
            <div
              className="absolute -bottom-8 right-4 hidden rounded-[28px] border p-5 shadow-2xl sm:block"
              style={{ borderColor: "var(--border)", background: "var(--app-card-strong)" }}
            >
              <p className="text-[12px] tracking-[0.28em]" style={{ color: "var(--text-muted)" }}>
                {t.reviewEstimate.macroMixBadge}
              </p>
              <div className="mt-4 flex gap-3">
                {macroItems.map((item) => (
                  <div
                    key={item.label}
                    className="min-w-24 rounded-2xl border p-3"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <span
                      className="mb-3 block h-2 w-2 rounded-full"
                      style={{ background: item.color }}
                    />
                    <strong className="block text-2xl" style={{ color: "var(--text-primary)" }}>
                      {item.value}
                    </strong>
                    <span className="text-[12px]" style={{ color: "var(--text-secondary)" }}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <p
              className="mb-3 text-[12px] font-semibold uppercase tracking-[0.32em]"
              style={{ color: "var(--app-teal)" }}
            >
              {t.reviewEstimate.badge}
            </p>
            <h2
              className="font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl"
              style={{ color: "var(--text-primary)" }}
            >
              {t.reviewEstimate.title}
            </h2>
            <div
              className="mt-6 flex max-w-xl flex-col gap-5 text-[16px] leading-relaxed"
              style={{ color: "var(--text-secondary)" }}
            >
              <p>{t.reviewEstimate.paragraph1}</p>
              <p>{t.reviewEstimate.paragraph2}</p>
            </div>
          </div>
        </div>
      </section>

      <section
        id="ai-nutritionist"
        className="px-5 py-24 sm:px-6"
        aria-label={t.aiNutritionist.title}
      >
        <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <span
              className="mb-5 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em]"
              style={{
                borderColor: "rgba(112, 202, 163, 0.32)",
                background: "rgba(112, 202, 163, 0.12)",
                color: "var(--app-teal)",
              }}
            >
              {t.aiNutritionist.badge}
            </span>
            <h2
              className="font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl"
              style={{ color: "var(--text-primary)" }}
            >
              {t.aiNutritionist.title}
            </h2>
            <div
              className="mt-6 flex max-w-xl flex-col gap-5 text-[16px] leading-relaxed"
              style={{ color: "var(--text-secondary)" }}
            >
              <p>{t.aiNutritionist.paragraph1}</p>
            </div>
            <ul className="mt-7 flex flex-col gap-3.5">
              {[
                t.aiNutritionist.bullet1,
                t.aiNutritionist.bullet2,
                t.aiNutritionist.bullet3,
              ].map((point) => (
                <li
                  key={point}
                  className="flex items-start gap-3 text-[15px]"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <span
                    className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full"
                    style={{ background: "var(--app-teal)" }}
                    aria-hidden="true"
                  />
                  {point}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative flex justify-center lg:justify-end">
            <div
              className="absolute inset-6 rounded-[44px] opacity-70 blur-3xl"
              style={{ background: "rgba(112, 202, 163, 0.16)" }}
              aria-hidden="true"
            />
            <div className="relative flex items-center justify-center">
              <PhoneShot
                src="/screenshots/appstore/ai-chat-light.webp"
                alt={t.aiNutritionist.altChat}
                className="z-20 w-[230px] sm:w-[260px]"
              />
              <PhoneShot
                src="/screenshots/appstore/weekly-summary-dark.webp"
                alt={t.aiNutritionist.altWeeklySummary}
                className="z-10 hidden sm:block w-[180px] lg:w-[200px] -ml-14 translate-y-12 rotate-[6deg] opacity-95"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-24 sm:px-6" aria-label={t.themes.title}>
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 grid gap-8 lg:grid-cols-[0.85fr_1fr] lg:items-end">
            <div>
              <p
                className="mb-3 text-[12px] font-semibold uppercase tracking-[0.32em]"
                style={{ color: "var(--app-coral)" }}
              >
                {t.themes.badge}
              </p>
              <h2
                className="font-display text-4xl font-bold tracking-tight sm:text-5xl"
                style={{ color: "var(--text-primary)" }}
              >
                {t.themes.title}
              </h2>
            </div>
            <p className="text-[16px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {t.themes.subtitle}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {themeShots.map((shot) => (
              <div key={shot.src} className="flex flex-col items-center gap-4">
                <PhoneShot src={shot.src} alt={shot.alt} className="w-[210px] sm:w-[232px]" />
                <p className="text-[13px] font-medium" style={{ color: "var(--text-secondary)" }}>
                  {shot.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="premium" className="px-5 py-24 sm:px-6" aria-label={t.premium.srTitle}>
        <div
          className="mx-auto max-w-6xl overflow-hidden rounded-[40px] border p-8 sm:p-12"
          style={{
            borderColor: "rgba(239, 189, 68, 0.3)",
            background:
              "linear-gradient(140deg, rgba(239, 189, 68, 0.16) 0%, rgba(245, 166, 35, 0.08) 45%, var(--app-card) 100%)",
          }}
        >
          <h2 className="sr-only">{t.premium.srTitle}</h2>

          <div className="overflow-hidden rounded-[28px] shadow-xl">
            <Image
              src="/promo/launch-offer-landscape.webp"
              alt={t.premium.bannerAltLandscape}
              width={1920}
              height={1072}
              priority={false}
              sizes="(max-width: 768px) 90vw, 1100px"
              className="hidden h-auto w-full sm:block"
            />
            <Image
              src="/promo/launch-offer-portrait.webp"
              alt={t.premium.bannerAltPortrait}
              width={1080}
              height={1935}
              priority={false}
              sizes="90vw"
              className="block h-auto w-full sm:hidden"
            />
          </div>

          <p
            className="mt-8 max-w-2xl text-[17px] leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
          >
            {t.premium.intro}
          </p>

          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {t.premium.tiers.map((tier) => (
              <div
                key={tier.label}
                className="rounded-[28px] border p-6"
                style={{ borderColor: "var(--border)", background: "var(--app-card-strong)" }}
              >
                <p
                  className="mb-4 text-[12px] font-semibold uppercase tracking-[0.2em]"
                  style={{ color: tier.accent }}
                >
                  {tier.label}
                </p>
                <ul className="flex flex-col gap-3">
                  {tier.perks.map((perk) => (
                    <li
                      key={perk}
                      className="flex items-start gap-3 text-[15px]"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      <span
                        className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full"
                        style={{ background: tier.accent }}
                        aria-hidden="true"
                      />
                      {perk}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-col items-start gap-4">
            <DownloadBadges
              size="lg"
              placement="home_pricing"
              ariaLabels={{
                appStore: dict.downloadBadges.appStoreAria,
                googlePlay: dict.downloadBadges.playStoreAria,
              }}
            />
            <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>
              {t.premium.note}
            </p>
          </div>
        </div>
      </section>

      <section
        className="px-5 py-24 sm:px-6"
        aria-label={`${APP_CONFIG.appName} download call to action`}
        style={{ background: "var(--surface-50)" }}
      >
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-8 text-center">
          <Image
            src="/icon.png"
            alt={`${APP_CONFIG.appName} icon`}
            width={82}
            height={82}
            className="rounded-[22px] shadow-2xl"
          />
          <h2
            className="font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl"
            style={{ color: "var(--text-primary)" }}
          >
            {t.ctaSection.title}
          </h2>
          <p
            className="max-w-xl text-[17px] leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
          >
            {t.ctaSection.subtitle}
          </p>
          <DownloadBadges
            size="lg"
            placement="home_footer_cta"
            ariaLabels={{
              appStore: dict.downloadBadges.appStoreAria,
              googlePlay: dict.downloadBadges.playStoreAria,
            }}
          />
          <Link
            href={getLocalizedUrl("privacy", locale)}
            className="text-[12px] underline underline-offset-4 opacity-60 transition-opacity hover:opacity-100"
            style={{ color: "var(--text-muted)" }}
          >
            {t.ctaSection.privacyLink}
          </Link>
        </div>
      </section>
    </>
  );
}
