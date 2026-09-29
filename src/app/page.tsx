import Link from "next/link";
import { DecorativeBoard } from "@/components/DecorativeBoard";
import { Reveal } from "@/components/Reveal";

const FEATURES = [
  {
    idx: "01",
    title: "Shuffle your world",
    body: "Give your game a fresh look with unexpected pieces, colours and atmosphere. One click, a whole new board.",
  },
  {
    idx: "02",
    title: "Bring a friend",
    body: "Create a private invite link and share your board across two devices. Or pass one screen back and forth. No accounts needed.",
  },
  {
    idx: "03",
    title: "Find your next opening",
    body: "Explore the ideas behind the moves, discover a few traps, then try the opening yourself in a quick practice game.",
  },
];

export default function Home() {
  return (
    <div className="wrap">
      <section className="hero">
        <div>
          <Reveal delay={0}>
            <span className="eyebrow">fresh boards · friendly games · new openings</span>
          </Reveal>
          <Reveal delay={0.08}>
            <h1>
              Same chess. <span className="accent">A whole new world.</span>
            </h1>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="lede">
              Shuffle the pieces, colours and atmosphere with our board randomizer.
              Bring a friend, take on a bot, or discover your next favourite opening.
              <strong> Make every game feel like yours.</strong>
            </p>
          </Reveal>
          <Reveal delay={0.24}>
            <div className="hero-actions">
              <Link href="/play" className="btn btn-primary">
                Try the board randomizer
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
          <div className="daily-opening-label">
            <span className="avatar" aria-hidden="true">
              ◆
            </span>
            A little chess, every day
          </div>
          <h2>A new chess opening is added each day.</h2>
          <p>
            Follow the moves, get to know the plan, then give it a go on the board.
            There&apos;s always another way to start a game.
          </p>
          <Link href="/openings" className="btn btn-ghost">Find an opening →</Link>
        </section>
      </Reveal>

      <Reveal delay={0.4}>
        <div className="features">
          {FEATURES.map((f) => (
            <article className="feature" key={f.idx}>
              <span className="idx">{f.idx}</span>
              <h3>{f.title}</h3>
              <p>{f.body}</p>
            </article>
          ))}
        </div>
      </Reveal>
    </div>
  );
}
