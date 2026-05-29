import type { Metadata } from "next";
import Link from "next/link";
import { APP_CONFIG } from "@/config/app";

export const metadata: Metadata = {
  title: "Support",
  description: "Get help with LogMyPlate: AI Calorie Tracker — FAQ, tips, and contact information.",
  alternates: { canonical: "/support" },
};

const faqs = [
  {
    q: "How accurate are the calorie estimates?",
    a: "LogMyPlate: AI Calorie Tracker uses AI to estimate calories and macros from a photo. Accuracy depends on photo quality, how clearly each item is visible, and portion estimation from visual size. Expect estimates within a reasonable range — treat them as a useful reference, not a clinical measurement.",
  },
  {
    q: "Can I correct the AI's food item list?",
    a: "Yes. After the AI returns its analysis, you can edit any item's name, portion, or quantity before saving to your journal. Changes are saved with your meal.",
  },
  {
    q: "How many free scans do I get?",
    a: "LogMyPlate includes 3 one-time free scans so you can try the flow before creating an account. Signed-in users may be able to unlock additional scans with rewarded ads when available.",
  },
  {
    q: "Does it work for Indian food?",
    a: "Yes — the AI model handles Indian meals including curries, rice dishes, dals, sabzis, breads, and street food. It also works for global cuisines. The model estimates portions visually rather than relying on a food database.",
  },
  {
    q: "Is my data private?",
    a: "Your meal photos are used only to generate your analysis and optionally stored privately in your journal. We do not sell your data. See our Privacy Policy for full details.",
  },
  {
    q: "How do I delete my account?",
    a: "Open the app and go to Profile > Privacy & legal > Delete account and data. This permanently deletes your account, journal, saved photos, targets, and sign-in access from active systems. The action is irreversible.",
  },
  {
    q: "Do I need an account to use the app?",
    a: "No. You can use LogMyPlate without an account. Creating an account with an email address lets you preserve your journal if you reinstall the app.",
  },
  {
    q: "What permissions does the app need?",
    a: "Camera access (to take meal photos) and photo library access (to choose existing photos). Both are used only for meal analysis.",
  },
];

export default function SupportPage() {
  return (
    <div className="min-h-screen pt-28 pb-24 px-5 sm:px-6">
      <div className="max-w-2xl mx-auto flex flex-col gap-12">
        {/* Header */}
        <div className="flex flex-col gap-3">
          <p
            className="text-[12px] font-semibold uppercase tracking-widest"
            style={{ color: "#5bbcaa" }}
          >
            Help
          </p>
          <h1
            className="font-display text-4xl sm:text-5xl font-bold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Support
          </h1>
          <p className="text-[16px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            Common questions about LogMyPlate. Can&apos;t find what you need?{" "}
            <a
              href={`mailto:${APP_CONFIG.supportEmail}?subject=LogMyPlate%20support%20request`}
              className="underline underline-offset-4 font-medium"
              style={{ color: "#f5a623" }}
            >
              Create a support request
            </a>
            .
          </p>
        </div>

        {/* FAQ */}
        <div className="flex flex-col gap-0 divide-y" style={{ borderColor: "var(--border)" }}>
          {faqs.map((faq, i) => (
            <div key={i} className="py-6 flex flex-col gap-2">
              <p className="font-semibold text-[15px]" style={{ color: "var(--text-primary)" }}>
                {faq.q}
              </p>
              <p className="text-[14px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {faq.a}
              </p>
            </div>
          ))}
        </div>

        {/* Contact */}
        <div
          className="rounded-2xl p-8 flex flex-col gap-4"
          style={{
            background: "var(--surface-50)",
            border: "1px solid var(--border)",
          }}
        >
          <h2
            className="font-display text-xl font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Still need help?
          </h2>
          <p className="text-[14px]" style={{ color: "var(--text-secondary)" }}>
            Create a support request and we&apos;ll respond as soon as possible.
          </p>
          <a
            id="support-email-link"
            href={`mailto:${APP_CONFIG.supportEmail}?subject=LogMyPlate%20support%20request`}
            className="inline-flex items-center gap-2 text-[14px] font-semibold underline underline-offset-4"
            style={{ color: "#f5a623" }}
          >
            Create support request
          </a>

          <div
            className="pt-2 flex flex-col gap-2 text-[13px]"
            style={{ color: "var(--text-muted)" }}
          >
            <p>More resources:</p>
            <Link
              href="/guides"
              className="underline underline-offset-4 hover:opacity-100 opacity-70"
            >
              Browse meal tracking guides →
            </Link>
            <Link
              href="/privacy"
              className="underline underline-offset-4 hover:opacity-100 opacity-70"
            >
              Privacy Policy →
            </Link>
            <Link
              href="/terms"
              className="underline underline-offset-4 hover:opacity-100 opacity-70"
            >
              Terms of Service →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
