import type { Metadata } from "next";
import Link from "next/link";
import { DownloadBadges } from "@/components/download-badges";

export const metadata: Metadata = {
  title: "How to Take a Great Meal Photo for Accurate Calorie Tracking",
  description:
    "Lighting, angle, and what to do when portions overlap. Simple tips that improve your AI calorie estimates in LogMyPlate.",
  alternates: { canonical: "/guides/meal-photo-tips" },
};

const tips = [
  {
    title: "Shoot top-down",
    body: "A straight-down angle shows every item on the plate clearly. Angled shots hide items at the back and make portions harder to estimate accurately.",
    accent: "#f5a623",
  },
  {
    title: "Use natural light",
    body: "Window light is ideal. Overhead kitchen lights create harsh shadows and can make food look dull. Avoid flash — it flattens the image and makes AI identification harder.",
    accent: "#5bbcaa",
  },
  {
    title: "Don't mix items before photographing",
    body: "Take your photo before mixing rice into dal or tearing roti. Mixed dishes lose their individual characteristics, making identification and portion estimation less reliable.",
    accent: "#e8634a",
  },
  {
    title: "Spread items apart if possible",
    body: "If two rotis are stacked, the AI may count one. Spread food out so items don't overlap before shooting.",
    accent: "#f5a623",
  },
  {
    title: "Include the full plate",
    body: "Don't crop the photo tight. The plate edge and any sauce area helps the model understand relative portion sizes.",
    accent: "#5bbcaa",
  },
  {
    title: "Write a hint if needed",
    body: "LogMyPlate lets you type a hint before scanning — for example, 'homemade dal makhani with jeera rice'. This helps the AI when the dish is visually ambiguous.",
    accent: "#e8634a",
  },
];

export default function MealPhotoTipsPage() {
  return (
    <article className="min-h-screen pt-28 pb-24 px-5 sm:px-6">
      <div className="max-w-2xl mx-auto flex flex-col gap-8">
        <div className="flex flex-col gap-4">
          <Link
            href="/guides"
            className="text-[12px] font-medium opacity-60 hover:opacity-100 transition-opacity w-fit"
            style={{ color: "var(--text-secondary)" }}
          >
            ← Guides
          </Link>
          <p
            className="text-[12px] font-semibold uppercase tracking-widest"
            style={{ color: "#5bbcaa" }}
          >
            3 min read
          </p>
          <h1
            className="font-display text-3xl sm:text-4xl font-bold leading-tight tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            How to take a great meal photo for accurate tracking
          </h1>
        </div>

        <p className="text-[16px] leading-[1.8]" style={{ color: "var(--text-secondary)" }}>
          The quality of your meal photo directly affects how well the AI can identify food items
          and estimate portions. Here&apos;s what to pay attention to — none of it requires any
          photography skill.
        </p>

        <div className="flex flex-col gap-6">
          {tips.map((tip, i) => (
            <div key={i} className="flex gap-5">
              <div
                className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold mt-0.5"
                style={{ background: `${tip.accent}20`, color: tip.accent }}
              >
                {i + 1}
              </div>
              <div className="flex flex-col gap-1.5">
                <p className="font-semibold text-[15px]" style={{ color: "var(--text-primary)" }}>
                  {tip.title}
                </p>
                <p
                  className="text-[14px] leading-relaxed"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {tip.body}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div
          className="flex flex-col gap-4 text-[16px] leading-[1.8]"
          style={{ color: "var(--text-secondary)" }}
        >
          <h2
            className="font-display text-xl font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            When the AI gets it wrong
          </h2>
          <p>
            Even with a good photo, the AI will occasionally misidentify a dish or miss an item.
            That&apos;s why every scan is followed by a review screen where you can edit any item —
            its name, portion, or quantity — before saving to your journal. Correcting errors takes
            about 15 seconds.
          </p>
          <p>
            Over time, as you get familiar with which meals the AI handles well and which ones need
            adjustment, the review step gets faster.
          </p>
        </div>

        <div
          className="mt-4 rounded-2xl p-8 flex flex-col gap-4"
          style={{ background: "var(--surface-50)", border: "1px solid var(--border)" }}
        >
          <p
            className="font-display font-semibold text-[17px]"
            style={{ color: "var(--text-primary)" }}
          >
            Ready to try it?
          </p>
          <p className="text-[14px]" style={{ color: "var(--text-secondary)" }}>
            Download LogMyPlate and scan your next meal. Free on iOS and Android.
          </p>
          <DownloadBadges size="sm" />
        </div>
      </div>
    </article>
  );
}
