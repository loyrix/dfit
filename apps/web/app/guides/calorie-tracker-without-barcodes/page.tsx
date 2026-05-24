import type { Metadata } from "next";
import Link from "next/link";
import { DownloadBadges } from "@/components/download-badges";

export const metadata: Metadata = {
  title: "How to Track Calories Without Barcodes or Food Databases",
  description:
    "Most food doesn't have a barcode. Here's how photo-based AI calorie tracking works — and why it's more practical for home-cooked meals.",
  alternates: { canonical: "/guides/calorie-tracker-without-barcodes" },
};

export default function CalorieTrackerWithoutBarcodesPage() {
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
            How to track calories without barcodes or food databases
          </h1>
        </div>

        <div
          className="flex flex-col gap-5 text-[16px] leading-[1.8]"
          style={{ color: "var(--text-secondary)" }}
        >
          <p>
            A significant share of what people eat has no barcode: home-cooked meals, restaurant
            food, street food, and fresh produce. Barcode scanners are fast for packaged food —
            useless for everything else.
          </p>

          <h2
            className="font-display text-xl font-semibold mt-4"
            style={{ color: "var(--text-primary)" }}
          >
            The barcode problem
          </h2>
          <p>
            Barcode-based calorie trackers work by matching a product&apos;s barcode to a nutrition
            label in a database. This works reliably for a box of cereal or a bag of chips. But when
            you sit down to a home-cooked dinner, there&apos;s no barcode in sight.
          </p>
          <p>
            The database search fallback doesn&apos;t solve this either. Searching for &quot;chicken
            curry&quot; returns dozens of generic entries, none of which match your recipe, your
            portion, or your cooking style.
          </p>

          <h2
            className="font-display text-xl font-semibold mt-4"
            style={{ color: "var(--text-primary)" }}
          >
            Visual estimation: what AI does
          </h2>
          <p>
            Photo-based calorie tracking takes a different approach entirely. Instead of looking up
            a database entry, it sends the meal photo to an AI vision model. The model answers two
            questions: what foods are in this photo, and roughly how much of each is there?
          </p>
          <p>
            The answers come from visual patterns — the shape, color, texture, and proportions of
            what&apos;s on the plate. This is how an experienced nutritionist would estimate a meal
            they haven&apos;t personally prepared. It&apos;s approximate, but it&apos;s based on the
            actual food in front of you.
          </p>

          <h2
            className="font-display text-xl font-semibold mt-4"
            style={{ color: "var(--text-primary)" }}
          >
            What you can do that the AI can&apos;t
          </h2>
          <p>
            AI visual estimation has real limits. It can&apos;t see what&apos;s inside a curry,
            can&apos;t measure cooking oil that&apos;s been absorbed, and can&apos;t distinguish
            between full-fat and low-fat yogurt. You can.
          </p>
          <p>
            LogMyPlate lets you review and edit every item before saving. If you know you used more
            ghee than usual, adjust the estimate. If the AI identified a dish incorrectly, correct
            it. The combination of AI speed and your context gives you something more useful than
            either alone.
          </p>

          <h2
            className="font-display text-xl font-semibold mt-4"
            style={{ color: "var(--text-primary)" }}
          >
            Making it work in practice
          </h2>
          <ul className="list-disc list-inside flex flex-col gap-2 ml-2">
            <li>Take the photo before mixing or covering food</li>
            <li>Use a top-down angle for multi-dish meals</li>
            <li>Keep a mental note of added fats to adjust manually</li>
            <li>
              Build a habit of correcting the same recurring dishes — the patterns become familiar
            </li>
          </ul>
          <p>
            No method of calorie tracking is perfectly accurate without a food scale and laboratory
            analysis. The goal is useful, consistent data — and photo-based tracking makes that
            realistic for the way most people actually eat.
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
            Track without barcodes
          </p>
          <p className="text-[14px]" style={{ color: "var(--text-secondary)" }}>
            LogMyPlate works for any meal — no barcodes, no database searching. Free on iOS and
            Android.
          </p>
          <DownloadBadges size="sm" />
        </div>
      </div>
    </article>
  );
}
