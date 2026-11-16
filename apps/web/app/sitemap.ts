import type { MetadataRoute } from "next";
import { APP_CONFIG } from "@/config/app";
import {
  type Locale,
  PUBLISHED_LOCALES,
  getLocalizedUrl,
  getAlternateMetadata,
} from "@/lib/i18n/config";
import { foodSlugs } from "./(en)/calories/food-data";
import { guides } from "./(en)/guides/content";

interface RouteDef {
  path: string;
  changeFrequency: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority: number;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const coreRoutes: RouteDef[] = [
    { path: "", changeFrequency: "weekly", priority: 1.0 },
    { path: "download", changeFrequency: "monthly", priority: 0.9 },
    { path: "calories", changeFrequency: "weekly", priority: 0.85 },
    { path: "guides", changeFrequency: "weekly", priority: 0.8 },
    { path: "support", changeFrequency: "monthly", priority: 0.6 },
    { path: "privacy", changeFrequency: "monthly", priority: 0.4 },
    { path: "terms", changeFrequency: "monthly", priority: 0.4 },
    { path: "data-deletion", changeFrequency: "monthly", priority: 0.45 },
  ];

  const foodRoutes: RouteDef[] = foodSlugs.map((slug) => ({
    path: `calories/${slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.75,
  }));

  const guideRoutes: RouteDef[] = guides.map((guide) => ({
    path: `guides/${guide.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.72,
  }));

  const allRoutes = [...coreRoutes, ...foodRoutes, ...guideRoutes];
  const sitemapEntries: MetadataRoute.Sitemap = [];

  for (const locale of PUBLISHED_LOCALES) {
    for (const route of allRoutes) {
      const alternates = getAlternateMetadata(route.path, locale, PUBLISHED_LOCALES);
      sitemapEntries.push({
        url: alternates.canonical,
        lastModified: now,
        changeFrequency: route.changeFrequency,
        priority: locale === "en" ? route.priority : Number((route.priority * 0.95).toFixed(2)),
        alternates: {
          languages: alternates.languages,
        },
      });
    }
  }

  return sitemapEntries;
}
