import type { Metadata } from "next";
import Link from "next/link";
import { DownloadBadges } from "@/components/download-badges";

export const metadata: Metadata = {
  title: "Indian Food Calorie Tracker — A Practical Guide",
  description:
    "How to track calories in Indian meals — dal, roti, sabzi, biryani. What works, what doesn't, and how photo-based AI tracking helps.",
  alternates: { canonical: "/guides/indian-food-calorie-tracker" },
};

export default function IndianFoodCalorieTrackerPage() {
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
            5 min read
          </p>
          <h1
            className="font-display text-3xl sm:text-4xl font-bold leading-tight tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Tracking calories in Indian food — a practical guide
          </h1>
        </div>

        <div
          className="flex flex-col gap-5 text-[16px] leading-[1.8]"
          style={{ color: "var(--text-secondary)" }}
        >
          <p>
            Indian cooking is diverse, regional, and almost always from scratch. That makes it
            genuinely difficult to track with conventional calorie apps — but not impossible if you
            know what to look for.
          </p>

          <h2
            className="font-display text-xl font-semibold mt-4"
            style={{ color: "var(--text-primary)" }}
          >
            Why Indian food is hard to track
          </h2>
          <p>
            Three reasons: variety, variability, and ghee. Every region in India has different
            dishes. Every household makes the same dish differently. And cooking fats — ghee
            especially — add calories invisibly. A teaspoon of ghee on dal is about 45 calories that
            you can&apos;t see in a photo.
          </p>
          <p>
            Add to this that most Indian meals are multi-dish and served together, and it&apos;s
            easy to see why searching a food database item by item is tedious and often inaccurate.
          </p>

          <h2
            className="font-display text-xl font-semibold mt-4"
            style={{ color: "var(--text-primary)" }}
          >
            What actually works
          </h2>
          <p>
            For most people, the goal of food tracking is awareness and rough quantification — not
            clinical precision. Given that, here&apos;s what works:
          </p>
          <ul className="list-disc list-inside flex flex-col gap-2 ml-2">
            <li>
              <strong style={{ color: "var(--text-primary)" }}>Photo first, adjust later.</strong>{" "}
              Take a photo, see what the AI identifies, then adjust any items you know are wrong.
              Over time you build an intuition for what the estimates look like for your regular
              meals.
            </li>
            <li>
              <strong style={{ color: "var(--text-primary)" }}>
                Track consistently, not precisely.
              </strong>{" "}
              A journal with approximate values logged every day is more useful than a perfectly
              precise log you maintain for three days.
            </li>
            <li>
              <strong style={{ color: "var(--text-primary)" }}>Watch for cooking fats.</strong> If
              you cook with a lot of ghee, oil, or butter, the AI estimate may be lower than reality
              since it can&apos;t measure what&apos;s absorbed during cooking. Add a note or
              increase the estimate manually.
            </li>
          </ul>

          <h2
            className="font-display text-xl font-semibold mt-4"
            style={{ color: "var(--text-primary)" }}
          >
            Common Indian meals and how the AI handles them
          </h2>
          <p>
            <strong style={{ color: "var(--text-primary)" }}>Dal + rice:</strong> Usually works
            well. The AI can distinguish between a full plate of rice and a half plate, and can
            identify common dals visually.
          </p>
          <p>
            <strong style={{ color: "var(--text-primary)" }}>Rotis / chapatis:</strong> Size and
            count matter. If two rotis are overlapping, the AI might see one. Try to spread them on
            the plate before photographing.
          </p>
          <p>
            <strong style={{ color: "var(--text-primary)" }}>
              Curries (paneer, rajma, chhole):
            </strong>{" "}
            Estimated by visual cues of sauce density and solid pieces. Reasonable for logging, but
            ghee-heavy preparations may be underestimated.
          </p>
          <p>
            <strong style={{ color: "var(--text-primary)" }}>Biryani and mixed rice:</strong> Can be
            tricky since it&apos;s a single complex dish. The AI typically estimates the full dish
            rather than individual components, which is usually the most practical approach.
          </p>

          <h2
            className="font-display text-xl font-semibold mt-4"
            style={{ color: "var(--text-primary)" }}
          >
            The bottom line
          </h2>
          <p>
            Photo-based calorie tracking is the most practical approach for Indian food right now.
            It&apos;s not perfect, but it&apos;s far faster than manual entry and more accurate than
            guessing. The key is building a consistent journaling habit where approximate data over
            time tells a useful story.
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
            Try LogMyPlate
          </p>
          <p className="text-[14px]" style={{ color: "var(--text-secondary)" }}>
            Photo-based calorie tracking designed for real food. Free on iOS and Android.
          </p>
          <DownloadBadges size="sm" />
        </div>
      </div>
    </article>
  );
}
