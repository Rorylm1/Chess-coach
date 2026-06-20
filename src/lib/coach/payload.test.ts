import { describe, it, expect } from "vitest";
import {
  buildHintPayload,
  buildExplainPayload,
  vocabulary,
} from "@/lib/coach/payload";
import type { PositionEval, Eval } from "@/lib/engine/analysis";
import type { MoveFact } from "@/lib/grounding/payload";
import type { Classification } from "@/lib/classify";

const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const cp = (n: number): Eval => ({ cp: n, mate: null });

function posEval(bestUci: string, pvUci: string[], e: Eval = cp(20)): PositionEval {
  return { eval: e, depth: 14, bestUci, pvUci };
}

describe("buildHintPayload — shape, vocabulary, glosses", () => {
  const p = buildHintPayload({
    fen: START,
    positionEval: posEval("e2e4", ["e2e4", "e7e5", "g1f3"]),
    history: [],
    playerColor: "w",
    tier: "candidate",
  });

  it("carries the surface, tier and side to move", () => {
    expect(p.surface).toBe("hint");
    expect(p.tier).toBe("candidate");
    expect(p.toMove).toBe("w");
    expect(p.played).toBeNull();
  });

  it("glosses the best move and PV in plain language", () => {
    expect(p.best?.san).toBe("e4");
    expect(p.best?.gloss).toBe("pawn to e4");
    expect(p.pv.map((e) => e.san)).toEqual(["e4", "e5", "Nf3"]);
    expect(p.pv[2].gloss).toBe("knight to f3");
  });

  it("preserves the raw PV (UCI) for the server-side validator", () => {
    expect(p.pvUci).toEqual(["e2e4", "e7e5", "g1f3"]);
  });

  it("formats the eval White-POV and assesses it for the player", () => {
    expect(p.evalText).toBe("+0.2");
    expect(p.assessment).toBe("it's roughly balanced");
  });

  it("dedupes the allowed vocabulary (best collapses into the PV's first move)", () => {
    expect(vocabulary(p).map((e) => e.san)).toEqual(["e4", "e5", "Nf3"]);
  });
});

describe("glossing covers captures, checks, castling and promotion", () => {
  const gloss = (fen: string, bestUci: string) =>
    buildHintPayload({ fen, positionEval: posEval(bestUci, [bestUci]), history: [], playerColor: "w", tier: "line" })
      .best;

  it("pawn capture", () => {
    const e = gloss("rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 2", "e4d5");
    expect(e?.san).toBe("exd5");
    expect(e?.gloss).toBe("pawn takes on d5");
  });

  it("piece capture names what it takes", () => {
    const e = gloss("4k3/8/8/4p3/8/5N2/8/4K3 w - - 0 1", "f3e5");
    expect(e?.san).toBe("Nxe5");
    expect(e?.gloss).toBe("knight takes the pawn on e5");
  });

  it("check is spelled out", () => {
    const e = gloss("4k3/8/8/8/8/8/4Q3/4K3 w - - 0 1", "e2e7");
    expect(e?.san).toBe("Qe7+");
    expect(e?.gloss).toBe("queen to e7 with check");
  });

  it("castling reads naturally", () => {
    const e = gloss("r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1", "e1g1");
    expect(e?.san).toBe("O-O");
    expect(e?.gloss).toBe("castles kingside");
  });

  it("promotion is described", () => {
    const e = gloss("8/P7/4k3/8/8/8/8/6K1 w - - 0 1", "a7a8q");
    expect(e?.san).toBe("a8=Q");
    expect(e?.gloss).toContain("promoting to a queen");
  });
});

describe("buildExplainPayload — from a MoveFact", () => {
  const baseFact: MoveFact = {
    ply: 0,
    moveNumber: 1,
    color: "w",
    san: "e4",
    uci: "e2e4",
    fenBefore: START,
    fenAfter: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1",
    evalBefore: cp(20),
    evalAfter: cp(30),
    classification: { quality: "good", winBefore: 51, winAfter: 52, winDrop: 0 } as Classification,
    quality: "good",
    bestSan: "e4",
    bestUci: "e2e4",
    pvSan: ["e4", "e5", "Nf3"],
  };

  it("projects the played move, verdict and evals", () => {
    const p = buildExplainPayload({ fact: baseFact, history: ["e4"], playerColor: "w" });
    expect(p.surface).toBe("explain");
    expect(p.played?.san).toBe("e4");
    expect(p.played?.gloss).toBe("pawn to e4");
    expect(p.quality).toBe("good");
    expect(p.qualityLabel).toBe("Good");
    expect(p.evalText).toBe("+0.2");
    expect(p.evalAfterText).toBe("+0.3");
    expect(p.pv.map((e) => e.san)).toEqual(["e4", "e5", "Nf3"]);
    expect(p.winDrop).toBe(0);
  });

  it("assesses a winning position from each side's perspective", () => {
    const blunder: MoveFact = {
      ...baseFact,
      evalBefore: cp(600),
      quality: "blunder",
      classification: { quality: "blunder", winBefore: 90, winAfter: 40, winDrop: 50 } as Classification,
    };
    expect(buildExplainPayload({ fact: blunder, history: ["e4"], playerColor: "w" }).assessment).toBe(
      "you're winning comfortably",
    );
    expect(buildExplainPayload({ fact: blunder, history: ["e4"], playerColor: "b" }).assessment).toBe(
      "you're in serious trouble",
    );
    expect(buildExplainPayload({ fact: blunder, history: ["e4"], playerColor: "w" }).winDrop).toBe(50);
  });
});
