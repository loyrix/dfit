import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { DownloadBadges } from "@/components/download-badges";
import { APP_CONFIG } from "@/config/app";

export const metadata: Metadata = {
  title: `${APP_CONFIG.appName} — Track Meals from a Photo`,
  description:
    "Snap a photo of your meal. LogMyPlate: AI Calorie Tracker identifies food items, estimates calories and macros, and saves everything to your journal — no barcodes needed.",
  alternates: { canonical: "/" },
};

const heroScreens = [
  {
    src: "/screenshots/appstore/scan-ready-dark.webp",
    alt: "LogMyPlate scan screen with an Indian veg thali photo ready to analyze",
    className: "z-30 w-[220px] sm:w-[248px] lg:w-[276px]",
  },
  {
    src: "/screenshots/appstore/review-estimate-dark.webp",
    alt: "LogMyPlate review estimate screen showing calories and macros",
    className:
      "z-20 hidden sm:block w-[190px] lg:w-[224px] -ml-16 translate-y-14 rotate-[5deg] opacity-90",
  },
  {
    src: "/screenshots/appstore/today-dashboard-light.webp",
    alt: "LogMyPlate light theme dashboard with macro mix and weekly rhythm",
    className: "z-10 hidden lg:block w-[196px] -ml-20 -translate-y-10 rotate-[-7deg] opacity-90",
  },
];

const flow = [
  {
    eyebrow: "Photo",
    title: "Photo plus food note",
    body: "Start with one clear plate image. Add a short note like 'Indian veg thali' when it helps the AI.",
    image: "/screenshots/appstore/scan-ready-light.webp",
    alt: "LogMyPlate light theme scan screen with a meal photo ready to analyze",
  },
  {
    eyebrow: "Analyze",
    title: "AI reads the plate",
    body: "The app calculates calories and macro nutrients while keeping the photo flow simple.",
    image: "/screenshots/appstore/analyzing-dark.webp",
    alt: "LogMyPlate analyzing screen reading a meal photo",
  },
  {
    eyebrow: "Review",
    title: "Confirm the estimate",
    body: "Review every item, portion, and macro before the meal is saved to your journal.",
    image: "/screenshots/appstore/review-estimate-dark.webp",
    alt: "LogMyPlate review estimate screen with food items to confirm",
  },
  {
    eyebrow: "Journal",
    title: "Build your rhythm",
    body: "See daily energy, macro mix, weekly rhythm, and meal details in one calm journal.",
    image: "/screenshots/appstore/today-dashboard-light.webp",
    alt: "LogMyPlate dashboard showing daily energy and weekly rhythm",
  },
];

const macroItems = [
  { label: "Protein", value: "33g", color: "var(--app-teal)" },
  { label: "Carbs", value: "193g", color: "var(--app-amber)" },
  { label: "Fat", value: "28g", color: "var(--app-coral)" },
];

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

export default function HomePage() {
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
      description: APP_CONFIG.description,
      image: `${APP_CONFIG.websiteUrl}/icon.png`,
      url: APP_CONFIG.websiteUrl,
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
      url: APP_CONFIG.websiteUrl,
      inLanguage: "en",
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
        aria-label="LogMyPlate hero"
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
              PHOTO · REVIEW · JOURNAL
            </div>

            <div className="flex flex-col gap-5">
              <h1
                className="font-display text-5xl font-bold leading-[1.02] tracking-tight sm:text-6xl lg:text-[72px]"
                style={{ color: "var(--text-primary)" }}
              >
                Track meals
                <br />
                from a photo.
              </h1>
              <p
                className="max-w-[520px] text-[18px] leading-relaxed sm:text-[20px]"
                style={{ color: "var(--text-secondary)" }}
              >
                {APP_CONFIG.appName} turns a plate photo and short note into an editable calorie,
                macro, and journal entry.
              </p>
            </div>

            <DownloadBadges size="lg" />

            <div
              className="flex flex-wrap gap-3 text-[13px]"
              style={{ color: "var(--text-muted)" }}
            >
              <span
                className="rounded-full border px-4 py-2"
                style={{ borderColor: "var(--border)" }}
              >
                No barcode required
              </span>
              <span
                className="rounded-full border px-4 py-2"
                style={{ borderColor: "var(--border)" }}
              >
                Indian and global meals
              </span>
              <span
                className="rounded-full border px-4 py-2"
                style={{ borderColor: "var(--border)" }}
              >
                Light and dark app themes
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

      <section id="how-it-works" className="px-5 py-24 sm:px-6" aria-label="How LogMyPlate works">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 max-w-2xl">
            <p
              className="mb-3 text-[12px] font-semibold uppercase tracking-[0.32em]"
              style={{ color: "var(--app-amber)" }}
            >
              How it works
            </p>
            <h2
              className="font-display text-4xl font-bold tracking-tight sm:text-5xl"
              style={{ color: "var(--text-primary)" }}
            >
              The same flow users see in the app.
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {flow.map((item) => (
              <article
                key={item.title}
                className="group flex flex-col gap-5 rounded-[34px] border p-4"
                style={{ borderColor: "var(--border)", background: "var(--app-card)" }}
              >
                <PhoneShot
                  src={item.image}
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
        aria-label="Macro review and meal details"
        style={{ background: "var(--surface-50)" }}
      >
        <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-2">
          <div className="relative flex justify-center">
            <PhoneShot
              src="/screenshots/appstore/meal-result-dark.webp"
              alt="LogMyPlate meal detail screen showing macro profile and item contribution"
              className="w-[240px] sm:w-[286px]"
            />
            <div
              className="absolute -bottom-8 right-4 hidden rounded-[28px] border p-5 shadow-2xl sm:block"
              style={{ borderColor: "var(--border)", background: "var(--app-card-strong)" }}
            >
              <p className="text-[12px] tracking-[0.28em]" style={{ color: "var(--text-muted)" }}>
                MACRO MIX
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
              Review estimate
            </p>
            <h2
              className="font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl"
              style={{ color: "var(--text-primary)" }}
            >
              Calories are useful only when you can edit them.
            </h2>
            <div
              className="mt-6 flex max-w-xl flex-col gap-5 text-[16px] leading-relaxed"
              style={{ color: "var(--text-secondary)" }}
            >
              <p>
                The app shows the estimate before saving: total energy, macro split, item list,
                grams, portions, and each item&apos;s calorie contribution.
              </p>
              <p>
                You stay in control of the final log. Scan, review, correct what needs correcting,
                then save the meal when it looks right.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-24 sm:px-6" aria-label="Light and dark app themes">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 grid gap-8 lg:grid-cols-[0.85fr_1fr] lg:items-end">
            <div>
              <p
                className="mb-3 text-[12px] font-semibold uppercase tracking-[0.32em]"
                style={{ color: "var(--app-coral)" }}
              >
                App theme
              </p>
              <h2
                className="font-display text-4xl font-bold tracking-tight sm:text-5xl"
                style={{ color: "var(--text-primary)" }}
              >
                Light or dark, your journal stays calm.
              </h2>
            </div>
            <p className="text-[16px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              LogMyPlate follows your preferred theme while keeping the same meal scan, target, and
              journal flow easy to read.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                src: "/screenshots/appstore/today-dashboard-dark.webp",
                alt: "LogMyPlate dark theme today dashboard",
                label: "Dark dashboard",
              },
              {
                src: "/screenshots/appstore/today-dashboard-light.webp",
                alt: "LogMyPlate light theme today dashboard",
                label: "Light dashboard",
              },
              {
                src: "/screenshots/appstore/edit-target-dark.webp",
                alt: "LogMyPlate daily target screen in dark theme",
                label: "Target setup",
              },
            ].map((shot) => (
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

      <section
        className="px-5 py-24 sm:px-6"
        aria-label={`Download ${APP_CONFIG.appName}`}
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
            Start with one clear meal photo.
          </h2>
          <p
            className="max-w-xl text-[17px] leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
          >
            Add a note, review the estimate, and keep your journal moving with a calorie tracker
            designed around real meals.
          </p>
          <DownloadBadges size="lg" />
          <Link
            href="/privacy"
            className="text-[12px] underline underline-offset-4 opacity-60 transition-opacity hover:opacity-100"
            style={{ color: "var(--text-muted)" }}
          >
            Privacy Policy
          </Link>
        </div>
      </section>
    </>
  );
}
