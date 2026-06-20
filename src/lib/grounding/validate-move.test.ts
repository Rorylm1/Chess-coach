import { describe, it, expect } from "vitest";
import { validateMove } from "@/lib/grounding/validate-move";

const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const PROMO = "8/P7/4k3/8/8/8/8/6K1 w - - 0 1"; // White pawn on a7; a8=Q is not check here
const CASTLE = "r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1";

describe("validateMove — legal moves", () => {
  it("accepts SAN and returns canonical SAN + UCI", () => {
    const v = validateMove(START, "e4");
    expect(v.legal).toBe(true);
    expect(v.san).toBe("e4");
    expect(v.uci).toBe("e2e4");
  });

  it("accepts UCI and returns canonical SAN", () => {
    const v = validateMove(START, "g1f3");
    expect(v.legal).toBe(true);
    expect(v.san).toBe("Nf3");
    expect(v.uci).toBe("g1f3");
  });

  it("accepts a piece-move SAN", () => {
    expect(validateMove(START, "Nf3").uci).toBe("g1f3");
  });

  it("tolerates the annotations an LLM appends", () => {
    expect(validateMove(START, "Nf3!").san).toBe("Nf3");
    expect(validateMove(START, "e4??").san).toBe("e4");
  });

  it("handles promotion in both notations", () => {
    expect(validateMove(PROMO, "a8=Q").uci).toBe("a7a8q");
    expect(validateMove(PROMO, "a7a8q").san).toBe("a8=Q");
  });

  it("handles castling, including the 0-0 typo", () => {
    expect(validateMove(CASTLE, "O-O").uci).toBe("e1g1");
    expect(validateMove(CASTLE, "0-0-0").uci).toBe("e1c1");
  });
});

describe("validateMove — rejects illegal / nonsense (the anti-hallucination gate)", () => {
  it("rejects a geometrically impossible move", () => {
    const v = validateMove(START, "e5"); // a pawn on e2 cannot reach e5
    expect(v.legal).toBe(false);
    expect(v.san).toBeNull();
    expect(v.reason).toBeTruthy();
  });

  it("rejects a move for a piece that cannot move yet", () => {
    expect(validateMove(START, "Ke2").legal).toBe(false);
  });

  it("rejects pure gibberish", () => {
    expect(validateMove(START, "banana").legal).toBe(false);
    expect(validateMove(START, "").legal).toBe(false);
  });

  it("rejects an illegal UCI string", () => {
    expect(validateMove(START, "e2e9").legal).toBe(false);
  });

  it("reports invalid FEN rather than throwing", () => {
    expect(validateMove("not a fen", "e4").legal).toBe(false);
  });
});

describe("validateMove — PV membership", () => {
  const pvUci = ["e2e4", "e7e5", "g1f3"];

  it("marks the engine's top move as best and in-PV", () => {
    const v = validateMove(START, "e4", { pvUci });
    expect(v.isBest).toBe(true);
    expect(v.inPv).toBe(true);
  });

  it("marks a legal-but-not-recommended move as not best / not in PV", () => {
    const v = validateMove(START, "d4", { pvUci });
    expect(v.legal).toBe(true);
    expect(v.isBest).toBe(false);
    expect(v.inPv).toBe(false);
  });

  it("treats a deeper PV move as in-PV but not best", () => {
    // g1f3 is the engine's 3rd PV move; legal from the start, in the line, not the top pick.
    const v = validateMove(START, "Nf3", { pvUci });
    expect(v.inPv).toBe(true);
    expect(v.isBest).toBe(false);
  });
});
