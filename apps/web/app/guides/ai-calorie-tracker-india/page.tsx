import type { Metadata } from "next";
import Link from "next/link";
import { DownloadBadges } from "@/components/download-badges";

export const metadata: Metadata = {
  title: "AI Calorie Tracker for India — How Photo-Based Tracking Works",
  description:
    "Why AI photo-based calorie trackers work better for Indian meals than barcode scanners or manual databases. How LogMyPlate estimates calories from a photo.",
  alternates: { canonical: "/guides/ai-calorie-tracker-india" },
  openGraph: {
    title: "AI Calorie Tracker for India — How Photo-Based Tracking Works",
    description:
      "Why AI photo-based calorie trackers work better for Indian meals than barcode scanners or manual databases.",
  },
};

export default function AiCalorieTrackerIndiaPage() {
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
            style={{ color: "#f5a623" }}
          >
            4 min read
          </p>
          <h1
            className="font-display text-3xl sm:text-4xl font-bold leading-tight tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            How AI calorie trackers work — and why they&apos;re different in India
          </h1>
        </div>

        <div
          className="flex flex-col gap-5 text-[16px] leading-[1.8]"
          style={{ color: "var(--text-secondary)" }}
        >
          <p>
            Most calorie tracking apps were built in the US or Europe, optimized for packaged food
            with barcodes. Scan the barcode, get the nutrition data. It works for a protein bar. It
            doesn&apos;t work for a plate of rajma chawal.
          </p>

          <h2
            className="font-display text-xl font-semibold mt-4"
            style={{ color: "var(--text-primary)" }}
          >
            The problem with database-based trackers
          </h2>
          <p>
            Existing food databases like USDA or MyFitnessPal have reasonable coverage of packaged
            and restaurant food from Western markets. Indian home-cooked food is severely
            underrepresented. When you search for &quot;dal tadka,&quot; you might find a generic
            entry — but dal tadka in your kitchen uses your specific ratio of toor dal, ghee, and
            tempering. The difference can be hundreds of calories.
          </p>
          <p>
            Manual entry is the alternative — but it requires knowing the exact weight of every
            ingredient, which is impractical for home cooking.
          </p>

          <h2
            className="font-display text-xl font-semibold mt-4"
            style={{ color: "var(--text-primary)" }}
          >
            What a photo-based AI tracker does differently
          </h2>
          <p>
            Instead of looking up a database entry, a photo-based tracker sends the image to an AI
            vision model. The model identifies each food item visually, estimates the serving size
            from the proportions visible in the frame, and returns a calorie and macro estimate.
          </p>
          <p>
            For Indian meals, this means: the model sees a half-plate of rice, a bowl of dal, a
            piece of roti, and a small bowl of sabzi — and returns estimates for each. You can
            adjust any item or portion before saving.
          </p>
          <p>
            The estimates won&apos;t be perfect. Portion estimation from a photo is inherently
            approximate. But &quot;approximately right&quot; is genuinely useful for understanding
            your eating patterns over weeks — which is what most people actually need from a food
            journal.
          </p>

          <h2
            className="font-display text-xl font-semibold mt-4"
            style={{ color: "var(--text-primary)" }}
          >
            What the AI can&apos;t do
          </h2>
          <p>
            The model estimates from what&apos;s visible. It can&apos;t know how much ghee was used
            in cooking or whether the curd is full-fat or skimmed. For health conditions requiring
            clinical precision — diabetes management, for example — consult a registered dietitian.
          </p>
          <p>
            AI calorie estimates are a reference tool, not a medical measurement. They&apos;re most
            useful for building awareness and maintaining a consistent journal over time.
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
            Photo-based meal tracking for Indian and global meals. Free to download.
          </p>
          <DownloadBadges size="sm" />
        </div>
      </div>
    </article>
  );
}
