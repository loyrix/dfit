import type { Metadata } from "next";
import Link from "next/link";
import { APP_CONFIG } from "@/config/app";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "LogMyPlate Privacy Policy covering meal photos, AI analysis, account data, health targets, subscriptions, RevenueCat, push tokens, AdMob rewarded ads, app store data disclosures, and deletion rights.",
  alternates: { canonical: "/privacy" },
};

const lastUpdated = "June 7, 2026";

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
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "PrivacyPolicy",
    name: `${APP_CONFIG.appName} Privacy Policy`,
    url: `${APP_CONFIG.websiteUrl}/privacy`,
    dateModified: "2026-06-07",
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
            Privacy Policy
          </h1>
          <p className="text-[14px]" style={{ color: "var(--text-muted)" }}>
            Last updated: {lastUpdated} · Effective when you use the app or website.
          </p>
          <div
            className="mt-2 rounded-2xl p-4 text-[13px] leading-relaxed"
            style={{
              background: "rgba(239, 189, 68, 0.1)",
              border: "1px solid rgba(239, 189, 68, 0.24)",
              color: "var(--text-secondary)",
            }}
          >
            This policy explains what LogMyPlate collects, why it is used, when it may be shared,
            and how you can delete your account and app data. It also covers Premium subscription
            entitlement data and optional push notification tokens.
          </div>
        </header>

        <Section title="1. Who we are">
          <p>
            {APP_CONFIG.appName} ("LogMyPlate", "we", "our", or "us") is a mobile app for iOS and
            Android that helps users track meals from food photos. The public website is{" "}
            <a
              href={APP_CONFIG.websiteUrl}
              className="underline underline-offset-4"
              style={{ color: "var(--app-amber)" }}
            >
              {APP_CONFIG.websiteUrl}
            </a>
            .
          </p>
          <p>
            You can contact us at{" "}
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

        <Section title="2. Information we collect">
          <p>
            <strong style={{ color: "var(--text-primary)" }}>App installation identity:</strong> the
            app may create a random identifier for your app installation so we can keep scan limits,
            rewarded scan credits, and basic app state working without requiring every user to
            create an account.
          </p>
          <p>
            <strong style={{ color: "var(--text-primary)" }}>Device and technical data:</strong> the
            app and website may collect basic technical information such as device platform, app
            version, language or region settings, approximate request location from IP address,
            diagnostics, and error information for reliability, security, abuse prevention, and
            support.
          </p>
          <p>
            <strong style={{ color: "var(--text-primary)" }}>Account data:</strong> if you create an
            account, we collect your email address and authentication information needed to create,
            secure, and manage your account. We do not store your plaintext password.
          </p>
          <p>
            <strong style={{ color: "var(--text-primary)" }}>Meal photos and notes:</strong> when
            you scan a meal, the app sends the photo and optional food note for AI analysis. Meal
            photos may be stored privately with your meal log when they are attached to saved
            journal entries.
          </p>
          <p>
            <strong style={{ color: "var(--text-primary)" }}>
              Meal journal and nutrition data:
            </strong>{" "}
            we store scan results and saved meal logs, including meal names, food items, portions,
            estimated grams, calories, protein, carbohydrates, fat, meal type, timestamps, and your
            edits.
          </p>
          <p>
            <strong style={{ color: "var(--text-primary)" }}>Health target inputs:</strong> if you
            set daily targets, we may store height, weight, age, body profile, activity level, goal,
            BMI estimate, calorie target, and macro targets.
          </p>
          <p>
            <strong style={{ color: "var(--text-primary)" }}>
              Subscription and purchase entitlement data:
            </strong>{" "}
            if you buy or restore Premium, we may store your subscription status, product ID,
            entitlement ID, store or provider, purchase date, expiration date, renewal or
            cancellation status, billing issue status, and RevenueCat event identifiers needed to
            unlock Premium and prevent duplicate processing. LogMyPlate does not receive or store
            full payment card details.
          </p>
          <p>
            <strong style={{ color: "var(--text-primary)" }}>Push notification data:</strong> if
            push notifications are enabled and you grant permission, the app may register a platform
            push token, provider type, platform, permission status, app version, build number, and
            sandbox or production routing flag. iOS uses Apple Push Notification service tokens for
            direct APNs delivery; Android uses Firebase Cloud Messaging tokens.
          </p>
          <p>
            <strong style={{ color: "var(--text-primary)" }}>Support communications:</strong> if you
            email us, we collect the email address and message contents needed to answer your
            request.
          </p>
        </Section>

        <Section title="3. How we use information">
          <p>We use information to:</p>
          <ul className="ml-5 flex list-disc flex-col gap-2">
            <li>Provide AI meal photo analysis and editable nutrition estimates</li>
            <li>Save and display your meal journal, daily totals, weekly summaries, and targets</li>
            <li>Authenticate accounts and sync account-backed app data</li>
            <li>Manage free scan quotas and rewarded-ad scan credits</li>
            <li>Verify Premium entitlements, enforce subscription scan limits, and show usage</li>
            <li>Send optional push reminders and operational notifications when permitted</li>
            <li>Detect abuse, protect the service, debug errors, and improve reliability</li>
            <li>Respond to support, privacy, and data deletion requests</li>
          </ul>
          <p>
            We do not sell your meal photos, meal journal, or health target data. We do not use your
            meal journal to target ads.
          </p>
        </Section>

        <Section title="4. AI analysis providers">
          <p>
            Meal analysis is performed using third-party AI service providers that help identify
            visible food items and estimate nutrition values.
          </p>
          <p>
            Your meal photo, note, and limited technical context may be shared with those providers
            only as needed to generate food item and nutrition estimates. These providers process
            data under their own privacy and security commitments.
          </p>
        </Section>

        <Section title="5. Advertising and AdMob">
          <p>
            LogMyPlate uses Google AdMob rewarded ads to let users unlock additional scans beyond
            free scan limits. Our authorized seller information for ads is published in our{" "}
            <a
              href="/app-ads.txt"
              className="underline underline-offset-4"
              style={{ color: "var(--app-amber)" }}
            >
              app-ads.txt
            </a>{" "}
            file.
          </p>
          <p>
            Google Mobile Ads SDK and Google AdMob may collect device identifiers, advertising
            identifiers, approximate location signals, interaction data, diagnostic data, and other
            information for ad delivery, measurement, fraud prevention, and personalization where
            allowed by user settings and law.
          </p>
          <p>
            You can manage ad personalization through your device settings and Google ad settings.
            AdMob data practices should also be disclosed in App Store privacy details and Google
            Play Data safety forms.
          </p>
        </Section>

        <Section title="6. Subscriptions, RevenueCat, and app stores">
          <p>
            Premium subscriptions are sold through Apple App Store and Google Play. Those stores
            process payment, taxes, billing, cancellation, refunds, and store account management
            under their own terms and privacy policies.
          </p>
          <p>
            We use RevenueCat to manage subscription products, customer entitlements, purchase
            lifecycle events, restore purchases, and subscription status sync. RevenueCat may
            receive an app user or profile identifier, product identifiers, store transaction
            metadata, entitlement status, purchase and expiration dates, billing issue signals, and
            related diagnostics needed to operate subscriptions.
          </p>
          <p>
            LogMyPlate uses this data to decide whether Premium is active and to apply the Premium
            scan allowance. The current Premium allowance is up to 300 AI meal scans per month and
            up to 10 scans per day, unless a later in-app offer or store listing states otherwise.
          </p>
        </Section>

        <Section title="7. Push notifications">
          <p>
            Push notifications are optional. If notification policy is enabled and you grant device
            permission, we store the minimum token and routing data needed to send meal reminders,
            streak reminders, account notices, or operational notifications.
          </p>
          <p>
            iOS notifications are sent through Apple Push Notification service using APNs tokens.
            Android notifications are sent through Firebase Cloud Messaging using FCM registration
            tokens. Push tokens are treated as sensitive operational identifiers and are not sold or
            used for ad targeting.
          </p>
          <p>
            You can disable notifications in your device settings. If a token becomes invalid,
            replaced, or unregistered, we may disable it for future sends.
          </p>
        </Section>

        <Section title="8. App stores and third-party services">
          <p>
            The app is distributed through Apple App Store and Google Play. Those stores may collect
            download, purchase, crash, analytics, device, and account information under their own
            policies.
          </p>
          <p>
            We may use trusted service providers for hosting, security, analytics, customer support,
            data storage, email delivery, AI analysis, subscriptions, push delivery, and
            advertising. These providers are allowed to process data only as needed to perform
            services for LogMyPlate.
          </p>
        </Section>

        <Section title="9. Data retention">
          <p>
            Meal journal data, health targets, and stored meal photos are retained while your
            account or app installation remains active, unless you delete them in the app or request
            deletion when you cannot access the app.
          </p>
          <p>
            Subscription entitlement records are retained while needed to provide Premium, resolve
            billing or support issues, prevent duplicate webhook processing, and meet legal,
            accounting, security, or abuse-prevention needs.
          </p>
          <p>
            Push tokens are retained while they remain active and notifications are permitted. We
            may disable or remove tokens when permission is revoked, the app registers a replacement
            token, or a push provider reports that a token is invalid.
          </p>
          <p>
            Technical logs are retained for a limited operational period, typically up to 90 days,
            unless a longer period is needed for security, abuse prevention, legal compliance, or
            debugging an active issue.
          </p>
        </Section>

        <Section title="10. Deletion and account removal">
          <p>
            You can permanently delete your account and associated app data directly in the app from{" "}
            <strong style={{ color: "var(--text-primary)" }}>
              Profile &gt; Privacy &amp; legal &gt; Delete account and data
            </strong>
            . Deletion removes account profile data, meal logs, health targets, stored meal photos,
            and active sign-in records associated with your account from active app systems.
          </p>
          <p>
            Read the{" "}
            <Link
              href="/data-deletion"
              className="underline underline-offset-4"
              style={{ color: "var(--app-amber)" }}
            >
              Data Deletion
            </Link>{" "}
            page for the current deletion process.
          </p>
        </Section>

        <Section title="11. Security">
          <p>
            We use reasonable technical and organizational safeguards designed to protect app data,
            including encrypted connections, password protection measures, access controls, and
            operational monitoring. No method of transmission or storage is perfectly secure.
          </p>
        </Section>

        <Section title="12. Children">
          <p>
            LogMyPlate is not directed to children under 13. In regions where a higher minimum age
            applies, such as 16 for certain EU users, users must meet that age requirement. If you
            believe a child provided personal information, contact us so we can delete it.
          </p>
        </Section>

        <Section title="13. International processing">
          <p>
            We operate from India and may use service providers in India, the United States, and
            other countries. By using the app, you understand that data may be processed where we or
            our providers operate.
          </p>
        </Section>

        <Section title="14. Your choices">
          <ul className="ml-5 flex list-disc flex-col gap-2">
            <li>You can use the app without creating an account, subject to app behavior.</li>
            <li>You can choose whether to watch rewarded ads for extra scans.</li>
            <li>You can edit AI estimates before saving meal logs.</li>
            <li>You can request account and data deletion.</li>
            <li>You can manage or cancel subscriptions through Apple App Store or Google Play.</li>
            <li>You can disable push notifications in your device settings.</li>
            <li>You can manage ad personalization in your device or Google settings.</li>
          </ul>
        </Section>

        <Section title="15. Changes to this policy">
          <p>
            We may update this Privacy Policy as the app changes. Material changes may be announced
            in the app or on this page. The "Last updated" date shows when this policy was most
            recently changed.
          </p>
        </Section>

        <Section title="16. Contact">
          <p>
            Email privacy questions or deletion requests to{" "}
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
