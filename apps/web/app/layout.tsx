import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { OfferRibbon } from "@/components/offer-ribbon";
import { LaunchOfferModal } from "@/components/launch-offer-modal";
import { APP_CONFIG, isLaunchOfferActive } from "@/config/app";

export const metadata: Metadata = {
  metadataBase: new URL(APP_CONFIG.websiteUrl),
  applicationName: APP_CONFIG.appName,
  category: "Health & Fitness",
  keywords: [...APP_CONFIG.keywords],
  authors: [{ name: APP_CONFIG.developerName, url: APP_CONFIG.websiteUrl }],
  creator: APP_CONFIG.developerName,
  publisher: APP_CONFIG.developerName,
  manifest: "/site.webmanifest",
  title: {
    default: `${APP_CONFIG.appName} — Track Meals from a Photo`,
    template: `%s | ${APP_CONFIG.appName}`,
  },
  description: APP_CONFIG.description,
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    url: APP_CONFIG.websiteUrl,
    siteName: APP_CONFIG.appName,
    title: `${APP_CONFIG.appName} — Track Meals from a Photo`,
    description: APP_CONFIG.description,
    locale: "en_US",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: `${APP_CONFIG.appName} app preview`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${APP_CONFIG.appName} — Track Meals from a Photo`,
    description: APP_CONFIG.description,
    images: ["/opengraph-image"],
  },
  appLinks: {
    ios: {
      url: APP_CONFIG.appStoreUrl,
      app_store_id: APP_CONFIG.iosAppId,
      app_name: APP_CONFIG.appName,
    },
    android: {
      package: APP_CONFIG.androidPackage,
      app_name: APP_CONFIG.appName,
      url: APP_CONFIG.playStoreUrl,
    },
    web: {
      url: APP_CONFIG.websiteUrl,
      should_fallback: true,
    },
  },
  appleWebApp: {
    capable: true,
    title: APP_CONFIG.brandName,
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/apple-touch-icon.png", type: "image/png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: APP_CONFIG.lightThemeColor },
    { media: "(prefers-color-scheme: dark)", color: APP_CONFIG.darkThemeColor },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const offerActive = isLaunchOfferActive();
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {offerActive && <OfferRibbon />}
          <Nav offsetForOffer={offerActive} />
          <main className={offerActive ? "flex-1 pt-9" : "flex-1"}>{children}</main>
          <Footer />
          {offerActive && <LaunchOfferModal />}
        </ThemeProvider>
      </body>
    </html>
  );
}
