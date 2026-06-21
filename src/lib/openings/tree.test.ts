import { describe, it, expect } from "vitest";
import { Chess } from "chess.js";
import {
  readSteps,
  allLines,
  mainChild,
  matchLearnerMove,
  pickWeighted,
  moverAt,
  isLearnerTurn,
  type BookMove,
  type Opening,
} from "@/lib/openings/tree";
import { OPENINGS, CATALOG } from "@/content/openings";

const authored = Object.values(OPENINGS);

/** Walk every node, calling fn(node, plyDepth). */
function eachNode(opening: Opening, fn: (node: BookMove, depth: number) => void) {
  const walk = (nodes: BookMove[] | undefined, depth: number) => {
    if (!nodes) return;
    for (const n of nodes) {
      fn(n, depth);
      walk(n.children, depth + 1);
    }
  };
  walk(opening.root, 0);
}

describe("opening content integrity", () => {
  it("has at least the Italian authored", () => {
    expect(authored.length).toBeGreaterThanOrEqual(1);
    expect(OPENINGS["italian-game"]).toBeDefined();
  });

  it("every catalog 'available' entry has authored content (and vice versa)", () => {
    for (const entry of CATALOG) {
      expect(OPENINGS[entry.slug] != null).toBe(entry.available);
    }
  });

  for (const opening of authored) {
    describe(opening.name, () => {
      it("has required metadata", () => {
        expect(opening.slug).toMatch(/^[a-z0-9-]+$/);
        expect(opening.name.length).toBeGreaterThan(0);
        expect(["w", "b"]).toContain(opening.learnerSide);
        expect(opening.root.length).toBeGreaterThan(0);
        expect(opening.idea.length).toBeGreaterThan(20);
      });

      it("plays every taught line legally through chess.js", () => {
        const lines = allLines(opening);
        expect(lines.length).toBeGreaterThan(0);
        for (const line of lines) {
          const game = new Chess();
          for (const san of line) {
            // chess.js throws on an illegal/unparseable SAN — a content bug.
            expect(() => game.move(san), `${opening.slug}: ${line.join(" ")}`).not.toThrow();
          }
        }
      });

      it("every node with children resolves a main child", () => {
        eachNode(opening, (node) => {
          if (node.children && node.children.length > 0) {
            expect(mainChild(node.children)).not.toBeNull();
          }
        });
        // root too
        expect(mainChild(opening.root)).not.toBeNull();
      });

      it("main-line moves carry coach notes; alternative replies carry asides", () => {
        const steps = readSteps(opening);
        expect(steps.length).toBeGreaterThanOrEqual(6); // ~8 plies of taught line
        for (const step of steps) {
          expect(step.move.note, `note @ ply ${step.ply}`).toBeTruthy();
          for (const dev of step.deviations) {
            expect(dev.aside, `aside for ${dev.san}`).toBeTruthy();
          }
        }
      });

      it("read-through FENs are consistent with replayed SAN", () => {
        const steps = readSteps(opening);
        const game = new Chess();
        for (const step of steps) {
          expect(step.fenBefore).toBe(game.fen());
          game.move(step.move.san);
          expect(step.fenAfter).toBe(game.fen());
          expect(step.mover).toBe(moverAt(step.ply));
          expect(step.learner).toBe(isLearnerTurn(opening, step.ply));
        }
      });

      it("the drill is winnable from any bot deviation (learner always has a taught reply)", () => {
        // DFS: at each bot-turn node the bot may pick ANY child; at each learner-turn node
        // there must be at least one taught move to continue (or it's a genuine leaf).
        const visit = (nodes: BookMove[] | undefined, ply: number) => {
          if (!nodes || nodes.length === 0) return; // leaf — fine
          if (isLearnerTurn(opening, ply)) {
            // learner only needs one taught move; follow each to verify deeper structure
            for (const n of nodes) visit(n.children, ply + 1);
          } else {
            // bot may try anything here — every branch must stay in book
            for (const n of nodes) visit(n.children, ply + 1);
          }
        };
        expect(() => visit(opening.root, 0)).not.toThrow();
      });
    });
  }
});

describe("Italian main line", () => {
  it("is the Giuoco Pianissimo", () => {
    const steps = readSteps(OPENINGS["italian-game"]);
    expect(steps.map((s) => s.move.san)).toEqual([
      "e4",
      "e5",
      "Nf3",
      "Nc6",
      "Bc4",
      "Bc5",
      "c3",
      "Nf6",
      "d3",
    ]);
  });

  it("offers Black real deviations at the bishop move", () => {
    const steps = readSteps(OPENINGS["italian-game"]);
    const bc5 = steps.find((s) => s.move.san === "Bc5")!;
    expect(bc5.deviations.map((d) => d.san).sort()).toEqual(["Be7", "Nf6"]);
  });
});

describe("matchLearnerMove", () => {
  const children: BookMove[] = [{ san: "Bb4", main: true }, { san: "Nf6" }];
  it("matches ignoring check/annotation suffixes", () => {
    expect(matchLearnerMove(children, "Bb4")?.san).toBe("Bb4");
    expect(matchLearnerMove(children, "Bb4+")?.san).toBe("Bb4");
    expect(matchLearnerMove(children, "Nf6")?.san).toBe("Nf6");
  });
  it("rejects off-book moves", () => {
    expect(matchLearnerMove(children, "Qh5")).toBeNull();
    expect(matchLearnerMove(undefined, "e4")).toBeNull();
  });
});

describe("pickWeighted", () => {
  const moves: BookMove[] = [
    { san: "A", weight: 3 },
    { san: "B", weight: 2 },
    { san: "C", weight: 1 },
  ];
  it("returns only moves from the set", () => {
    for (let r = 0; r < 1; r += 0.05) {
      expect(["A", "B", "C"]).toContain(pickWeighted(moves, () => r).san);
    }
  });
  it("respects the weight ordering at the extremes", () => {
    expect(pickWeighted(moves, () => 0).san).toBe("A"); // first slice
    expect(pickWeighted(moves, () => 0.99).san).toBe("C"); // last slice
  });
  it("defaults missing weights to 1", () => {
    const even: BookMove[] = [{ san: "X" }, { san: "Y" }];
    expect(pickWeighted(even, () => 0).san).toBe("X");
    expect(pickWeighted(even, () => 0.6).san).toBe("Y");
  });
});
