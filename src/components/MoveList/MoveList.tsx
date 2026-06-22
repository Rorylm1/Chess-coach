"use client";

/**
 * Color-coded move log. Each move shows its SAN plus a classification annotation
 * (✦ best, ?! inaccuracy, ? mistake, ?? blunder), tinted by quality. This is the move
 * list as a *learning surface*: at a glance you can see where a game went wrong, before
 * ever opening a deeper review. Verdicts come straight from the grounding facts — no LLM,
 * no guessing — and stream in as the engine evaluates each position.
 *
 * Each move is also a tap target (M3): tapping it asks the coach to explain what that move
 * did — the backward-looking half of the coaching layer, reusing the same grounding payload.
 */

import { QUALITY_META } from "@/lib/classify";
import { formatEval } from "@/lib/engine/analysis";
import type { MoveFact } from "@/lib/grounding/payload";

function MoveCell({
  fact,
  current,
  explained,
  onExplain,
}: {
  fact: MoveFact | undefined;
  current: boolean;
  explained: boolean;
  onExplain?: (fact: MoveFact) => void;
}) {
  if (!fact) return <span className="m" />;
  const meta = fact.quality ? QUALITY_META[fact.quality] : null;
  const title = meta
    ? `${fact.san} — ${meta.label}${fact.evalAfter ? ` (${formatEval(fact.evalAfter)})` : ""} · tap to explain`
    : `${fact.san} · tap to explain`;
  return (
    <button
      type="button"
      className={`m${current ? " cur" : ""}${explained ? " explained" : ""}${meta && meta.symbol ? " q" : ""}`}
      style={meta ? ({ "--q": `var(${meta.colorVar})` } as React.CSSProperties) : undefined}
      title={title}
      onClick={() => onExplain?.(fact)}
    >
      {fact.san}
      {meta?.symbol && <span className="q-sym" aria-hidden="true">{meta.symbol}</span>}
    </button>
  );
}

export function MoveList({
  moveFacts,
  onExplain,
  explainedPly,
}: {
  moveFacts: MoveFact[];
  /** Ask the coach to explain a move (M3). When omitted, cells are inert. */
  onExplain?: (fact: MoveFact) => void;
  /** Ply currently being explained, for highlight. */
  explainedPly?: number | null;
}) {
  const rows: Array<{ n: number; white?: MoveFact; black?: MoveFact }> = [];
  for (let i = 0; i < moveFacts.length; i += 2) {
    rows.push({ n: i / 2 + 1, white: moveFacts[i], black: moveFacts[i + 1] });
  }
  const lastPly = moveFacts.length - 1;
  const moveCount = Math.ceil(moveFacts.length / 2);

  return (
    <section className="card moves-card">
      <div className="card-head">
        <h2>Move Log</h2>
        <span className="tag">
          SAN · {moveCount} {moveCount === 1 ? "move" : "moves"}
        </span>
      </div>
      <div className="moves" aria-label="Move list">
        {rows.length === 0 && <p className="moves-empty">No moves yet — make the first one.</p>}
        {rows.map((row) => (
          <div className="moverow" key={row.n}>
            <span className="n">{row.n}.</span>
            <MoveCell
              fact={row.white}
              current={row.white?.ply === lastPly}
              explained={row.white?.ply === explainedPly}
              onExplain={onExplain}
            />
            <MoveCell
              fact={row.black}
              current={row.black?.ply === lastPly}
              explained={row.black?.ply === explainedPly}
              onExplain={onExplain}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
