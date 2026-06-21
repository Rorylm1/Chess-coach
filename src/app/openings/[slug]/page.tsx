import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OpeningJourney } from "@/components/OpeningJourney/OpeningJourney";
import { OPENINGS, getOpening } from "@/content/openings";

/** Pre-render a static page for every authored opening. */
export function generateStaticParams() {
  return Object.keys(OPENINGS).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const opening = getOpening(slug);
  if (!opening) return { title: "Opening not found — Chess Coach" };
  return {
    title: `${opening.name} — Chess Coach`,
    description: opening.blurb,
  };
}

export default async function OpeningJourneyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const opening = getOpening(slug);
  if (!opening) notFound();
  return <OpeningJourney opening={opening} />;
}
