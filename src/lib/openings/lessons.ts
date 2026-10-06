import { Chess, type Square } from "chess.js";
import type { Side } from "./tree";

export interface OpeningLesson {
  id: string;
  version: number;
  name: string;
  idea: string;
  moves: string[];
  notes: string[];
  challenge: {
    prompt: string;
    hint: string;
    answers: string[];
    explanation: string;
  };
}
export interface OpeningHistory {
  era: string;
  title: string;
  text: string;
  source: string;
  image: {
    src: string;
    alt: string;
    caption: string;
    width: number;
    height: number;
    source: string;
    credit: string;
    licence: string;
    licenceUrl: string;
  };
}
export interface OpeningGame {
  title: string;
  white: string;
  black: string;
  event: string;
  year: string;
  result: string;
  source: string;
  pgn: string;
  intro: string;
  notes: Record<number, string>;
}
export interface OpeningCourse {
  lessons: OpeningLesson[];
  history: OpeningHistory;
  game: OpeningGame;
  source: string;
}
export function positionAt(moves: string[], ply: number) {
  const chess = new Chess();
  let lastMove: { from: Square; to: Square } | null = null;
  for (const san of moves.slice(0, ply)) {
    const move = chess.move(san);
    lastMove = { from: move.from, to: move.to };
  }
  return { fen: chess.fen(), lastMove };
}
export function resolveAttempt(
  fen: string,
  attempt: { from: string; to: string; promotion?: string },
) {
  try {
    const game = new Chess(fen);
    const move = game.move(attempt);
    return {
      san: move.san,
      fen: game.fen(),
      lastMove: { from: move.from, to: move.to },
    };
  } catch {
    return null;
  }
}
export function learnerTurn(side: Side, ply: number) {
  return (ply % 2 === 0 ? "w" : "b") === side;
}
export function acceptsMove(line: OpeningLesson, ply: number, san: string) {
  return ply === line.moves.length
    ? line.challenge.answers.includes(san)
    : line.moves[ply] === san;
}
export function matchingLines(
  lines: OpeningLesson[],
  played: string[],
  san: string,
) {
  return lines.filter(
    (line) =>
      played.every((move, i) => line.moves[i] === move) &&
      line.moves[played.length] === san,
  );
}
export function british(text: string) {
  return text
    .replace(/Defense/g, "Defence")
    .replace(/defense/g, "defence")
    .replace(/center/g, "centre")
    .replace(/Center/g, "Centre")
    .replace(/maneuver/g, "manoeuvre")
    .replace(/buildup/g, "build-up")
    .replace(/analyz/g, "analys")
    .replace(/favor/g, "favour");
}
