import { Chess, type Color, type PieceSymbol, type Square } from "chess.js";

export const CLASSIC_MOVE_INTERVAL_MS = 1750;

export interface ReplayPiece {
  /** Stable across moves, castling and promotion, so the piece slides between squares. */
  id: string;
  square: Square;
  type: PieceSymbol;
  color: Color;
}

export interface ReplayFrame {
  fen: string;
  pieces: ReplayPiece[];
  captured: ReplayPiece | null;
  lastMove: { from: Square; to: Square } | null;
  san: string;
  label: string;
}

function initialPieces(chess: Chess): ReplayPiece[] {
  return chess.board().flatMap(row => row.flatMap(piece => piece ? [{
    id: `${piece.color}-${piece.square}`,
    square: piece.square,
    type: piece.type,
    color: piece.color,
  }] : []));
}

/** Replay the complete main line. chess.js owns all move legality and special rules. */
export function buildClassicReplay(pgn: string): ReplayFrame[] {
  const source = new Chess();
  source.loadPgn(pgn);
  const moves = source.history();
  const chess = new Chess(source.getHeaders().FEN);
  let pieces = initialPieces(chess);
  const frames: ReplayFrame[] = [{
    fen: chess.fen(), pieces, captured: null, lastMove: null, san: "", label: "Starting position",
  }];

  for (const san of moves) {
    const move = chess.move(san);
    const captureSquare = move.isEnPassant()
      ? `${move.to[0]}${move.from[1]}` as Square
      : move.to;
    const captured = move.captured
      ? pieces.find(piece => piece.square === captureSquare) ?? null
      : null;
    pieces = pieces.filter(piece => piece.id !== captured?.id).map(piece => {
      if (piece.square === move.from) {
        return { ...piece, square: move.to, type: move.promotion ?? piece.type };
      }
      if (move.isKingsideCastle() && piece.square === `h${move.from[1]}`) {
        return { ...piece, square: `f${move.from[1]}` as Square };
      }
      if (move.isQueensideCastle() && piece.square === `a${move.from[1]}`) {
        return { ...piece, square: `d${move.from[1]}` as Square };
      }
      return piece;
    });
    const number = move.before.split(" ")[5];
    frames.push({
      fen: chess.fen(), pieces, captured,
      lastMove: { from: move.from, to: move.to }, san: move.san,
      label: `${number}${move.color === "w" ? "." : "…"} ${move.san}`,
    });
  }
  return frames;
}

export const CLASSIC_START = buildClassicReplay("")[0];

/** A new visit samples all ten games; the explicit shuffle avoids the current game. */
export function pickClassicIndex(count: number, current?: number, random = Math.random): number {
  if (count < 1) throw new Error("At least one classic game is required");
  if (count === 1) return 0;
  if (current === undefined) return Math.floor(random() * count);
  const pick = Math.floor(random() * (count - 1));
  return pick >= current ? pick + 1 : pick;
}
