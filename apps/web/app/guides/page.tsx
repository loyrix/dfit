import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Guides — Meal Tracking with LogMyPlate",
  description:
    "Practical guides for tracking calories and macros with a photo-based food journal. Tips for Indian meals, AI calorie tracking, and building consistent habits.",
  alternates: { canonical: "/guides" },
};

const guides = [
  {
    href: "/guides/ai-calorie-tracker-india",
    title: "How AI calorie trackers work — and why they're different in India",
    summary:
      "Barcode-based trackers were built for packaged food. Here's why photo-based AI analysis is a better fit for Indian home cooking.",
    readTime: "4 min read",
    accent: "#f5a623",
  },
  {
    href: "/guides/indian-food-calorie-tracker",
    title: "Tracking calories in Indian food — a practical guide",
    summary:
      "Dal, roti, sabzi, biryani — how to log Indian meals accurately when every dish is cooked differently at home.",
    readTime: "5 min read",
    accent: "#5bbcaa",
  },
  {
    href: "/guides/photo-food-journal",
    title: "Why a photo food journal is easier to stick with",
    summary:
      "Manual food logging takes 10–15 minutes per meal. Logging with a photo takes 30 seconds. Here's what the research says about consistency.",
    readTime: "4 min read",
    accent: "#e8634a",
  },
  {
    href: "/guides/calorie-tracker-without-barcodes",
    title: "How to track calories without barcodes or food databases",
    summary:
      "Most of what we eat doesn't have a barcode. Photo-based calorie tracking solves this — here's how it works.",
    readTime: "4 min read",
    accent: "#f5a623",
  },
  {
    href: "/guides/meal-photo-tips",
    title: "How to take a great meal photo for accurate tracking",
    summary:
      "Lighting, angle, and what to do when portions are hidden. Simple tips that improve your AI estimates.",
    readTime: "3 min read",
    accent: "#5bbcaa",
  },
];

export default function GuidesIndexPage() {
  return (
    <div className="min-h-screen pt-28 pb-24 px-5 sm:px-6">
      <div className="max-w-2xl mx-auto flex flex-col gap-12">
        <div className="flex flex-col gap-3">
          <p
            className="text-[12px] font-semibold uppercase tracking-widest"
            style={{ color: "#f5a623" }}
          >
            Resources
          </p>
          <h1
            className="font-display text-4xl sm:text-5xl font-bold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Guides
          </h1>
          <p className="text-[16px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            Practical guides on meal tracking, AI food analysis, and building a consistent food
            journal habit.
          </p>
        </div>

        <div className="flex flex-col gap-0 divide-y" style={{ borderColor: "var(--border)" }}>
          {guides.map((guide) => (
            <Link
              key={guide.href}
              href={guide.href}
              className="group py-7 flex flex-col gap-2 transition-opacity hover:opacity-90"
            >
              <p
                className="text-[11px] font-semibold uppercase tracking-widest"
                style={{ color: guide.accent }}
              >
                {guide.readTime}
              </p>
              <h2
                className="font-display text-[19px] font-semibold leading-snug group-hover:opacity-90 transition-opacity"
                style={{ color: "var(--text-primary)" }}
              >
                {guide.title}
              </h2>
              <p className="text-[14px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {guide.summary}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
