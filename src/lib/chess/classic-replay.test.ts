import { Chess } from "chess.js";
import { describe, expect, it } from "vitest";
import { CLASSIC_GAMES } from "@/content/classic-games";
import { buildClassicReplay, CLASSIC_MOVE_INTERVAL_MS, pickClassicIndex } from "./classic-replay";

// Independent endpoints transcribed from the downloaded source scores. These catch
// accidental truncation and post-game analysis being appended as played moves.
const ENDINGS: Record<string, [number, string]> = {
  "evergreen-1852": [47, "1r3kr1/pbpBBp1p/1b3P2/8/8/2P2q2/P4PPP/3R2K1 b - - 0 24"],
  "opera-1858": [33, "1n1Rkb1r/p4ppp/4q3/4p1B1/4P3/8/PPP2PPP/2K5 b k - 1 17"],
  "steinitz-bardeleben-1895": [49, "r1r4k/pp1q3R/5pp1/3p2N1/6Q1/8/PP3PPP/2R3K1 b - - 0 25"],
  "rubinstein-1907": [50, "6k1/5ppp/pb2p3/1p2P3/1P2bPnP/P6r/1B4QP/R4R1K w - - 2 26"],
  "gold-coin-1912": [46, "5rk1/pp4pp/4p3/2R3Q1/3n4/6qr/P1P2PPP/5RK1 w - - 2 24"],
  "century-1956": [82, "1Q6/5pk1/2p3p1/1p2N2p/1b5P/1bn5/2r3P1/2K5 w - - 16 42"],
  "botvinnik-tal-1960": [92, "8/2R4p/6p1/8/3k1P2/2p3KP/8/4r3 w - - 2 47"],
  "fischer-spassky-1972": [81, "4q2k/2r1r3/4PR1p/p1p5/P1Bp1Q1P/1P6/6P1/6K1 b - - 4 41"],
  "karpov-kasparov-1985": [80, "8/5pk1/7p/8/1p4P1/1P1R2P1/3N1qBP/3Nr2K w - - 1 41"],
  "kasparov-topalov-1999": [87, "8/Q6p/6p1/5p2/5P2/2p3P1/3r3P/2K1k3 b - - 3 44"],
};

describe("homepage classic game scores", () => {
  it("contains ten distinct, sourced games at the requested pace", () => {
    expect(CLASSIC_GAMES).toHaveLength(10);
    expect(new Set(CLASSIC_GAMES.map(game => game.id)).size).toBe(10);
    expect(CLASSIC_MOVE_INTERVAL_MS).toBe(2500);
  });

  for (const game of CLASSIC_GAMES) {
    it(`plays every move of ${game.title} to its recorded ending`, () => {
      const frames = buildClassicReplay(game.pgn);
      const [plies, finalFen] = ENDINGS[game.id];
      expect(frames).toHaveLength(plies + 1);
      expect(frames.at(-1)?.fen).toBe(finalFen);
      const source = new Chess();
      source.loadPgn(game.pgn);
      expect(source.getHeaders().Result).toBe(game.result);
      expect(game.sourceUrl).toMatch(/^https:\/\//);
      expect(game.scoreSourceUrl).toMatch(/^https:\/\/www\.pgnmentor\.com\/players\//);
      expect(frames.slice(1).map(frame => frame.san)).toEqual(source.history());

      for (const frame of frames) {
        const position = new Chess(frame.fen);
        expect(new Set(frame.pieces.map(piece => piece.id)).size).toBe(frame.pieces.length);
        expect(frame.pieces).toHaveLength(position.board().flat().filter(Boolean).length);
        for (const piece of frame.pieces) {
          expect(position.get(piece.square)).toEqual({ type: piece.type, color: piece.color });
        }
      }
    });
  }
});

describe("stable animated pieces", () => {
  it("moves both king and rook on either side of castling", () => {
    const frames = buildClassicReplay('[SetUp "1"]\n[FEN "r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1"]\n\n1. O-O O-O-O *');
    const pieces = frames.at(-1)!.pieces;
    expect(pieces.find(piece => piece.id === "w-e1")?.square).toBe("g1");
    expect(pieces.find(piece => piece.id === "w-h1")?.square).toBe("f1");
    expect(pieces.find(piece => piece.id === "b-e8")?.square).toBe("c8");
    expect(pieces.find(piece => piece.id === "b-a8")?.square).toBe("d8");
  });

  it("removes an en passant pawn from its actual square", () => {
    const last = buildClassicReplay("1. e4 a6 2. e5 d5 3. exd6 *").at(-1)!;
    expect(last.captured).toMatchObject({ id: "b-d7", square: "d5" });
    expect(last.pieces.find(piece => piece.id === "b-d7")).toBeUndefined();
    expect(last.pieces.find(piece => piece.id === "w-e2")?.square).toBe("d6");
  });

  it("keeps a pawn's identity when it promotes", () => {
    const last = buildClassicReplay('[SetUp "1"]\n[FEN "7k/P7/8/8/8/8/8/7K w - - 0 1"]\n\n1. a8=Q+ *').at(-1)!;
    expect(last.pieces.find(piece => piece.id === "w-a7")).toMatchObject({ type: "q", square: "a8" });
  });
});

describe("game selection", () => {
  it("can select any of the ten games on a fresh visit", () => {
    expect(Array.from({ length: 10 }, (_, i) => pickClassicIndex(10, undefined, () => (i + 0.5) / 10)))
      .toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it("shuffles to every other game without immediately repeating", () => {
    for (let current = 0; current < 10; current++) {
      const picks = Array.from({ length: 9 }, (_, i) => pickClassicIndex(10, current, () => (i + 0.5) / 9));
      expect(picks).not.toContain(current);
      expect(new Set(picks).size).toBe(9);
      expect(picks.every(index => index >= 0 && index < 10)).toBe(true);
    }
  });
});
