import type { MetadataRoute } from "next";
import { APP_CONFIG } from "@/config/app";
import { foodSlugs } from "./calories/food-data";
import { guides } from "./guides/content";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = APP_CONFIG.websiteUrl;
  const now = new Date();
  const foodRoutes = foodSlugs.map((slug) => ({
    url: `${base}/calories/${slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.75,
  }));
  const guideRoutes = guides.map((guide) => ({
    url: `${base}/guides/${guide.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.72,
  }));

  return [
    {
      url: base,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${base}/download`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${base}/guides`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${base}/calories`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    ...foodRoutes,
    ...guideRoutes,
    {
      url: `${base}/support`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${base}/privacy`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${base}/terms`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${base}/data-deletion`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.45,
    },
  ];
}
