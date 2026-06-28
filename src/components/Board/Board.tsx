"use client";

/**
 * Interactive chessboard — the hero. Ported verbatim from the locked
 * "Deep-Space Analysis Deck" mockup (research/designs/direction-d-scifi-play.html):
 * CSS-grid squares, unicode-glyph pieces with neon rim, cyan affordances.
 *
 * chess.js is the sole source of truth for legality — this component only renders the
 * position and reports attempted moves; the parent validates + applies them. Interaction
 * is unified click-to-move + pointer drag, so it feels right on both mouse and touch.
 */

import { useMemo, useRef, useState, useCallback, useEffect } from "react";
import { Chess, type Color, type Square } from "chess.js";
import { GLYPH, FILES, pieceName } from "@/lib/chess/pieces";
import { pieceRender, type PieceStyle } from "@/lib/table/spec";
import { PIECE_SETS, type PieceType } from "@/lib/table/pieceSets";

export interface AttemptedMove {
  from: Square;
  to: Square;
  promotion?: "q" | "r" | "b" | "n";
}

interface BoardProps {
  fen: string;
  orientation: Color;
  /** Whether the human may move right now (their turn, game live, engine idle). */
  interactive: boolean;
  /** Origin + destination of the last move played, for the amber highlight. */
  lastMove: { from: Square; to: Square } | null;
  onMove: (move: AttemptedMove) => void;
  /** Per-game generative table's piece style. Undefined → classic Unicode glyphs. */
  pieceStyle?: PieceStyle;
  /** Bumped on each deal/reset to play the re-tint sweep once. */
  sweepKey?: number;
}

interface DragState {
  from: Square;
  glyph: string;
  colorClass: "w" | "b";
  x: number;
  y: number;
  moved: boolean;
}

const PROMO_PIECES: Array<"q" | "r" | "b" | "n"> = ["q", "r", "b", "n"];

export function Board({
  fen,
  orientation,
  interactive,
  lastMove,
  onMove,
  pieceStyle,
  sweepKey = 0,
}: BoardProps) {
  const game = useMemo(() => new Chess(fen), [fen]);
  const turn = game.turn();
  const gridRef = useRef<HTMLDivElement>(null);

  // Re-tint sweep: a deal/reset bumps sweepKey → play the staggered colour sweep once.
  const pieces = pieceStyle ? pieceRender(pieceStyle) : null;
  const pieceSet = pieces ? PIECE_SETS[pieces.set] : null;
  const [sweeping, setSweeping] = useState(false);
  const sweepRef = useRef(sweepKey);
  useEffect(() => {
    if (sweepRef.current === sweepKey) return;
    sweepRef.current = sweepKey;
    setSweeping(true);
    const t = setTimeout(() => setSweeping(false), 900);
    return () => clearTimeout(t);
  }, [sweepKey]);

  const [selected, setSelected] = useState<Square | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [promotion, setPromotion] = useState<{ from: Square; to: Square; color: Color } | null>(
    null,
  );

  // Legal destinations for the selected square (drives hint dots / capture rings).
  const targets = useMemo(() => {
    if (!selected) return new Map<string, boolean>();
    const map = new Map<string, boolean>();
    for (const m of game.moves({ square: selected, verbose: true })) {
      map.set(m.to, m.captured != null || m.flags.includes("e"));
    }
    return map;
  }, [game, selected]);

  // King square to flag when in check.
  const checkSquare = useMemo<Square | null>(() => {
    if (!game.inCheck()) return null;
    for (const row of game.board()) {
      for (const sq of row) {
        if (sq && sq.type === "k" && sq.color === turn) return sq.square;
      }
    }
    return null;
  }, [game, turn]);

  const squareFromPoint = useCallback(
    (clientX: number, clientY: number): Square | null => {
      const grid = gridRef.current;
      if (!grid) return null;
      const rect = grid.getBoundingClientRect();
      if (
        clientX < rect.left ||
        clientX > rect.right ||
        clientY < rect.top ||
        clientY > rect.bottom
      ) {
        return null;
      }
      const col = Math.min(7, Math.max(0, Math.floor(((clientX - rect.left) / rect.width) * 8)));
      const row = Math.min(7, Math.max(0, Math.floor(((clientY - rect.top) / rect.height) * 8)));
      const fileIndex = orientation === "w" ? col : 7 - col;
      const rankNum = orientation === "w" ? 8 - row : 1 + row;
      return (FILES[fileIndex] + rankNum) as Square;
    },
    [orientation],
  );

  const requestMove = useCallback(
    (from: Square, to: Square) => {
      // Discover whether this from→to is a promotion by inspecting the legal moves.
      const moves = game.moves({ square: from, verbose: true });
      const match = moves.filter((m) => m.to === to);
      if (match.length === 0) return;
      if (match.some((m) => m.promotion)) {
        setSelected(null);
        setPromotion({ from, to, color: game.get(from)!.color });
        return;
      }
      setSelected(null);
      onMove({ from, to });
    },
    [game, onMove],
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!interactive || promotion) return;
      const sq = squareFromPoint(e.clientX, e.clientY);
      if (!sq) return;

      // Tapping a legal target of the current selection completes the move.
      if (selected && targets.has(sq)) {
        requestMove(selected, sq);
        return;
      }

      const piece = game.get(sq);
      if (piece && piece.color === turn) {
        setSelected(sq);
        gridRef.current?.setPointerCapture(e.pointerId);
        setDrag({
          from: sq,
          glyph: GLYPH[piece.type],
          colorClass: piece.color,
          x: e.clientX,
          y: e.clientY,
          moved: false,
        });
      } else {
        setSelected(null);
      }
    },
    [interactive, promotion, squareFromPoint, selected, targets, requestMove, game, turn],
  );

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    setDrag((d) => (d ? { ...d, x: e.clientX, y: e.clientY, moved: true } : d));
  }, []);

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      const d = drag;
      setDrag(null);
      if (!d) return;
      gridRef.current?.releasePointerCapture?.(e.pointerId);
      const sq = squareFromPoint(e.clientX, e.clientY);
      // A genuine drag onto a legal target completes the move; a tap keeps the
      // selection so the player can tap the destination next.
      if (d.moved && sq && sq !== d.from && targets.has(sq)) {
        requestMove(d.from, sq);
      }
    },
    [drag, squareFromPoint, targets, requestMove],
  );

  // Build squares in display order (top-left first), honouring orientation.
  const squares = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const fileIndex = orientation === "w" ? c : 7 - c;
      const rankNum = orientation === "w" ? 8 - r : 1 + r;
      const square = (FILES[fileIndex] + rankNum) as Square;
      const isLight = (fileIndex + rankNum) % 2 === 0;
      const piece = game.get(square);
      const isTarget = targets.has(square);
      const isCaptureTarget = targets.get(square) === true;
      const hidden = drag?.from === square && drag.moved;

      const cls = [
        "sq",
        isLight ? "lt" : "dk",
        lastMove && (lastMove.from === square || lastMove.to === square) ? "last" : "",
        selected === square ? "sel" : "",
        checkSquare === square ? "check" : "",
      ]
        .filter(Boolean)
        .join(" ");

      squares.push(
        <div
          key={square}
          className={cls}
          data-square={square}
          style={{ "--sweep-d": `${(r + c) * 26}ms` } as React.CSSProperties}
        >
          {c === 0 && <span className="coord rank">{rankNum}</span>}
          {r === 7 && <span className="coord file">{FILES[fileIndex]}</span>}
          {piece && !hidden && (
            <span
              className={`piece ${piece.color}`}
              aria-hidden="true"
              style={{ touchAction: "none" }}
            >
              {pieceSet ? (
                <svg
                  viewBox={pieceSet.vb}
                  aria-hidden="true"
                  dangerouslySetInnerHTML={{
                    __html: pieceSet.inner[piece.type.toUpperCase() as PieceType],
                  }}
                />
              ) : (
                GLYPH[piece.type]
              )}
            </span>
          )}
          {isTarget && (
            <span className={`hint${isCaptureTarget ? " cap" : ""}`} aria-hidden="true" />
          )}
        </div>,
      );
    }
  }

  const ariaLabel = describePosition(game, orientation, lastMove);

  return (
    <div className="board-wrap">
      <span className="brk tl" aria-hidden="true" />
      <span className="brk tr" aria-hidden="true" />
      <span className="brk bl" aria-hidden="true" />
      <span className="brk br" aria-hidden="true" />

      <div
        ref={gridRef}
        className={`board${interactive ? " live" : ""}${sweeping ? " sweeping" : ""}`}
        role="img"
        aria-label={ariaLabel}
        style={{ touchAction: "none" }}
        onPointerDown={onPointerDown}
        onPointerMove={drag ? onPointerMove : undefined}
        onPointerUp={onPointerUp}
        onPointerCancel={() => setDrag(null)}
      >
        {squares}
      </div>

      {drag?.moved && (
        <span
          className={`drag-piece ${drag.colorClass}`}
          aria-hidden="true"
          style={{ left: drag.x, top: drag.y }}
        >
          {drag.glyph}
        </span>
      )}

      {promotion && (
        <div className="promo-overlay" role="dialog" aria-label="Choose promotion piece">
          <div className="promo-pieces">
            {PROMO_PIECES.map((p) => (
              <button
                key={p}
                className="promo-btn"
                aria-label={`Promote to ${pieceName(promotion.color, p)}`}
                onClick={() => {
                  onMove({ from: promotion.from, to: promotion.to, promotion: p });
                  setPromotion(null);
                }}
              >
                <span className={`piece ${promotion.color}`}>{GLYPH[p]}</span>
              </button>
            ))}
            <button
              className="promo-cancel"
              aria-label="Cancel promotion"
              onClick={() => setPromotion(null)}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Full natural-language description of the position for screen readers (DESIGN.md
 * keeps the board as role="img" with a rich label rather than a div soup). */
function describePosition(
  game: Chess,
  orientation: Color,
  lastMove: { from: Square; to: Square } | null,
): string {
  const side = game.turn() === "w" ? "White" : "Black";
  const you = orientation === "w" ? "White" : "Black";
  let label = `Chess board, shown from ${you}'s side. ${side} to move.`;
  if (game.isCheckmate()) label = `Chess board. Checkmate — ${side} is mated.`;
  else if (game.isCheck()) label += ` ${side} is in check.`;
  if (lastMove) label += ` Last move: ${lastMove.from} to ${lastMove.to}.`;
  return label;
}
