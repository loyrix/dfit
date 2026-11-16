import Link from "next/link";
import { APP_CONFIG } from "@/config/app";
import type { Locale } from "@/lib/i18n/config";
import { getRelativeLocalizedUrl } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/types";
import { type FoodPage, foods as defaultFoods, scale } from "@/app/(en)/calories/food-data";

interface CaloriesIndexViewProps {
  locale: Locale;
  dict: Dictionary;
  foodsList?: FoodPage[];
}

export function CaloriesIndexView({ locale, dict, foodsList }: CaloriesIndexViewProps) {
  const t = dict.caloriesIndex;
  const allFoods: FoodPage[] = foodsList ?? defaultFoods;

  const indian = allFoods.filter((food) => food.tier === "indian");
  const global = allFoods.filter((food) => food.tier === "global");

  const card = (food: FoodPage) => {
    const headline = food.portions[1] ?? food.portions[0];
    const macros = scale(food.per100g, headline.grams);
    const href = getRelativeLocalizedUrl(`calories/${food.slug}`, locale);

    return (
      <Link
        key={food.slug}
        href={href}
        className="flex flex-col gap-2 rounded-[24px] border p-5 transition-opacity hover:opacity-80"
        style={{ borderColor: "var(--border)", background: "var(--app-card)" }}
      >
        <h3
          className="font-display text-xl font-semibold tracking-tight"
          style={{ color: "var(--text-primary)" }}
        >
          {food.name}
        </h3>
        <p className="text-[13px]" style={{ color: "var(--text-secondary)" }}>
          {headline.label} ({headline.grams} g) —{" "}
          <span className="font-semibold" style={{ color: "var(--app-amber)" }}>
            {macros.calories} cal
          </span>
          , {macros.protein} g {dict.common.macros.protein.toLowerCase()}
        </p>
      </Link>
    );
  };

  return (
    <main className="min-h-screen px-5 pb-24 pt-28 sm:px-6">
      <div className="mx-auto flex max-w-4xl flex-col gap-12">
        <header className="flex flex-col gap-5">
          <p
            className="text-[12px] font-semibold uppercase tracking-[0.32em]"
            style={{ color: "var(--app-amber)" }}
          >
            {t.badge}
          </p>
          <h1
            className="font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl"
            style={{ color: "var(--text-primary)" }}
          >
            {t.headline}
          </h1>
          <p className="text-[18px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {t.subtitle}
          </p>
          <p className="text-[15px] font-medium" style={{ color: "var(--text-primary)" }}>
            Every food. Actually good at Indian.
          </p>
        </header>

        <section className="flex flex-col gap-4">
          <h2
            className="font-display text-2xl font-semibold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            {t.tierIndian}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">{indian.map((food) => card(food))}</div>
        </section>

        {global.length > 0 && (
          <section className="flex flex-col gap-4">
            <h2
              className="font-display text-2xl font-semibold tracking-tight"
              style={{ color: "var(--text-primary)" }}
            >
              {t.tierGlobal}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">{global.map((food) => card(food))}</div>
          </section>
        )}

        <p className="text-[12px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
          {dict.common.notMedicalAdviceNotice}
        </p>
      </div>
    </main>
  );
}
