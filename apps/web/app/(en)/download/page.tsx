import type { Metadata } from "next";
import { APP_CONFIG } from "@/config/app";
import { getDictionary } from "@/lib/i18n";
import { getAlternateMetadata } from "@/lib/i18n/config";
import { DownloadView } from "@/components/views/download-view";

export const metadata: Metadata = {
  title: `Download ${APP_CONFIG.appName}`,
  description:
    "Download LogMyPlate: AI Calorie Tracker on iPhone or Android. Snap a photo of any meal and get instant calorie and macro estimates — no barcodes, no database searching.",
  alternates: getAlternateMetadata("download", "en"),
};

export default function DownloadPage() {
  const dict = getDictionary("en");
  return <DownloadView locale="en" dict={dict} />;
}
