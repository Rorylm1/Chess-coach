"use client";

/**
 * The "Analysis" card: a live read of engine truth for the current game.
 *
 * Top — the current position's eval (White POV), the search depth, and the engine's best
 * line in SAN (the PV). Bottom — a swing graph of White's winning chance across the game,
 * with coloured markers where a side slipped (inaccuracy / mistake / blunder). The graph is
 * an SVG stretched to width (non-scaling strokes keep the line crisp); error markers are
 * HTML dots positioned by percentage so they stay perfectly round.
 *
 * Keeping the eval in `JetBrains Mono` and the line in the amber "evaluation" accent makes
 * this card unmistakably the *engine's* voice, distinct from the (future) coach's prose.
 */

import { Fragment } from "react";
import { QUALITY_META, type MoveQuality } from "@/lib/classify";
import { formatEval, type Eval } from "@/lib/engine/analysis";
import type { SeriesPoint } from "@/components/Play/useAnalysis";
import type { MoveFact } from "@/lib/grounding/payload";

interface EvalGraphProps {
  series: SeriesPoint[];
  moveFacts: MoveFact[];
  currentEval: Eval | null;
  currentDepth: number;
  currentPvSan: string[];
  analyzing: boolean;
}

const ERROR_QUALITIES: MoveQuality[] = ["inaccuracy", "mistake", "blunder"];

export function EvalGraph({
  series,
  moveFacts,
  currentEval,
  currentDepth,
  currentPvSan,
  analyzing,
}: EvalGraphProps) {
  const maxPly = Math.max(1, series.length - 1);
  const plotted = series.filter((s): s is { ply: number; winWhite: number } => s.winWhite != null);

  const x = (ply: number) => (ply / maxPly) * 100;
  const y = (win: number) => 100 - win;

  const linePath =
    plotted.length >= 2
      ? plotted.map((p, i) => `${i === 0 ? "M" : "L"} ${x(p.ply).toFixed(2)} ${y(p.winWhite).toFixed(2)}`).join(" ")
      : "";
  const areaPath =
    plotted.length >= 2
      ? `${linePath} L ${x(plotted[plotted.length - 1].ply).toFixed(2)} 50 L ${x(plotted[0].ply).toFixed(2)} 50 Z`
      : "";

  // Error markers, placed on the position that *results* from the slip.
  const markers = moveFacts
    .filter((f) => f.quality && ERROR_QUALITIES.includes(f.quality))
    .map((f) => {
      const point = series.find((s) => s.ply === f.ply + 1);
      if (!point || point.winWhite == null) return null;
      return { ply: f.ply + 1, win: point.winWhite, quality: f.quality as MoveQuality, san: f.san };
    })
    .filter((m): m is { ply: number; win: number; quality: MoveQuality; san: string } => m != null);

  const last = plotted[plotted.length - 1];

  const evalText = currentEval ? formatEval(currentEval) : "–";
  const favorsBlack = currentEval?.cp != null ? currentEval.cp < 0 : currentEval?.mate != null ? currentEval.mate < 0 : false;

  return (
    <section className="card analysis-card" aria-label="Engine analysis">
      <div className="card-head">
        <h2>Analysis</h2>
        <span className="tag">
          {analyzing ? <span className="ana-dot" aria-hidden="true" /> : null}
          {currentDepth > 0 ? `depth ${currentDepth}` : "Stockfish 18"}
        </span>
      </div>

      <div className="analysis-readout">
        <span className={`ana-eval${favorsBlack ? " black" : ""}`} aria-label={`Evaluation ${evalText} for White`}>
          {evalText}
        </span>
        <div className="ana-line" aria-label="Engine's best line">
          {currentPvSan.length > 0 ? (
            currentPvSan.slice(0, 6).map((san, i) => (
              <Fragment key={i}>
                <span className={i === 0 ? "pv-best" : "pv-move"}>{san}</span>{" "}
              </Fragment>
            ))
          ) : (
            <span className="ana-line-empty">{analyzing ? "Thinking…" : "Best line will appear here"}</span>
          )}
        </div>
      </div>

      <div className="evalgraph" aria-label="Evaluation graph: White's winning chance across the game">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="evalgraph-svg" aria-hidden="true">
          <line x1="0" y1="50" x2="100" y2="50" className="eg-baseline" vectorEffect="non-scaling-stroke" />
          {areaPath && <path d={areaPath} className="eg-area" />}
          {linePath && <path d={linePath} className="eg-line" vectorEffect="non-scaling-stroke" />}
        </svg>
        {markers.map((m, i) => (
          <span
            key={i}
            className="eg-marker"
            style={{
              left: `${x(m.ply)}%`,
              top: `${y(m.win)}%`,
              background: `var(${QUALITY_META[m.quality].colorVar})`,
            }}
            title={`${QUALITY_META[m.quality].label}: ${m.san}`}
          />
        ))}
        {last && (
          <span
            className="eg-now"
            style={{ left: `${x(last.ply)}%`, top: `${y(last.winWhite)}%` }}
            aria-hidden="true"
          />
        )}
        {plotted.length < 2 && (
          <span className="evalgraph-empty">{analyzing ? "Evaluating…" : "Play a few moves to see the swing"}</span>
        )}
      </div>
    </section>
  );
}
