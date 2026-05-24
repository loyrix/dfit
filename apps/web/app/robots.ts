import type { MetadataRoute } from "next";
import { APP_CONFIG } from "@/config/app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${APP_CONFIG.websiteUrl}/sitemap.xml`,
  };
}
