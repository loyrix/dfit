import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { DownloadBadges } from "@/components/download-badges";
import { APP_CONFIG } from "@/config/app";

export const metadata: Metadata = {
  title: "LogMyPlate — Track Meals from a Photo",
  description:
    "Snap a photo of your meal. LogMyPlate's AI identifies food items, estimates calories and macros, and saves everything to your journal — no barcodes needed.",
  alternates: { canonical: "/" },
};

const steps = [
  {
    num: "01",
    title: "Take a photo",
    body: "Point your camera at your plate — or pick an existing photo. No staging required.",
    accent: "#f5a623",
  },
  {
    num: "02",
    title: "AI reads the plate",
    body: "Our model identifies each item, estimates portion size, and returns calorie and macro data in seconds.",
    accent: "#5bbcaa",
  },
  {
    num: "03",
    title: "Review & correct",
    body: "Adjust any item or portion. The app learns from your corrections over time.",
    accent: "#e8634a",
  },
  {
    num: "04",
    title: "Saved to your journal",
    body: "Every confirmed meal is stored in your daily journal with totals, trends, and weekly summaries.",
    accent: "#f5a623",
  },
];

export default function HomePage() {
  return (
    <>
      {/* ─── Hero ─────────────────────────────────────────────────────────── */}
      <section
        className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-24 pb-16 px-5 sm:px-6"
        aria-label="Hero"
      >
        {/* Background glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden="true"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(245,166,35,0.08) 0%, transparent 70%)",
          }}
        />

        <div className="relative max-w-6xl mx-auto w-full grid md:grid-cols-2 gap-12 md:gap-8 items-center">
          {/* Left — copy */}
          <div className="order-2 md:order-1 flex flex-col gap-6">
            {/* Eyebrow */}
            <div
              className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[12px] font-semibold w-fit"
              style={{
                background: "rgba(245,166,35,0.12)",
                color: "#f5a623",
                border: "1px solid rgba(245,166,35,0.25)",
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#f5a623] animate-pulse" />
              iOS · Android
            </div>

            {/* Headline */}
            <h1
              className="font-display text-5xl sm:text-6xl md:text-5xl lg:text-[60px] font-bold leading-[1.08] tracking-tight"
              style={{ color: "var(--text-primary)" }}
            >
              Snap a photo.
              <br />
              <span className="gradient-text">Know your meal.</span>
            </h1>

            {/* Sub-copy */}
            <p
              className="text-[17px] leading-relaxed max-w-[460px]"
              style={{ color: "var(--text-secondary)" }}
            >
              LogMyPlate uses AI to identify every item on your plate, estimate calories and macros,
              and add it to your journal — in seconds. Works for Indian meals, global cuisines, and
              everything in between.
            </p>

            {/* Download badges */}
            <DownloadBadges size="lg" className="mt-2" />

            {/* Social proof line */}
            <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>
              Free to download · No barcode scanning required
            </p>
          </div>

          {/* Right — phone mockup */}
          <div className="order-1 md:order-2 flex justify-center md:justify-end">
            <div className="relative w-[280px] sm:w-[320px] md:w-[300px] lg:w-[340px]">
              <Image
                src="/hero-mockup.png"
                alt="LogMyPlate app showing AI meal analysis of Dal Tadka and Rice"
                width={680}
                height={680}
                priority
                className="w-full h-auto drop-shadow-2xl"
              />
            </div>
          </div>
        </div>

        {/* Scroll cue */}
        <div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 opacity-40"
          aria-hidden="true"
        >
          <div className="w-px h-8 animate-pulse" style={{ background: "var(--text-muted)" }} />
          <span className="text-[10px] tracking-widest" style={{ color: "var(--text-muted)" }}>
            SCROLL
          </span>
        </div>
      </section>

      {/* ─── How it works ─────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 px-5 sm:px-6" aria-label="How LogMyPlate works">
        <div className="max-w-6xl mx-auto">
          <div className="mb-16 max-w-xl">
            <p
              className="text-[12px] font-semibold uppercase tracking-widest mb-3"
              style={{ color: "#f5a623" }}
            >
              How it works
            </p>
            <h2
              className="font-display text-3xl sm:text-4xl font-bold leading-tight tracking-tight"
              style={{ color: "var(--text-primary)" }}
            >
              From plate to journal
              <br />
              in four steps.
            </h2>
          </div>

          <div
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px"
            style={{ background: "var(--border)" }}
          >
            {steps.map((step) => (
              <div
                key={step.num}
                className="flex flex-col gap-4 p-8"
                style={{ background: "var(--background)" }}
              >
                <span
                  className="font-display text-[40px] font-bold leading-none tabular-nums"
                  style={{ color: step.accent, opacity: 0.6 }}
                >
                  {step.num}
                </span>
                <h3
                  className="font-display text-[18px] font-semibold leading-tight"
                  style={{ color: "var(--text-primary)" }}
                >
                  {step.title}
                </h3>
                <p
                  className="text-[14px] leading-relaxed"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Indian / Global meals ────────────────────────────────────────── */}
      <section
        className="py-24 px-5 sm:px-6"
        aria-label="Works for Indian and global meals"
        style={{ background: "var(--surface-50)" }}
      >
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 md:gap-20 items-center">
          {/* Text */}
          <div>
            <p
              className="text-[12px] font-semibold uppercase tracking-widest mb-3"
              style={{ color: "#5bbcaa" }}
            >
              Built for real food
            </p>
            <h2
              className="font-display text-3xl sm:text-4xl font-bold leading-tight tracking-tight mb-6"
              style={{ color: "var(--text-primary)" }}
            >
              Dal, roti, biryani —
              <br />
              no barcode needed.
            </h2>
            <div
              className="flex flex-col gap-5 text-[15px] leading-relaxed"
              style={{ color: "var(--text-secondary)" }}
            >
              <p>
                Most calorie trackers rely on barcodes or massive food databases — neither of which
                covers the diversity of Indian home cooking. LogMyPlate skips all of that.
              </p>
              <p>
                The model reads your plate as a whole, identifies each dish, and estimates portions
                based on visual size. Dal tadka, paneer butter masala, rajma, or your
                grandmother&apos;s mixed sabzi — it handles them all.
              </p>
              <p>
                It works just as well for salads, pasta, sushi, or whatever you&apos;re eating. The
                AI doesn&apos;t have a home cuisine.
              </p>
            </div>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-2 gap-px" style={{ background: "var(--border)" }}>
            {[
              { value: "Photo", label: "only input needed" },
              { value: "AI", label: "powered estimation" },
              { value: "Macros", label: "protein, carbs, fat" },
              { value: "Journal", label: "weekly trends" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex flex-col gap-1 p-8"
                style={{ background: "var(--surface-50)" }}
              >
                <span
                  className="font-display text-3xl font-bold"
                  style={{ color: "var(--text-primary)" }}
                >
                  {stat.value}
                </span>
                <span className="text-[13px]" style={{ color: "var(--text-muted)" }}>
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Privacy / Trust ─────────────────────────────────────────────── */}
      <section className="py-24 px-5 sm:px-6" aria-label="Privacy and trust">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 md:gap-20 items-start">
          <div>
            <p
              className="text-[12px] font-semibold uppercase tracking-widest mb-3"
              style={{ color: "#e8634a" }}
            >
              Privacy
            </p>
            <h2
              className="font-display text-3xl sm:text-4xl font-bold leading-tight tracking-tight mb-6"
              style={{ color: "var(--text-primary)" }}
            >
              Your food data
              <br />
              stays yours.
            </h2>
            <p className="text-[15px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              Your meal photos are used only to generate your calorie and macro estimate. We
              don&apos;t sell your data, share it with advertisers, or use it for any purpose other
              than running your journal.
            </p>
          </div>
          <div className="flex flex-col gap-6 pt-1">
            {[
              {
                title: "Account optional",
                body: "Start tracking without an account. Sign up with email only if you want to sync data across devices.",
              },
              {
                title: "Delete any time",
                body: "You can deactivate or permanently delete your account and all associated data from within the app.",
              },
              {
                title: "AI estimates are estimates",
                body: "Calorie and macro values are AI approximations, not medical measurements. They are a useful reference, not a clinical tool.",
              },
            ].map((item) => (
              <div key={item.title} className="flex gap-4">
                <div
                  className="w-0.5 rounded-full flex-shrink-0 mt-1"
                  style={{ height: "auto", background: "#e8634a", opacity: 0.5 }}
                />
                <div>
                  <p
                    className="font-semibold text-[14px] mb-1"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {item.title}
                  </p>
                  <p
                    className="text-[13px] leading-relaxed"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {item.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Download CTA ─────────────────────────────────────────────────── */}
      <section
        className="py-24 px-5 sm:px-6"
        aria-label="Download LogMyPlate"
        style={{ background: "var(--surface-50)" }}
      >
        <div className="max-w-2xl mx-auto text-center flex flex-col items-center gap-8">
          <h2
            className="font-display text-4xl sm:text-5xl font-bold leading-tight tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Start logging
            <br />
            <span className="gradient-text">your first plate.</span>
          </h2>
          <p
            className="text-[16px] leading-relaxed max-w-sm"
            style={{ color: "var(--text-secondary)" }}
          >
            Free on iOS and Android. No subscription required to get started.
          </p>
          <DownloadBadges size="lg" />
          <Link
            href="/privacy"
            className="text-[12px] underline underline-offset-4 opacity-50 hover:opacity-100 transition-opacity"
            style={{ color: "var(--text-muted)" }}
          >
            Privacy Policy
          </Link>
        </div>
      </section>
    </>
  );
}
