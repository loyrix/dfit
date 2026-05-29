import type { Metadata } from "next";
import { APP_CONFIG } from "@/config/app";

export const metadata: Metadata = {
  title: "Data Deletion",
  description:
    "How to permanently delete your LogMyPlate account, meal journal, health targets, stored meal photos, and app data.",
  alternates: { canonical: "/data-deletion" },
};

export default function DataDeletionPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "LogMyPlate Data Deletion",
    description: metadata.description,
    url: `${APP_CONFIG.websiteUrl}/data-deletion`,
  };

  return (
    <div className="min-h-screen px-5 pb-24 pt-28 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mx-auto flex max-w-2xl flex-col gap-10">
        <header className="flex flex-col gap-3">
          <p
            className="text-[12px] font-semibold uppercase tracking-[0.32em]"
            style={{ color: "var(--app-amber)" }}
          >
            Account controls
          </p>
          <h1
            className="font-display text-4xl font-bold tracking-tight sm:text-5xl"
            style={{ color: "var(--text-primary)" }}
          >
            Data Deletion
          </h1>
          <p className="text-[16px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            You can permanently delete your LogMyPlate account and associated app data directly
            inside the app. No separate web account, phone call, or support-only process is required
            when you can access the app.
          </p>
        </header>

        <section className="flex flex-col gap-4">
          <h2
            className="font-display text-xl font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            What deletion removes
          </h2>
          <ul
            className="ml-5 flex list-disc flex-col gap-2 text-[15px] leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
          >
            <li>Account profile and email login data, where an account exists</li>
            <li>Meal journal entries, food items, calorie estimates, macros, and timestamps</li>
            <li>Health targets, BMI estimate inputs, activity level, and goal settings</li>
            <li>Active sign-in records associated with your account</li>
            <li>Stored meal photos attached to saved meal logs</li>
          </ul>
        </section>

        <section className="flex flex-col gap-4">
          <h2
            className="font-display text-xl font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            How to delete your data
          </h2>
          <div
            className="rounded-[24px] border p-5"
            style={{
              borderColor: "var(--border)",
              background: "linear-gradient(135deg, rgba(239, 189, 68, 0.12), var(--app-card))",
            }}
          >
            <p
              className="text-[12px] font-semibold uppercase tracking-[0.26em]"
              style={{ color: "var(--app-amber)" }}
            >
              App installed?
            </p>
            <p
              className="mt-3 text-[15px] leading-relaxed"
              style={{ color: "var(--text-secondary)" }}
            >
              Open the deletion confirmation directly in LogMyPlate. If the app does not open, use
              the manual steps below.
            </p>
            <a
              href={APP_CONFIG.deleteAccountDeepLink}
              className="mt-5 inline-flex rounded-full px-5 py-3 text-[14px] font-semibold transition hover:scale-[1.01]"
              style={{
                background: "var(--app-amber)",
                color: "#2b210a",
                boxShadow: "0 18px 34px rgba(239, 189, 68, 0.22)",
              }}
            >
              Open delete account in app
            </a>
          </div>
          <div
            className="flex flex-col gap-3 text-[15px] leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
          >
            <p>
              Open LogMyPlate and go to{" "}
              <strong style={{ color: "var(--text-primary)" }}>
                Profile &gt; Privacy &amp; legal &gt; Delete account and data
              </strong>
              . Confirm the deletion sheet to permanently delete the account data listed above from
              active app systems.
            </p>
            <p>
              If you cannot access the app, email{" "}
              <a
                href={`mailto:${APP_CONFIG.supportEmail}?subject=LogMyPlate%20data%20deletion%20request`}
                className="underline underline-offset-4"
                style={{ color: "var(--app-amber)" }}
              >
                {APP_CONFIG.supportEmail}
              </a>{" "}
              with the email address used for your LogMyPlate account and include “Account deletion”
              in the subject. We may ask for enough information to verify ownership before deleting
              account data.
            </p>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h2
            className="font-display text-xl font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            What may be retained
          </h2>
          <p className="text-[15px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            LogMyPlate may retain limited technical logs, security records, fraud-prevention
            records, legal compliance records, and de-identified operational analytics for a limited
            period where required or permitted by law. These retained records are not used to
            restore your account or rebuild your meal journal.
          </p>
        </section>
      </div>
    </div>
  );
}
