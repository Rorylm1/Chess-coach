import Link from "next/link";
import { DecorativeBoard } from "@/components/DecorativeBoard";
import { Reveal } from "@/components/Reveal";

const FEATURES = [
  {
    idx: "01",
    title: "Play, don't lecture",
    body: "Start from a real game against an adjustable bot. Learning begins on the board, not in a manual.",
  },
  {
    idx: "02",
    title: "Ask when you're stuck",
    body: "On-demand hints, one tier at a time — a nudge before the answer. Help that waits to be asked.",
  },
  {
    idx: "03",
    title: "One useful lesson",
    body: "After every game, the single idea worth keeping — grounded in the engine, said like a human.",
  },
];

export default function Home() {
  return (
    <div className="wrap">
      <section className="hero">
        <div>
          <Reveal delay={0}>
            <span className="eyebrow">engine truth · human teaching</span>
          </Reveal>
          <Reveal delay={0.08}>
            <h1>
              The <span className="accent">useful lesson</span> in every game.
            </h1>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="lede">
              Stockfish does the calculation. Your coach does the explaining — in
              plain language, grounded in the engine. After every meaningful
              moment, one question: <strong>what was the useful lesson here?</strong>
            </p>
          </Reveal>
          <Reveal delay={0.24}>
            <div className="hero-actions">
              <Link href="/" className="btn btn-primary">
                Play a game
              </Link>
              <Link href="#" className="btn btn-ghost">
                Review last game
              </Link>
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.2}>
          <DecorativeBoard />
        </Reveal>
      </section>

      <Reveal delay={0.32}>
        <div className="coach-card bracket">
          <div className="coach-head">
            <span className="avatar" aria-hidden="true">
              ◆
            </span>
            Coach&apos;s note
          </div>
          <p className="coach-quote">
            &ldquo;The tactic was hiding in the <span className="pin">pin</span> —
            once the knight froze, the rook had nowhere safe to go.&rdquo;
          </p>
          <p className="coach-sub">
            Your instinct to attack was right. The move order was the lesson.
          </p>
          <span className="engine-chip">
            <span className="label">engine</span>
            <span className="eval">+1.4</span>
            <span>best&nbsp;Nxe5</span>
            <span>depth&nbsp;22</span>
          </span>
        </div>
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
