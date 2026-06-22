"use client";

/**
 * Read-through phase of an opening journey (M5).
 *
 * The board steps down the main line; each step shows one coach note in the playful-mentor
 * voice, plus any deviation asides ("if the bot plays this instead…") at branch points.
 * A move ribbon lets you jump around; the eval bar grounds each step in the engine number.
 * At the end, the four thematic panels appear and hand you off to the recall drill.
 *
 * Pure presentation over the curated `Opening` — it replays SAN for FENs (via readSteps)
 * and never computes chess or calls an engine.
 */

import { useMemo, useState } from "react";
import type { Color } from "chess.js";
import { Board } from "@/components/Board/Board";
import { EvalBar } from "@/components/EvalBar/EvalBar";
import { Reveal } from "@/components/Reveal";
import { readSteps, START_FEN, type Opening } from "@/lib/openings/tree";

export function ReadThrough({
  opening,
  onStartDrill,
}: {
  opening: Opening;
  onStartDrill: () => void;
}) {
  const steps = useMemo(() => readSteps(opening), [opening]);
  const [index, setIndex] = useState(0); // 0 = intro; 1..N = after main move N
  const orientation = opening.learnerSide as Color;
  const botLabel = opening.learnerSide === "w" ? "Black" : "White";

  const atEnd = index >= steps.length;
  const step = index > 0 ? steps[index - 1] : null;
  const fen = step ? step.fenAfter : START_FEN;
  const lastMove = step ? { from: step.from as never, to: step.to as never } : null;
  const evaluation = step?.evalCp != null ? { cp: step.evalCp, mate: null } : null;

  const moverName = step ? (step.learner ? "You play" : `${botLabel} plays`) : null;

  return (
    <div className="journey">
      {/* ---------------- board column ---------------- */}
      <div className="journey-board-col">
        <div className="board-row">
          <EvalBar evaluation={evaluation} orientation={orientation} />
          <Board
            fen={fen}
            orientation={orientation}
            interactive={false}
            lastMove={lastMove}
            onMove={() => {}}
          />
        </div>

        <MoveRibbon steps={steps} index={index} onJump={setIndex} />

        <div className="journey-controls" role="group" aria-label="Walk the line">
          <button
            className="jbtn"
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            disabled={index === 0}
          >
            <span aria-hidden="true">←</span> Back
          </button>
          <span className="journey-progress" aria-live="polite">
            {index} / {steps.length}
          </span>
          <button
            className="jbtn"
            onClick={() => setIndex((i) => Math.min(steps.length, i + 1))}
            disabled={atEnd}
          >
            Next <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>

      {/* ---------------- coach column ---------------- */}
      <aside className="journey-panel" aria-label="Coaching">
        {!atEnd ? (
          <Reveal key={index} delay={0}>
            <div className="jnote bracket">
              <span className="jnote-label">
                {moverName ? (
                  <>
                    {moverName}
                    {step && (
                      <span className="jnote-move">
                        {step.moveNumber}
                        {step.mover === "w" ? "." : "…"} {step.move.san}
                      </span>
                    )}
                  </>
                ) : (
                  "The idea"
                )}
              </span>
              <p className="jnote-text">{step ? step.move.note : opening.idea}</p>

              {step && step.deviations.length > 0 && (
                <ul className="jnote-asides">
                  {step.deviations.map((d) => (
                    <li key={d.san}>
                      <span className="aside-mark" aria-hidden="true">
                        ⤷
                      </span>
                      {d.aside}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Reveal>
        ) : (
          <Reveal delay={0}>
            <div className="jpanels">
              <h2 className="jpanels-title">The big picture</h2>
              <ThemePanel label="What each side wants" body={opening.panels.plans} />
              <ThemePanel label="Where the pieces belong" body={opening.panels.pieces} />
              <ThemePanel
                label={`Signature trap · ${opening.panels.trap.name}`}
                body={opening.panels.trap.text}
                accent
              />
              <ThemePanel label="The middlegame it becomes" body={opening.panels.middlegame} />

              <button className="btn btn-primary jplay-btn" onClick={onStartDrill}>
                Now play it yourself
                <span aria-hidden="true">→</span>
              </button>
            </div>
          </Reveal>
        )}
      </aside>
    </div>
  );
}

/** The main line as clickable SAN chips, grouped by full move; played moves lit. */
function MoveRibbon({
  steps,
  index,
  onJump,
}: {
  steps: ReturnType<typeof readSteps>;
  index: number;
  onJump: (i: number) => void;
}) {
  return (
    <div className="move-ribbon" role="group" aria-label="Main line">
      <button
        className={`ribbon-chip start${index === 0 ? " cur" : ""}`}
        onClick={() => onJump(0)}
        aria-label="Starting position"
      >
        ◆
      </button>
      {steps.map((s, i) => (
        <button
          key={s.ply}
          className={`ribbon-chip${i + 1 === index ? " cur" : ""}${i + 1 <= index ? " done" : ""}`}
          onClick={() => onJump(i + 1)}
        >
          {s.mover === "w" && <span className="ribbon-n">{s.moveNumber}.</span>}
          {s.move.san}
        </button>
      ))}
    </div>
  );
}

function ThemePanel({ label, body, accent }: { label: string; body: string; accent?: boolean }) {
  return (
    <section className={`jpanel${accent ? " accent" : ""}`}>
      <span className="jpanel-label">{label}</span>
      <p>{body}</p>
    </section>
  );
}
