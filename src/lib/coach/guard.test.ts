import { describe, it, expect } from "vitest";
import { namedMoves, hasUngroundedMove } from "@/lib/coach/guard";
import { buildHintPayload } from "@/lib/coach/payload";
import type { PositionEval, Eval } from "@/lib/engine/analysis";

const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const cp = (n: number): Eval => ({ cp: n, mate: null });
const posEval: PositionEval = {
  eval: cp(20),
  depth: 14,
  bestUci: "e2e4",
  pvUci: ["e2e4", "e7e5", "g1f3"],
};
const payload = buildHintPayload({
  fen: START,
  positionEval: posEval,
  history: [],
  playerColor: "w",
  tier: "line",
});

describe("namedMoves — extracting moves from prose", () => {
  it("pulls out unambiguous SAN moves", () => {
    expect(namedMoves("Try Nf3 to develop, then maybe Bxe5!")).toEqual(
      expect.arrayContaining(["Nf3", "Bxe5"]),
    );
  });

  it("pulls out castling and UCI", () => {
    expect(namedMoves("You can castle with O-O.")).toContain("O-O");
    expect(namedMoves("The engine plays g1f3 here.")).toContain("g1f3");
  });

  it("does NOT mistake a square reference for a move", () => {
    expect(namedMoves("The pawn on e4 controls the centre and the f-file is open.")).toEqual([]);
  });
});

describe("hasUngroundedMove — the anti-hallucination backstop", () => {
  it("passes prose that names only offered moves", () => {
    expect(hasUngroundedMove("The engine likes Nf3 here, developing toward the centre.", payload)).toBe(false);
    expect(hasUngroundedMove("Strong line: e4 e5 Nf3, a classic open game.", payload)).toBe(false);
    expect(hasUngroundedMove("Consider g1f3 — same idea, written in long notation.", payload)).toBe(false);
  });

  it("passes prose with no moves at all", () => {
    expect(hasUngroundedMove("Take a look at your kingside and ask what's loose.", payload)).toBe(false);
  });

  it("flags a legal move that was never offered", () => {
    expect(hasUngroundedMove("You could try Nh3 instead.", payload)).toBe(true);
    expect(hasUngroundedMove("What about Bb5, pinning the knight?", payload)).toBe(true);
  });

  it("flags an outright illegal move (a hallucination)", () => {
    expect(hasUngroundedMove("Centralise with Ke2.", payload)).toBe(true);
  });

  it("tolerates annotation noise on an offered move", () => {
    expect(hasUngroundedMove("The crisp choice is Nf3!, eyeing e5.", payload)).toBe(false);
  });
});
