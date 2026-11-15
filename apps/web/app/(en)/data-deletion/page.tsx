import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n";
import { getAlternateMetadata } from "@/lib/i18n/config";
import { DataDeletionView } from "@/components/views/data-deletion-view";

export const metadata: Metadata = {
  title: "Data Deletion",
  description:
    "How to permanently delete your LogMyPlate account, meal journal, health targets, stored meal photos, and app data.",
  alternates: getAlternateMetadata("data-deletion", "en"),
};

export default function DataDeletionPage() {
  const dict = getDictionary("en");
  return <DataDeletionView locale="en" dict={dict} />;
}
