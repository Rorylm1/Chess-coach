import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import { CATALOG, type OpeningSummary } from "@/content/openings";

export const metadata: Metadata = {
  title: "Openings — Chess Coach",
  description:
    "Guided, board-illustrated journeys through the famous openings — the ideas behind the moves, then a recall drill to make them yours.",
};

const SIDE_GLYPH = { w: "♔", b: "♚" } as const;
const SIDE_LABEL = { w: "White", b: "Black" } as const;

export default function OpeningsPage() {
  const ready = CATALOG.filter((o) => o.available);
  const soon = CATALOG.filter((o) => !o.available);

  return (
    <div className="openings wrap">
      <header className="openings-head">
        <Reveal delay={0}>
          <span className="eyebrow">openings as ideas, not memorization</span>
        </Reveal>
        <Reveal delay={0.08}>
          <h1>
            Learn the <span className="accent">famous openings</span>.
          </h1>
        </Reveal>
        <Reveal delay={0.16}>
          <p className="lede">
            Each journey walks you through an opening&apos;s real ideas — what the moves are{" "}
            <em>for</em>, where the pieces belong, the traps to know — then hands you the board to
            play it yourself against a bot that tries to throw you off.
          </p>
        </Reveal>
      </header>

      <Reveal delay={0.24}>
        <section className="opening-featured" aria-label="Available journeys">
          {ready.map((o) => (
            <FeaturedCard key={o.slug} opening={o} />
          ))}
        </section>
      </Reveal>

      {soon.length > 0 && (
        <Reveal delay={0.32}>
          <section className="opening-soon" aria-label="Coming soon">
            <span className="soon-kicker">More journeys in the works</span>
            <ul className="opening-soon-grid">
              {soon.map((o) => (
                <SoonCard key={o.slug} opening={o} />
              ))}
            </ul>
          </section>
        </Reveal>
      )}
    </div>
  );
}

function FeaturedCard({ opening }: { opening: OpeningSummary }) {
  return (
    <Link href={`/openings/${opening.slug}`} className="ocard ocard-ready bracket">
      <div className="ocard-top">
        <span className="ocard-eco">{opening.eco}</span>
        <span className="ocard-side">
          <span className="glyph" aria-hidden="true">
            {SIDE_GLYPH[opening.learnerSide]}
          </span>
          You play {SIDE_LABEL[opening.learnerSide]}
        </span>
      </div>
      <h2>{opening.name}</h2>
      <p>{opening.blurb}</p>
      <span className="ocard-cta">
        Start the journey
        <span className="arrow" aria-hidden="true">
          →
        </span>
      </span>
    </Link>
  );
}

function SoonCard({ opening }: { opening: OpeningSummary }) {
  return (
    <li className="ocard ocard-soon">
      <div className="ocard-top">
        <span className="ocard-eco">{opening.eco}</span>
        <span className="ocard-side">
          <span className="glyph" aria-hidden="true">
            {SIDE_GLYPH[opening.learnerSide]}
          </span>
          {SIDE_LABEL[opening.learnerSide]}
        </span>
      </div>
      <h2>{opening.name}</h2>
      <p>{opening.blurb}</p>
      <span className="ocard-soon-tag">Soon</span>
    </li>
  );
}
