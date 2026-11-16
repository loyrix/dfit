import { notFound } from "next/navigation";
import { getFood, foodSlugs } from "../food-data";
import { FoodArticle, foodMetadata } from "../food-page";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return foodSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const food = getFood(slug);
  if (!food) return {};
  return foodMetadata(food);
}

export default async function FoodSlugPage({ params }: Props) {
  const { slug } = await params;
  if (!getFood(slug)) notFound();
  return <FoodArticle slug={slug} />;
}
