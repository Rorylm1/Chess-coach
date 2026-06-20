import { describe, it, expect } from "vitest";
import { classify } from "@/lib/classify";
import { whiteWinPct, type Eval } from "@/lib/engine/analysis";

const cp = (n: number): Eval => ({ cp: n, mate: null });
const mate = (n: number): Eval => ({ cp: null, mate: n });

describe("whiteWinPct", () => {
  it("is 50% at a dead-level position", () => {
    expect(whiteWinPct(cp(0))).toBeCloseTo(50, 5);
  });

  it("favours White for positive cp and Black for negative", () => {
    expect(whiteWinPct(cp(300))).toBeGreaterThan(65);
    expect(whiteWinPct(cp(-300))).toBeLessThan(35);
  });

  it("pins forced mates to 0 / 100", () => {
    expect(whiteWinPct(mate(3))).toBe(100);
    expect(whiteWinPct(mate(-2))).toBe(0);
  });

  it("is monotonic in cp", () => {
    expect(whiteWinPct(cp(100))).toBeGreaterThan(whiteWinPct(cp(0)));
    expect(whiteWinPct(cp(500))).toBeGreaterThan(whiteWinPct(cp(100)));
  });
});

describe("classify — error tiers (White to move)", () => {
  it("flags a hung queen as a blunder", () => {
    const c = classify({ evalBefore: cp(0), evalAfter: cp(-900), mover: "w", isBest: false });
    expect(c.quality).toBe("blunder");
    expect(c.winDrop).toBeGreaterThanOrEqual(30);
  });

  it("flags a ~26% swing as a mistake", () => {
    const c = classify({ evalBefore: cp(50), evalAfter: cp(-250), mover: "w", isBest: false });
    expect(c.quality).toBe("mistake");
    expect(c.winDrop).toBeGreaterThanOrEqual(20);
    expect(c.winDrop).toBeLessThan(30);
  });

  it("flags a ~13% swing as an inaccuracy", () => {
    const c = classify({ evalBefore: cp(0), evalAfter: cp(-150), mover: "w", isBest: false });
    expect(c.quality).toBe("inaccuracy");
    expect(c.winDrop).toBeGreaterThanOrEqual(10);
    expect(c.winDrop).toBeLessThan(20);
  });
});

describe("classify — good / best", () => {
  it("labels a near-equal move 'best' when it matches the engine", () => {
    const c = classify({ evalBefore: cp(0), evalAfter: cp(-20), mover: "w", isBest: true });
    expect(c.quality).toBe("best");
  });

  it("labels a near-equal non-engine move 'good'", () => {
    const c = classify({ evalBefore: cp(0), evalAfter: cp(-20), mover: "w", isBest: false });
    expect(c.quality).toBe("good");
  });

  it("never reports a negative win drop (search-horizon noise is clamped at 0)", () => {
    const c = classify({ evalBefore: cp(0), evalAfter: cp(40), mover: "w", isBest: true });
    expect(c.winDrop).toBe(0);
  });
});

describe("classify — win-probability beats raw centipawns", () => {
  it("does NOT flag a +12 -> +6 move in a totally won position", () => {
    // A 600cp drop would be a 'blunder' under a naive cp threshold, but both positions
    // are ~95%+ for White, so the real winning-chance cost is tiny.
    const c = classify({ evalBefore: cp(1200), evalAfter: cp(600), mover: "w", isBest: false });
    expect(c.quality).toBe("good");
    expect(c.winDrop).toBeLessThan(10);
  });

  it("does NOT flag giving up some edge while still completely lost", () => {
    const c = classify({ evalBefore: cp(-1200), evalAfter: cp(-2000), mover: "w", isBest: false });
    expect(["good", "best"]).toContain(c.quality);
  });
});

describe("classify — mover perspective", () => {
  it("handles Black hanging a queen symmetrically", () => {
    // Black to move; after the move White is +9. From Black's POV that's a blunder.
    const c = classify({ evalBefore: cp(0), evalAfter: cp(900), mover: "b", isBest: false });
    expect(c.quality).toBe("blunder");
  });

  it("does not punish Black for a move that helps Black", () => {
    const c = classify({ evalBefore: cp(0), evalAfter: cp(-300), mover: "b", isBest: false });
    expect(c.winDrop).toBe(0);
    expect(c.quality).toBe("good");
  });
});
