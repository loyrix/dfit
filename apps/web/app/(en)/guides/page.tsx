import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n";
import { getAlternateMetadata } from "@/lib/i18n/config";
import { GuidesIndexView } from "@/components/views/guides-index-view";

export const metadata: Metadata = {
  title: "Guides and Blog",
  description:
    "Practical LogMyPlate guides for AI calorie tracking, Indian food calories, photo food journals, macro tracking, privacy, and daily calorie targets.",
  alternates: getAlternateMetadata("guides", "en"),
  openGraph: {
    title: "LogMyPlate Guides and Blog",
    description:
      "Helpful guides for AI calorie tracking, meal photos, Indian food calories, macros, privacy, and daily targets.",
    url: "/guides",
  },
};

export default function GuidesIndexPage() {
  const dict = getDictionary("en");
  return <GuidesIndexView locale="en" dict={dict} />;
}
