import type { Viewport } from "next";
import { notFound } from "next/navigation";
import { ThemeProvider } from "next-themes";
import { Noto_Sans_JP } from "next/font/google";
import "../globals.css";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { OfferRibbon } from "@/components/offer-ribbon";
import { LaunchOfferModal } from "@/components/launch-offer-modal";
import { Analytics } from "@/components/analytics";
import { APP_CONFIG, isLaunchOfferActive } from "@/config/app";
import {
  LOCALES,
  type Locale,
  LOCALE_MAP,
  PUBLISHED_LOCALES,
} from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-sans-jp",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: APP_CONFIG.lightThemeColor },
    { media: "(prefers-color-scheme: dark)", color: APP_CONFIG.darkThemeColor },
  ],
};

export async function generateStaticParams() {
  return PUBLISHED_LOCALES.filter((l) => l !== "en").map((locale) => ({ locale }));
}

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale: rawLocale } = await params;
  const locale = rawLocale as Locale;

  if (!LOCALES.includes(locale) || locale === "en") {
    notFound();
  }

  const dict = getDictionary(locale);
  const offerActive = isLaunchOfferActive();
  const isJa = locale === "ja";
  const htmlLang = LOCALE_MAP[locale]?.htmlLang ?? locale;

  return (
    <html
      lang={htmlLang}
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={isJa ? notoSansJP.variable : undefined}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`min-h-screen flex flex-col ${
          isJa ? "font-sans [word-break:auto-phrase] [overflow-wrap:break-word]" : ""
        }`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {offerActive && <OfferRibbon dict={dict.offerRibbon} />}
          <Nav locale={locale} dict={dict.nav} offsetForOffer={offerActive} />
          <main className={offerActive ? "flex-1 pt-9" : "flex-1"}>{children}</main>
          <Footer locale={locale} dict={dict.footer} />
          {offerActive && <LaunchOfferModal dict={dict.launchOfferModal} />}
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
