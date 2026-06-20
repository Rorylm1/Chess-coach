"use client";

/**
 * Vertical eval bar beside the board — the most legible read on "who's winning right now".
 *
 * Fill is driven by White's *win probability* (not raw centipawns), so a +6 and a +12 both
 * read as "White is winning" rather than pinning the bar at extremes. The bar follows board
 * orientation (the side at the bottom of the board sits at the bottom of the bar). The
 * numeric eval is White-POV and lives in the amber "evaluation" accent.
 */

import type { Color } from "chess.js";
import { formatEval, whiteWinPct, type Eval } from "@/lib/engine/analysis";

export function EvalBar({
  evaluation,
  orientation,
}: {
  evaluation: Eval | null;
  orientation: Color;
}) {
  const winWhite = evaluation ? whiteWinPct(evaluation) : 50;
  const label = evaluation ? formatEval(evaluation) : "–";
  const whiteAtBottom = orientation === "w";

  // The white-advantage region grows from the side White is on.
  const fillStyle: React.CSSProperties = whiteAtBottom
    ? { bottom: 0, height: `${winWhite}%` }
    : { top: 0, height: `${winWhite}%` };

  const ariaLabel = evaluation
    ? `Evaluation ${label} for White — White's winning chance ${Math.round(winWhite)} percent`
    : "Evaluation unavailable";

  return (
    <div className="evalbar" role="img" aria-label={ariaLabel}>
      <div className="evalbar-track">
        <div className="evalbar-fill" style={fillStyle} />
        <span className="evalbar-num" aria-hidden="true">
          {label}
        </span>
      </div>
    </div>
  );
}
