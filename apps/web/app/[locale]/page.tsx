import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { APP_CONFIG } from "@/config/app";
import {
  LOCALES,
  type Locale,
  LOCALE_MAP,
  PUBLISHED_LOCALES,
  getAlternateMetadata,
} from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { HomeView } from "@/components/views/home-view";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateStaticParams() {
  return PUBLISHED_LOCALES.filter((l) => l !== "en").map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = rawLocale as Locale;

  if (!LOCALES.includes(locale) || locale === "en") {
    return {};
  }

  const dict = getDictionary(locale);
  const alternates = getAlternateMetadata("", locale);
  const canonicalUrl = `${APP_CONFIG.websiteUrl}/${locale}`;

  return {
    metadataBase: new URL(APP_CONFIG.websiteUrl),
    title: dict.home.metaTitle,
    description: dict.home.metaDescription,
    alternates,
    openGraph: {
      type: "website",
      url: canonicalUrl,
      siteName: APP_CONFIG.appName,
      title: dict.home.metaTitle,
      description: dict.home.metaDescription,
      locale: LOCALE_MAP[locale]?.ogLocale ?? locale,
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
      title: dict.home.metaTitle,
      description: dict.home.metaDescription,
      images: ["/opengraph-image"],
    },
  };
}

export default async function LocalizedHomePage({ params }: PageProps) {
  const { locale: rawLocale } = await params;
  const locale = rawLocale as Locale;

  if (!LOCALES.includes(locale) || locale === "en") {
    notFound();
  }

  const dict = getDictionary(locale);
  return <HomeView locale={locale} dict={dict} />;
}
