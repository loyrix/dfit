import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { APP_CONFIG } from "@/config/app";
import {
  LOCALES,
  type Locale,
  CORE_ROUTES,
  FOOD_SLUGS,
  GUIDE_SLUGS,
  PUBLISHED_LOCALES,
  getAlternateMetadata,
  getLocalizedUrl,
} from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { DownloadView } from "@/components/views/download-view";
import { SupportView } from "@/components/views/support-view";
import { PrivacyView } from "@/components/views/privacy-view";
import { TermsView } from "@/components/views/terms-view";
import { DataDeletionView } from "@/components/views/data-deletion-view";
import { CaloriesIndexView } from "@/components/views/calories-index-view";
import { GuidesIndexView } from "@/components/views/guides-index-view";
import { FoodArticle, foodMetadata } from "@/app/(en)/calories/food-page";
import { getFood, foodSlugs } from "@/app/(en)/calories/food-data";
import { GuideArticle, guideMetadata } from "@/app/(en)/guides/guide-page";
import { getGuide, guides } from "@/app/(en)/guides/content";
import {
  getLocalizedFood,
  getLocalizedFoods,
  getLocalizedGuide,
  getLocalizedGuides,
} from "@/lib/i18n/data";

interface CatchAllProps {
  params: Promise<{
    locale: string;
    slug: string[];
  }>;
}

export async function generateStaticParams() {
  const params: { locale: string; slug: string[] }[] = [];

  for (const locale of PUBLISHED_LOCALES) {
    if (locale === "en") continue;

    // Core single-segment routes
    params.push({ locale, slug: [CORE_ROUTES.download[locale]] });
    params.push({ locale, slug: [CORE_ROUTES.support[locale]] });
    params.push({ locale, slug: [CORE_ROUTES.privacy[locale]] });
    params.push({ locale, slug: [CORE_ROUTES.terms[locale]] });
    params.push({ locale, slug: [CORE_ROUTES.dataDeletion[locale]] });
    params.push({ locale, slug: [CORE_ROUTES.caloriesIndex[locale]] });
    params.push({ locale, slug: [CORE_ROUTES.guidesIndex[locale]] });

    // Calorie food detail routes
    const calPrefix = CORE_ROUTES.caloriesIndex[locale];
    for (const foodId of foodSlugs) {
      const foodSlug = FOOD_SLUGS[foodId]?.[locale] ?? foodId;
      params.push({ locale, slug: [calPrefix, foodSlug] });
    }

    // Guide detail routes
    const guidePrefix = CORE_ROUTES.guidesIndex[locale];
    for (const guide of guides) {
      const gSlug = GUIDE_SLUGS[guide.slug]?.[locale] ?? guide.slug;
      params.push({ locale, slug: [guidePrefix, gSlug] });
    }
  }

  return params;
}

export async function generateMetadata({ params }: CatchAllProps): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  const locale = rawLocale as Locale;

  if (!LOCALES.includes(locale) || locale === "en" || !slug || slug.length === 0) {
    return {};
  }

  const dict = getDictionary(locale);
  const calPrefix = CORE_ROUTES.caloriesIndex[locale];
  const guidePrefix = CORE_ROUTES.guidesIndex[locale];
  const metadataBase = new URL(APP_CONFIG.websiteUrl);

  // 1-segment routes
  if (slug.length === 1) {
    const s = slug[0];
    if (s === CORE_ROUTES.download[locale]) {
      return {
        metadataBase,
        title: dict.download.metaTitle,
        description: dict.download.metaDescription,
        alternates: getAlternateMetadata("download", locale),
      };
    }
    if (s === CORE_ROUTES.support[locale]) {
      return {
        metadataBase,
        title: dict.support.metaTitle,
        description: dict.support.metaDescription,
        alternates: getAlternateMetadata("support", locale),
      };
    }
    if (s === CORE_ROUTES.privacy[locale]) {
      return {
        metadataBase,
        title: dict.privacy.metaTitle,
        description: dict.privacy.metaDescription,
        alternates: getAlternateMetadata("privacy", locale),
      };
    }
    if (s === CORE_ROUTES.terms[locale]) {
      return {
        metadataBase,
        title: dict.terms.metaTitle,
        description: dict.terms.metaDescription,
        alternates: getAlternateMetadata("terms", locale),
      };
    }
    if (s === CORE_ROUTES.dataDeletion[locale]) {
      return {
        metadataBase,
        title: dict.dataDeletion.metaTitle,
        description: dict.dataDeletion.metaDescription,
        alternates: getAlternateMetadata("data-deletion", locale),
      };
    }
    if (s === calPrefix) {
      return {
        metadataBase,
        title: dict.caloriesIndex.metaTitle,
        description: dict.caloriesIndex.metaDescription,
        alternates: getAlternateMetadata("calories", locale),
      };
    }
    if (s === guidePrefix) {
      return {
        metadataBase,
        title: dict.guidesIndex.metaTitle,
        description: dict.guidesIndex.metaDescription,
        alternates: getAlternateMetadata("guides", locale),
      };
    }
  }

  // 2-segment routes
  if (slug.length === 2) {
    const [p0, p1] = slug;

    // Food detail
    if (p0 === calPrefix) {
      const canonicalFood =
        Object.keys(FOOD_SLUGS).find((k) => FOOD_SLUGS[k][locale] === p1) ?? p1;
      const food = getLocalizedFood(canonicalFood, locale) ?? getFood(canonicalFood);
      if (food) {
        const baseMeta = foodMetadata(food);
        return {
          metadataBase,
          ...baseMeta,
          alternates: getAlternateMetadata(`calories/${canonicalFood}`, locale),
        };
      }
    }

    // Guide detail
    if (p0 === guidePrefix) {
      const canonicalGuide =
        Object.keys(GUIDE_SLUGS).find((k) => GUIDE_SLUGS[k][locale] === p1) ?? p1;
      const guide = getLocalizedGuide(canonicalGuide, locale) ?? getGuide(canonicalGuide);
      if (guide) {
        const baseMeta = guideMetadata(guide);
        return {
          metadataBase,
          ...baseMeta,
          alternates: getAlternateMetadata(`guides/${canonicalGuide}`, locale),
        };
      }
    }
  }

  return {};
}

export default async function LocalizedCatchAllPage({ params }: CatchAllProps) {
  const { locale: rawLocale, slug } = await params;
  const locale = rawLocale as Locale;

  if (!LOCALES.includes(locale) || locale === "en" || !slug || slug.length === 0) {
    notFound();
  }

  const dict = getDictionary(locale);
  const calPrefix = CORE_ROUTES.caloriesIndex[locale];
  const guidePrefix = CORE_ROUTES.guidesIndex[locale];

  // 1-segment routes
  if (slug.length === 1) {
    const s = slug[0];
    if (s === CORE_ROUTES.download[locale]) {
      return <DownloadView locale={locale} dict={dict} />;
    }
    if (s === CORE_ROUTES.support[locale]) {
      return <SupportView locale={locale} dict={dict} />;
    }
    if (s === CORE_ROUTES.privacy[locale]) {
      return <PrivacyView locale={locale} dict={dict} />;
    }
    if (s === CORE_ROUTES.terms[locale]) {
      return <TermsView locale={locale} dict={dict} />;
    }
    if (s === CORE_ROUTES.dataDeletion[locale]) {
      return <DataDeletionView locale={locale} dict={dict} />;
    }
    if (s === calPrefix) {
      return (
        <CaloriesIndexView
          locale={locale}
          dict={dict}
          foodsList={getLocalizedFoods(locale)}
        />
      );
    }
    if (s === guidePrefix) {
      return (
        <GuidesIndexView
          locale={locale}
          dict={dict}
          guidesList={getLocalizedGuides(locale)}
        />
      );
    }
  }

  // 2-segment routes
  if (slug.length === 2) {
    const [p0, p1] = slug;

    // Calories food page
    if (p0 === calPrefix) {
      const canonicalFood =
        Object.keys(FOOD_SLUGS).find((k) => FOOD_SLUGS[k][locale] === p1) ?? p1;
      const food = getLocalizedFood(canonicalFood, locale) ?? getFood(canonicalFood);
      if (!food) notFound();
      return <FoodArticle slug={canonicalFood} locale={locale} />;
    }

    // Guides detail page
    if (p0 === guidePrefix) {
      const canonicalGuide =
        Object.keys(GUIDE_SLUGS).find((k) => GUIDE_SLUGS[k][locale] === p1) ?? p1;
      const guide = getLocalizedGuide(canonicalGuide, locale) ?? getGuide(canonicalGuide);
      if (!guide) notFound();
      return <GuideArticle slug={canonicalGuide} locale={locale} />;
    }
  }

  notFound();
}
