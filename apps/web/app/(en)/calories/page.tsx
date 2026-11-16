import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n";
import { getAlternateMetadata } from "@/lib/i18n/config";
import { CaloriesIndexView } from "@/components/views/calories-index-view";

export const metadata: Metadata = {
  title: "Calories in Indian food — by the portion, not per 100g",
  description:
    "Calories, protein and fibre for roti, dal, rice, paneer and idli — in katoris, pieces and plates rather than per 100g. From the LogMyPlate food database.",
  alternates: getAlternateMetadata("calories", "en"),
};

export default function CaloriesIndexPage() {
  const dict = getDictionary("en");
  return <CaloriesIndexView locale="en" dict={dict} />;
}
