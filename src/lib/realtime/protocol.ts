import { Chess, type Color, type Square } from "chess.js";
import type { TableSpec } from "../table/spec";

export const ROOM_ID = /^[A-Za-z0-9_-]{24}$/;
export const PLAYER_TOKEN = /^[a-f0-9-]{36}$/;

export type OnlineResult = {
  title: string;
  detail: string;
  winner: Color | null;
};

export type RoomSnapshot = {
  id: string;
  fen: string;
  history: string[];
  turn: Color;
  joined: boolean;
  presence: Record<Color, boolean>;
  table: TableSpec | null;
  drawOffer: Color | null;
  result: OnlineResult | null;
  expiresAt: number;
};

export type GameCommand =
  | { type: "claim" }
  | { type: "move"; from: Square; to: Square; promotion?: "q" | "r" | "b" | "n"; ply: number }
  | { type: "resign" }
  | { type: "draw"; action: "offer" | "accept" | "decline" };

export type ClientMessage = GameCommand
  | { type: "create"; token: string; table: TableSpec | null }
  | { type: "enter"; roomId: string; token: string };

export type ServerMessage =
  | { type: "created"; roomId: string }
  | { type: "state"; room: RoomSnapshot; color: Color | null }
  | { type: "error"; code: string; message: string; fatal: boolean };

export const colorName = (color: Color) => color === "w" ? "White" : "Black";
export const opposite = (color: Color): Color => color === "w" ? "b" : "w";

export function chessResult(game: Chess): OnlineResult | null {
  if (game.isCheckmate()) {
    const winner = opposite(game.turn());
    return { title: "Checkmate", detail: `${colorName(winner)} wins by checkmate.`, winner };
  }
  const detail = game.isStalemate() ? "No legal moves — stalemate."
    : game.isInsufficientMaterial() ? "Insufficient material to checkmate."
    : game.isThreefoldRepetition() ? "Threefold repetition."
    : game.isDrawByFiftyMoves() ? "Fifty-move rule." : null;
  return detail ? { title: "Draw", detail, winner: null } : null;
}

/** Replay the full history, retaining repetition rights and rejecting desynchronization. */
export function replayRoom(room: RoomSnapshot): Chess {
  if (!Array.isArray(room.history) || room.history.length > 1200) throw new Error("Invalid history");
  const game = new Chess();
  for (const san of room.history) game.move(san, { strict: true });
  if (game.fen() !== room.fen || game.turn() !== room.turn) throw new Error("Position mismatch");
  return game;
}
