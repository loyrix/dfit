import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { APP_CONFIG } from "@/config/app";

export const metadata: Metadata = {
  metadataBase: new URL(APP_CONFIG.websiteUrl),
  title: {
    default: `${APP_CONFIG.appName} — Track Meals from a Photo`,
    template: `%s | ${APP_CONFIG.appName}`,
  },
  description: APP_CONFIG.description,
  openGraph: {
    type: "website",
    siteName: APP_CONFIG.appName,
    title: `${APP_CONFIG.appName} — Track Meals from a Photo`,
    description: APP_CONFIG.description,
    images: [{ url: "/icon.png", width: 1024, height: 1024, alt: "LogMyPlate" }],
  },
  twitter: {
    card: "summary",
    title: `${APP_CONFIG.appName} — Track Meals from a Photo`,
    description: APP_CONFIG.description,
    images: ["/icon.png"],
  },
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafaf9" },
    { media: "(prefers-color-scheme: dark)", color: "#111114" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
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
          <Nav />
          <main className="flex-1">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
