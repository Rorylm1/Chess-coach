import Link from "next/link";
import { DecorativeBoard } from "@/components/DecorativeBoard";
import { Reveal } from "@/components/Reveal";

export default function Home() {
  return (
    <div className="wrap">
      <section className="hero">
        <div>
          <Reveal delay={0}>
            <span className="eyebrow">Make your move</span>
          </Reveal>
          <Reveal delay={0.08}>
            <h1>
              Same chess. <span className="accent">A whole new world.</span>
            </h1>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="lede">
              Shuffle your board. Play a friend or a bot. Find your next opening.
            </p>
          </Reveal>
          <Reveal delay={0.24}>
            <div className="hero-actions">
              <Link href="/play" className="btn btn-primary">
                Play & randomize
              </Link>
              <Link href="/openings" className="btn btn-ghost">
                Explore openings
              </Link>
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.2}>
          <DecorativeBoard />
        </Reveal>
      </section>

      <Reveal delay={0.32}>
        <section className="daily-opening bracket" aria-label="Daily openings">
          <h2>A new chess opening is added each day.</h2>
          <Link href="/openings" className="btn btn-ghost">Find an opening →</Link>
        </section>
      </Reveal>

      <Reveal delay={0.4}>
        <figure className="home-quote">
          <blockquote cite="https://time.com/3734140/bobby-fischer-mind-games/">
            <p>“All I want to do, ever, is play chess.”</p>
          </blockquote>
          <figcaption>
            — <a href="https://time.com/3734140/bobby-fischer-mind-games/">Bobby Fischer</a>
          </figcaption>
        </figure>
      </Reveal>
    </div>
  );
}
