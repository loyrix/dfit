import type { Metadata } from "next";
import Link from "next/link";
import { DownloadBadges } from "@/components/download-badges";

export const metadata: Metadata = {
  title: "Why a Photo Food Journal Is Easier to Stick With",
  description:
    "Manual food logging takes 10–15 minutes per meal. Photo-based logging takes 30 seconds. Here's why consistency matters more than precision.",
  alternates: { canonical: "/guides/photo-food-journal" },
};

export default function PhotoFoodJournalPage() {
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
            style={{ color: "#e8634a" }}
          >
            4 min read
          </p>
          <h1
            className="font-display text-3xl sm:text-4xl font-bold leading-tight tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Why a photo food journal is easier to stick with
          </h1>
        </div>

        <div
          className="flex flex-col gap-5 text-[16px] leading-[1.8]"
          style={{ color: "var(--text-secondary)" }}
        >
          <p>
            The most common reason people stop tracking food is not motivation — it&apos;s friction.
            Manual logging asks you to stop, search a database, find the right entry, estimate
            grams, and repeat for every item. After a few days of this, most people quietly quit.
          </p>

          <h2
            className="font-display text-xl font-semibold mt-4"
            style={{ color: "var(--text-primary)" }}
          >
            Friction is the enemy of habit
          </h2>
          <p>
            Behavioral research consistently shows that the harder a habit is to perform, the harder
            it is to maintain — regardless of how motivated you are. Meal logging is particularly
            vulnerable to this because it competes with eating, which is already a complete
            activity.
          </p>
          <p>
            A photo journal collapses the logging process into a single action: take a photo before
            you eat. That&apos;s it. The analysis happens in the background. You review and confirm
            in under a minute, usually while you&apos;re finishing your meal.
          </p>

          <h2
            className="font-display text-xl font-semibold mt-4"
            style={{ color: "var(--text-primary)" }}
          >
            Consistent approximate data beats sporadic precise data
          </h2>
          <p>
            Here&apos;s the thing about calorie tracking: a roughly-accurate journal that you
            maintain for 30 days tells you far more than a perfectly precise journal that you
            maintain for 5 days.
          </p>
          <p>
            Patterns only emerge from consistency. Which days do you tend to overeat? Which meals
            are higher in calories than you expected? What does a &quot;light day&quot; actually
            look like? These questions only answer themselves with a full picture.
          </p>
          <p>
            Photo-based tracking makes consistency achievable because the effort per meal is so low.
            30 seconds before you eat, 30–60 seconds to confirm after. That&apos;s a habit that can
            realistically survive weeks.
          </p>

          <h2
            className="font-display text-xl font-semibold mt-4"
            style={{ color: "var(--text-primary)" }}
          >
            The photo itself is valuable
          </h2>
          <p>
            There&apos;s a secondary benefit of photo journaling that often goes unnoticed: the
            photos themselves. Looking back at a week of meal photos gives you instant visual
            context that numbers alone don&apos;t. You see that you&apos;ve been eating smaller
            breakfasts, or that Tuesday lunches tend to be heavier. Visual memory is powerful.
          </p>

          <h2
            className="font-display text-xl font-semibold mt-4"
            style={{ color: "var(--text-primary)" }}
          >
            Getting started
          </h2>
          <p>
            The best way to start a photo food journal is to aim for one week of consistency before
            optimizing anything. Don&apos;t worry about precision. Just take the photo. Confirm what
            the AI suggests. Save it. Do that for seven days and see what you learn.
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
            Start your photo journal today
          </p>
          <p className="text-[14px]" style={{ color: "var(--text-secondary)" }}>
            LogMyPlate makes it easy — snap, confirm, save. Free on iOS and Android.
          </p>
          <DownloadBadges size="sm" />
        </div>
      </div>
    </article>
  );
}
