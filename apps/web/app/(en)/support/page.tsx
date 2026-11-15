import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n";
import { getAlternateMetadata } from "@/lib/i18n/config";
import { SupportView } from "@/components/views/support-view";

export const metadata: Metadata = {
  title: "Support",
  description: "Get help with LogMyPlate: AI Calorie Tracker — FAQ, tips, and contact information.",
  alternates: getAlternateMetadata("support", "en"),
};

export default function SupportPage() {
  const dict = getDictionary("en");
  return <SupportView locale="en" dict={dict} />;
}
