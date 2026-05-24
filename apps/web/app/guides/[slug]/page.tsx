import { notFound } from "next/navigation";
import { getGuide, guideSlugs } from "../content";
import { GuideArticle, guideMetadata } from "../guide-page";

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return guideSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const guide = getGuide(slug);

  if (!guide) {
    return {};
  }

  return guideMetadata(guide);
}

export default async function GuideSlugPage({ params }: Props) {
  const { slug } = await params;
  const guide = getGuide(slug);

  if (!guide) {
    notFound();
  }

  return <GuideArticle slug={slug} />;
}
