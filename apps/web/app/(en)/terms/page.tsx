import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n";
import { getAlternateMetadata } from "@/lib/i18n/config";
import { TermsView } from "@/components/views/terms-view";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "LogMyPlate Terms of Service covering AI calorie estimates, account responsibilities, subscriptions, rewarded ads, acceptable use, and limitation of liability.",
  alternates: getAlternateMetadata("terms", "en"),
};

export default function TermsPage() {
  const dict = getDictionary("en");
  return <TermsView locale="en" dict={dict} />;
}
