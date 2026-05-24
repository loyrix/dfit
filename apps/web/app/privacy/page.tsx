import type { Metadata } from "next";
import { APP_CONFIG } from "@/config/app";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "LogMyPlate Privacy Policy — how we collect, use, and protect your data.",
  alternates: { canonical: "/privacy" },
};

const lastUpdated = "May 2025";

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

export default function PrivacyPage() {
  return (
    <div className="min-h-screen pt-28 pb-24 px-5 sm:px-6">
      <div className="max-w-2xl mx-auto flex flex-col gap-12">
        {/* Header */}
        <div className="flex flex-col gap-3">
          <p
            className="text-[12px] font-semibold uppercase tracking-widest"
            style={{ color: "#f5a623" }}
          >
            Legal
          </p>
          <h1
            className="font-display text-4xl sm:text-5xl font-bold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Privacy Policy
          </h1>
          <p className="text-[14px]" style={{ color: "var(--text-muted)" }}>
            Last updated: {lastUpdated} · Effective immediately upon use of the app.
          </p>
          <div
            className="mt-2 rounded-xl p-4 text-[13px] leading-relaxed"
            style={{
              background: "rgba(245,166,35,0.08)",
              border: "1px solid rgba(245,166,35,0.2)",
              color: "var(--text-secondary)",
            }}
          >
            <strong style={{ color: "var(--text-primary)" }}>Note:</strong> This privacy policy is a
            draft prepared by the LogMyPlate engineering team based on the app&apos;s actual
            behavior. It should be reviewed by a qualified lawyer before submission to the App Store
            or Google Play Store.
          </div>
        </div>

        {/* 1. Overview */}
        <Section title="1. Who we are">
          <p>
            LogMyPlate ("we", "our", "us") is a mobile application available on iOS and Android that
            helps users track meals by analyzing food photos with AI. Our backend API is hosted at{" "}
            <code
              className="text-[13px] px-1 py-0.5 rounded"
              style={{ background: "var(--surface-100)", color: "var(--text-primary)" }}
            >
              {APP_CONFIG.apiDomain}
            </code>
            .
          </p>
          <p>
            This Privacy Policy describes what data we collect when you use the app, how we use it,
            and your rights with respect to it.
          </p>
        </Section>

        {/* 2. Data we collect */}
        <Section title="2. Information we collect">
          <p className="font-medium" style={{ color: "var(--text-primary)" }}>
            2.1 Install identity (all users)
          </p>
          <p>
            When you first open the app, we generate a random anonymous install identifier (a string
            starting with{" "}
            <code className="text-[13px] px-1 rounded" style={{ background: "var(--surface-100)" }}>
              inst_
            </code>
            ) and store it locally on your device. This identifier is sent with every API request in
            the{" "}
            <code className="text-[13px] px-1 rounded" style={{ background: "var(--surface-100)" }}>
              x-logmyplate-install-id
            </code>{" "}
            header. It allows us to associate requests from the same installation without requiring
            a user account. It is not tied to any personal information.
          </p>

          <p className="font-medium" style={{ color: "var(--text-primary)" }}>
            2.2 Device metadata (all users)
          </p>
          <p>
            Every API request also carries: your device platform (ios or android), your device
            locale and region (for example, en-IN/IN), and your device timezone. These are used for
            server-side logging and to provide time-zone-aware journal features.
          </p>

          <p className="font-medium" style={{ color: "var(--text-primary)" }}>
            2.3 Account information (registered users only)
          </p>
          <p>
            If you choose to create an account, we collect your email address and a hashed password
            (we never store your plaintext password). We create a session token that is stored
            locally on your device and sent as a Bearer token on authenticated requests.
          </p>

          <p className="font-medium" style={{ color: "var(--text-primary)" }}>
            2.4 Meal photos
          </p>
          <p>
            When you scan a meal, the photo is sent base64-encoded to our server for AI analysis. We
            may store the image in a private cloud storage bucket to attach it to your meal journal
            entry. Images are stored privately and are not publicly accessible. If image storage is
            disabled, photos are discarded after analysis.
          </p>

          <p className="font-medium" style={{ color: "var(--text-primary)" }}>
            2.5 AI analysis results and meal journal
          </p>
          <p>
            After analysis, we store: the meal name you confirm, food items with display names,
            portion quantities (quantity, unit, estimated grams), and per-item nutrition values
            (calories, protein, carbohydrates, fat). Meal type (breakfast, lunch, dinner, snack) and
            timestamp are also stored.
          </p>

          <p className="font-medium" style={{ color: "var(--text-primary)" }}>
            2.6 Health targets
          </p>
          <p>
            If you choose to set health targets, we store: height, weight, age, biological sex,
            activity level, health goal, BMI category, and daily calorie and macro targets. This
            data is used only to display personalized daily targets in the app.
          </p>

          <p className="font-medium" style={{ color: "var(--text-primary)" }}>
            2.7 Technical logs
          </p>
          <p>
            Our server logs standard HTTP request metadata including IP address, request path,
            response times, and error details. These logs are used for debugging and service
            reliability. They are not linked to user profiles and are retained for a limited period.
          </p>
        </Section>

        {/* 3. How we use data */}
        <Section title="3. How we use your information">
          <p>We use collected data solely to:</p>
          <ul className="list-disc list-inside flex flex-col gap-2 ml-2">
            <li>Operate and provide the LogMyPlate service</li>
            <li>Perform AI food analysis using your meal photos</li>
            <li>Store and display your meal journal</li>
            <li>Calculate and display calorie and macro totals against your targets</li>
            <li>Prevent abuse (scan quota management)</li>
            <li>Debug issues and maintain service reliability</li>
          </ul>
          <p>We do not sell your data. We do not use your data for advertising.</p>
        </Section>

        {/* 4. AI providers */}
        <Section title="4. AI analysis providers">
          <p>
            Meal photo analysis is performed using one or more AI providers. Depending on server
            configuration, this may include:
          </p>
          <ul className="list-disc list-inside flex flex-col gap-2 ml-2">
            <li>
              <strong>Google Gemini</strong> (model: gemini-2.5-flash) via the Generative Language
              API
            </li>
            <li>
              <strong>Google Vertex AI</strong> (model: gemini-2.5-flash) via Google Cloud
            </li>
            <li>
              <strong>OpenAI</strong> (model configured at server level)
            </li>
          </ul>
          <p>
            Meal photo data is transmitted to the active AI provider to generate the food item list
            and nutritional estimates. Each provider has their own data handling policies. We
            recommend reviewing Google&apos;s and OpenAI&apos;s respective privacy policies.
          </p>
        </Section>

        {/* 5. Advertising */}
        <Section title="5. Advertising (Google AdMob)">
          <p>
            LogMyPlate shows rewarded ads powered by Google AdMob (publisher ID:{" "}
            <code className="text-[13px] px-1 rounded" style={{ background: "var(--surface-100)" }}>
              pub-6936425975956435
            </code>
            ). Watching a rewarded ad unlocks additional meal scans beyond the daily free quota.
          </p>
          <p>
            Google Mobile Ads SDK may collect device identifiers (such as the Advertising ID) and
            other data to serve contextually appropriate ads. You can opt out of personalized ads
            through your device&apos;s privacy settings. For more information, see{" "}
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4"
              style={{ color: "#f5a623" }}
            >
              Google&apos;s Privacy Policy
            </a>
            .
          </p>
          <p>
            Our AdMob relationship is published at{" "}
            <a
              href={`${APP_CONFIG.websiteUrl}/app-ads.txt`}
              className="underline underline-offset-4"
              style={{ color: "#f5a623" }}
            >
              logmyplate.com/app-ads.txt
            </a>
            .
          </p>
        </Section>

        {/* 6. Data retention */}
        <Section title="6. Data retention">
          <p>
            Your journal data and health targets are retained as long as your account is active.
            Technical server logs are retained for a limited operational period (typically up to 90
            days).
          </p>
          <p>
            Meal photos stored in cloud storage are retained until you delete the associated meal or
            delete your account.
          </p>
        </Section>

        {/* 7. Deletion */}
        <Section title="7. Data deletion and account removal">
          <p>
            You can deactivate your account from the app&apos;s settings screen. A deactivated
            account is suspended; data is retained but the account cannot be used.
          </p>
          <p>
            You can permanently delete your account and all associated data from within the app.
            Deletion removes your profile, journal entries, health targets, session tokens, and any
            stored meal photos. This action is irreversible.
          </p>
        </Section>

        {/* 8. Security */}
        <Section title="8. Security">
          <p>
            We use HTTPS for all data in transit. Passwords are hashed before storage. Stored meal
            images are not publicly accessible. We take reasonable technical measures to protect
            your data, but no system is perfectly secure.
          </p>
        </Section>

        {/* 9. Children */}
        <Section title="9. Children">
          <p>
            LogMyPlate is not directed to children under 13 (or under 16 in the EU). We do not
            knowingly collect personal information from children. If you believe a child has
            provided us with personal information, please contact us and we will delete it.
          </p>
        </Section>

        {/* 10. International */}
        <Section title="10. International data processing">
          <p>
            LogMyPlate is operated from India. If you use the app from outside India, your data may
            be transferred to and processed in countries where our servers, cloud providers, and AI
            partners operate, including the United States. By using the app, you acknowledge this.
          </p>
        </Section>

        {/* 11. Third parties */}
        <Section title="11. Third-party services">
          <p>
            Beyond AI providers and AdMob, your data may pass through our hosting provider (Vercel)
            and cloud storage provider. These providers act as data processors under our
            instruction. The app is distributed through Apple App Store and Google Play Store, each
            with their own data collection.
          </p>
        </Section>

        {/* 12. Changes */}
        <Section title="12. Changes to this policy">
          <p>
            We may update this policy as the app evolves. Material changes will be communicated
            through the app or this page. Continued use after changes constitutes acceptance.
          </p>
        </Section>

        {/* 13. Contact */}
        <Section title="13. Contact">
          <p>
            Questions about this policy? Email us at{" "}
            <a
              href={`mailto:${APP_CONFIG.supportEmail}`}
              className="underline underline-offset-4"
              style={{ color: "#f5a623" }}
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
