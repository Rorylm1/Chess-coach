"use client";

/**
 * The opening journey shell (M5) — two phases on one page: a guided read-through, then a
 * recall drill. The phase tabs let you move between them freely; finishing the read-through
 * hands you straight into the drill. Everything below is static, curated content — no engine
 * and no LLM at runtime.
 *
 * M6 seam: a hidden "your mistakes in this opening" slot lives here, ready to light up once
 * weakness tracking exists. It renders nothing today.
 */

import { useState } from "react";
import Link from "next/link";
import { ReadThrough } from "@/components/OpeningJourney/ReadThrough";
import { Drill } from "@/components/OpeningJourney/Drill";
import type { Opening } from "@/lib/openings/tree";

type Phase = "read" | "drill";

const SIDE_GLYPH = { w: "♔", b: "♚" } as const;
const SIDE_LABEL = { w: "White", b: "Black" } as const;

export function OpeningJourney({ opening }: { opening: Opening }) {
  const [phase, setPhase] = useState<Phase>("read");

  return (
    <div className="journey-shell wrap">
      <header className="journey-head">
        <Link href="/openings" className="journey-back">
          <span aria-hidden="true">←</span> Openings
        </Link>

        <div className="journey-title">
          <span className="journey-eco">{opening.eco}</span>
          <h1>{opening.name}</h1>
          <span className="journey-side">
            <span className="glyph" aria-hidden="true">
              {SIDE_GLYPH[opening.learnerSide]}
            </span>
            You play {SIDE_LABEL[opening.learnerSide]}
          </span>
        </div>

        <div className="seg two journey-tabs" role="tablist" aria-label="Journey phase">
          <button
            role="tab"
            aria-selected={phase === "read"}
            className={`seg-btn${phase === "read" ? " on" : ""}`}
            onClick={() => setPhase("read")}
          >
            Walkthrough
          </button>
          <button
            role="tab"
            aria-selected={phase === "drill"}
            className={`seg-btn${phase === "drill" ? " on" : ""}`}
            onClick={() => setPhase("drill")}
          >
            Play it yourself
          </button>
        </div>
      </header>

      {phase === "read" ? (
        <ReadThrough opening={opening} onStartDrill={() => setPhase("drill")} />
      ) : (
        <Drill opening={opening} onReplayReadThrough={() => setPhase("read")} />
      )}

      {/* M6 seam — recurring mistakes in this opening will surface here. */}
      {/* <YourMistakes opening={opening.slug} /> */}
    </div>
  );
}
