import type { Metadata } from "next";
import Link from "next/link";
import { APP_CONFIG } from "@/config/app";
import { foods, scale } from "./food-data";

export const metadata: Metadata = {
  title: "Calories in Indian food — by the portion, not per 100g",
  description:
    "Calories, protein and fibre for roti, dal, rice, paneer and idli — in katoris, pieces and plates rather than per 100g. From the LogMyPlate food database.",
  alternates: { canonical: "/calories" },
};

export default function CaloriesIndexPage() {
  const indian = foods.filter((food) => food.tier === "indian");
  const global = foods.filter((food) => food.tier === "global");

  const card = (slug: string) => {
    const food = foods.find((item) => item.slug === slug)!;
    const headline = food.portions[1] ?? food.portions[0];
    const macros = scale(food.per100g, headline.grams);
    return (
      <Link
        key={food.slug}
        href={`/calories/${food.slug}`}
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
          , {macros.protein} g protein
        </p>
      </Link>
    );
  };

  return (
    <main className="min-h-screen px-5 pb-24 pt-28 sm:px-6">
      <div className="mx-auto flex max-w-4xl flex-col gap-12">
        <header className="flex flex-col gap-5">
          <h1
            className="font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl"
            style={{ color: "var(--text-primary)" }}
          >
            Calories, by the portion
          </h1>
          <p className="text-[18px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            Nobody weighs a roti. These pages give calories and macros in the units people actually
            use — one katori, one piece, one plate — with the real range we observe rather than a
            single figure pretending to be precise.
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
            Indian food
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">{indian.map((food) => card(food.slug))}</div>
        </section>

        {global.length > 0 && (
          <section className="flex flex-col gap-4">
            <h2
              className="font-display text-2xl font-semibold tracking-tight"
              style={{ color: "var(--text-primary)" }}
            >
              Everything else
            </h2>
            <p className="text-[15px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              LogMyPlate is not an Indian-food-only tracker. It reads a burrito bowl, a chicken
              salad or a bowl of oats the same way it reads a thali.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">{global.map((food) => card(food.slug))}</div>
          </section>
        )}

        <p className="text-[12px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
          Figures come from the {APP_CONFIG.brandName} food database and are estimates for typical
          preparations. They are not medical advice.
        </p>
      </div>
    </main>
  );
}
