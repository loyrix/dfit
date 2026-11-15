import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n";
import { getAlternateMetadata } from "@/lib/i18n/config";
import { PrivacyView } from "@/components/views/privacy-view";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "LogMyPlate Privacy Policy covering meal photos, AI analysis, account data, health targets, subscriptions, RevenueCat, push tokens, AdMob rewarded ads, app store data disclosures, and deletion rights.",
  alternates: getAlternateMetadata("privacy", "en"),
};

export default function PrivacyPage() {
  const dict = getDictionary("en");
  return <PrivacyView locale="en" dict={dict} />;
}
