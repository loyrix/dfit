import { APP_CONFIG } from "@/config/app";

export const dynamic = "force-static";

export function GET() {
  return Response.json({
    name: APP_CONFIG.appName,
    short_name: APP_CONFIG.brandName,
    description: APP_CONFIG.description,
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: APP_CONFIG.lightThemeColor,
    theme_color: APP_CONFIG.lightThemeColor,
    categories: ["health", "fitness", "food"],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable",
      },
    ],
  });
}
