import type { Metadata } from "next";
import { APP_CONFIG } from "@/config/app";
import { getDictionary } from "@/lib/i18n";
import { getAlternateMetadata } from "@/lib/i18n/config";
import { HomeView } from "@/components/views/home-view";

export const metadata: Metadata = {
  title: `${APP_CONFIG.appName} — Track Meals from a Photo`,
  description:
    "Snap a photo of your meal. LogMyPlate: AI Calorie Tracker identifies food items, estimates calories and macros, and saves everything to your journal — no barcodes needed.",
  alternates: getAlternateMetadata("", "en"),
};

export default function HomePage() {
  const dict = getDictionary("en");
  return <HomeView locale="en" dict={dict} />;
}
