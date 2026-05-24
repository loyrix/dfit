import type { Metadata } from "next";
import Link from "next/link";
import { APP_CONFIG } from "@/config/app";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "LogMyPlate Terms of Service covering app use, AI calorie estimates, health disclaimers, accounts, user content, rewarded ads, and limitations.",
  alternates: { canonical: "/terms" },
};

const lastUpdated = "May 24, 2026";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-display text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
        {title}
      </h2>
      <div
        className="flex flex-col gap-3 text-[15px] leading-relaxed"
        style={{ color: "var(--text-secondary)" }}
      >
        {children}
      </div>
    </section>
  );
}

export default function TermsPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TermsOfService",
    name: `${APP_CONFIG.appName} Terms of Service`,
    url: `${APP_CONFIG.websiteUrl}/terms`,
    dateModified: "2026-05-24",
    publisher: {
      "@type": "Organization",
      name: APP_CONFIG.brandName,
      url: APP_CONFIG.websiteUrl,
    },
  };

  return (
    <div className="min-h-screen px-5 pb-24 pt-28 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mx-auto flex max-w-2xl flex-col gap-12">
        <header className="flex flex-col gap-3">
          <p
            className="text-[12px] font-semibold uppercase tracking-[0.32em]"
            style={{ color: "var(--app-amber)" }}
          >
            Legal
          </p>
          <h1
            className="font-display text-4xl font-bold tracking-tight sm:text-5xl"
            style={{ color: "var(--text-primary)" }}
          >
            Terms of Service
          </h1>
          <p className="text-[14px]" style={{ color: "var(--text-muted)" }}>
            Last updated: {lastUpdated} · By using {APP_CONFIG.appName}, you agree to these terms.
          </p>
          <div
            className="mt-2 rounded-2xl p-4 text-[13px] leading-relaxed"
            style={{
              background: "rgba(239, 189, 68, 0.1)",
              border: "1px solid rgba(239, 189, 68, 0.24)",
              color: "var(--text-secondary)",
            }}
          >
            These terms explain the rules for using LogMyPlate, including AI estimates, account
            access, app stores, rewarded ads, and responsible use.
          </div>
        </header>

        <Section title="1. Acceptance">
          <p>
            By downloading, installing, accessing, or using {APP_CONFIG.appName} ("LogMyPlate", the
            "App", "we", "our", or "us"), you agree to these Terms of Service and our{" "}
            <Link
              href="/privacy"
              className="underline underline-offset-4"
              style={{ color: "var(--app-amber)" }}
            >
              Privacy Policy
            </Link>
            . If you do not agree, do not use the App.
          </p>
        </Section>

        <Section title="2. What LogMyPlate does">
          <p>
            LogMyPlate helps users track meals by submitting a meal photo and optional note for AI
            analysis. The app returns editable estimates for food items, portions, calories,
            protein, carbohydrates, and fat. Users can review and correct estimates before saving a
            meal to the journal.
          </p>
          <p>
            The app may also provide daily calorie targets, BMI estimate screens, weekly summaries,
            account login, local or cloud-backed journal storage, and rewarded ads for extra scan
            access.
          </p>
        </Section>

        <Section title="3. Eligibility and accounts">
          <p>
            You must be at least 13 years old to use LogMyPlate. If local law requires a higher
            minimum age, you must meet that requirement. You are responsible for keeping account
            credentials secure and for activity under your account or app installation.
          </p>
          <p>
            We may suspend, restrict, or terminate access if we reasonably believe you violated
            these terms, abused the service, compromised security, or used the app unlawfully.
          </p>
        </Section>

        <Section title="4. AI estimates and health disclaimer">
          <p>
            LogMyPlate provides AI-generated estimates only. Calorie, macro, BMI, and target values
            are not medical measurements, diagnoses, treatment plans, or professional nutrition
            advice.
          </p>
          <p>
            Food recognition and portion estimation can be wrong. Hidden ingredients such as oil,
            ghee, butter, sugar, sauces, cheese, nuts, or fried toppings may not be visible in a
            photo. You are responsible for reviewing and correcting estimates before relying on
            them.
          </p>
          <p>
            If you have diabetes, kidney disease, heart disease, pregnancy-related needs, an eating
            disorder, allergies, a clinical diet plan, or any medical condition requiring nutrition
            precision, consult a qualified healthcare professional before using app estimates.
          </p>
        </Section>

        <Section title="5. User content and license">
          <p>
            You keep ownership of your meal photos, notes, edits, and journal data. By using the
            app, you grant us a limited license to process that content solely to provide, secure,
            maintain, and improve the service for you.
          </p>
          <p>
            Do not upload content that is illegal, harmful, invasive of another person's privacy, or
            unrelated to food tracking in a way that abuses the AI system.
          </p>
        </Section>

        <Section title="6. Acceptable use">
          <p>You agree not to:</p>
          <ul className="ml-5 flex list-disc flex-col gap-2">
            <li>Use the app or service for unlawful, abusive, or fraudulent activity</li>
            <li>Bypass scan quotas, rewarded-ad verification, rate limits, or security controls</li>
            <li>Reverse engineer, scrape, overload, or interfere with the app or service</li>
            <li>Submit malicious files, prompts, or images intended to manipulate the AI system</li>
            <li>Misrepresent AI estimates as clinical, medical, or certified nutrition data</li>
            <li>Use the app to build a competing service without permission</li>
          </ul>
        </Section>

        <Section title="7. Rewarded ads and free scan access">
          <p>
            LogMyPlate may offer free scan limits and optional rewarded ads through Google AdMob.
            Watching a rewarded ad may unlock additional scans only after ad completion is verified.
          </p>
          <p>
            We do not control the content of ads shown by Google AdMob. Ad availability, reward
            eligibility, and scan limits may change over time.
          </p>
        </Section>

        <Section title="8. App stores and platform terms">
          <p>
            Your use of the iOS app is also subject to Apple App Store terms, and your use of the
            Android app is also subject to Google Play terms. Apple and Google are not responsible
            for LogMyPlate's AI estimates, app content, support, or legal claims.
          </p>
          <p>
            Store listings, TestFlight builds, Play testing tracks, screenshots, pricing, and
            availability may change as the app moves toward production release.
          </p>
        </Section>

        <Section title="9. Intellectual property">
          <p>
            The LogMyPlate name, logo, design, website, app interface, copy, screenshots, code, and
            related materials are owned by us or our licensors. You may not copy, modify,
            distribute, or use our brand assets without written permission.
          </p>
        </Section>

        <Section title="10. Availability and changes">
          <p>
            We may modify, suspend, limit, or discontinue any part of the app or website at any
            time. We may update AI models, quotas, features, ads, data storage, legal pages, and
            supported platforms as the product evolves.
          </p>
        </Section>

        <Section title="11. Disclaimers">
          <p>
            To the fullest extent permitted by law, LogMyPlate is provided "as is" and "as
            available" without warranties of any kind. We do not guarantee uninterrupted service,
            exact nutrition estimates, health outcomes, app store availability, or that every food
            item will be recognized correctly.
          </p>
        </Section>

        <Section title="12. Limitation of liability">
          <p>
            To the fullest extent permitted by law, we will not be liable for indirect, incidental,
            special, consequential, exemplary, or punitive damages, or for loss of data, health
            outcomes, lost profits, or reliance on AI estimates.
          </p>
        </Section>

        <Section title="13. Indemnity">
          <p>
            You agree to defend, indemnify, and hold us harmless from claims arising from your
            misuse of the app, violation of these terms, unlawful content, or misrepresentation of
            AI estimates.
          </p>
        </Section>

        <Section title="14. Termination and deletion">
          <p>
            You may stop using the app at any time. You may request account and data deletion as
            described on the{" "}
            <Link
              href="/data-deletion"
              className="underline underline-offset-4"
              style={{ color: "var(--app-amber)" }}
            >
              Data Deletion
            </Link>{" "}
            page. Some limited records may be retained where required for legal, security, or abuse
            prevention reasons.
          </p>
        </Section>

        <Section title="15. Governing law">
          <p>
            These terms are governed by the laws of India, without regard to conflict-of-law rules.
            Courts in India will have exclusive jurisdiction unless applicable consumer law requires
            another venue.
          </p>
        </Section>

        <Section title="16. Contact">
          <p>
            Questions about these terms can be sent to{" "}
            <a
              href={`mailto:${APP_CONFIG.supportEmail}`}
              className="underline underline-offset-4"
              style={{ color: "var(--app-amber)" }}
            >
              {APP_CONFIG.supportEmail}
            </a>
            .
          </p>
        </Section>
      </div>
    </div>
  );
}
