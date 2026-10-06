import { describe, it, expect } from "vitest";
import { Chess } from "chess.js";
import { existsSync, readFileSync } from "node:fs";
import { OPENINGS, getOpening } from "@/content/openings";
import { getCourse } from "@/content/opening-lessons";
import {
  acceptsMove,
  learnerTurn,
  matchingLines,
  positionAt,
  resolveAttempt,
} from "./lessons";
import {
  EMPTY_PROGRESS,
  parseProgress,
  pickMixedLine,
  progressId,
} from "./lesson-progress";

describe("complete opening lesson catalogue", () => {
  it("retains all fifteen openings and expands them to 46 lessons", () => {
    expect(Object.keys(OPENINGS)).toHaveLength(15);
    expect(
      Object.keys(OPENINGS).reduce(
        (n, slug) => n + getCourse(slug)!.lessons.length,
        0,
      ),
    ).toBe(46);
  });
  for (const [slug, opening] of Object.entries(OPENINGS))
    describe(slug, () => {
      const course = getCourse(slug)!;
      it("has complete history, sources, a real credited image and at least three distinct lessons", () => {
        expect(course.lessons.length).toBeGreaterThanOrEqual(3);
        expect(new Set(course.lessons.map((l) => l.id)).size).toBe(
          course.lessons.length,
        );
        expect(new Set(course.lessons.map((l) => l.moves.join(" "))).size).toBe(
          course.lessons.length,
        );
        expect(course.history.text.length).toBeGreaterThan(80);
        expect(course.history.source).toMatch(/^https:\/\//);
        expect(course.history.image.licence).toBeTruthy();
        expect(course.history.image.credit).toBeTruthy();
        expect(existsSync("public" + course.history.image.src)).toBe(true);
      });
      for (const line of course.lessons)
        it(`${line.name}: legal, explained, both sides taught, extra learner move`, () => {
          expect(line.moves.length).toBeGreaterThanOrEqual(12);
          expect(line.notes).toHaveLength(line.moves.length);
          expect(line.notes.every((note) => note.length > 15)).toBe(true);
          const game = new Chess();
          line.moves.forEach((san, ply) => {
            expect(game.move(san).san).toBe(san);
            expect(acceptsMove(line, ply, san)).toBe(true);
          });
          expect(game.turn()).toBe(opening.learnerSide);
          expect(learnerTurn(opening.learnerSide, line.moves.length)).toBe(
            true,
          );
          expect(line.challenge.answers.length).toBeGreaterThan(0);
          for (const san of line.challenge.answers) {
            const move = new Chess(game.fen()).move(san);
            expect(move.color).toBe(opening.learnerSide);
            expect(move.san).toBe(san);
            expect(acceptsMove(line, line.moves.length, move.san)).toBe(true);
          }
          expect(positionAt(line.moves, line.moves.length).fen).toBe(
            game.fen(),
          );
          expect(acceptsMove(line, line.moves.length, "not a move")).toBe(
            false,
          );
        });
      it("replays the complete sourced historical game, with valid highlight positions", () => {
        const game = new Chess();
        game.loadPgn(course.game.pgn);
        const moves = game.history();
        expect(moves.length).toBeGreaterThan(30);
        expect(game.getHeaders().Result).toBe(course.game.result);
        expect(course.game.source).toMatch(/^https:\/\//);
        expect(course.game.intro.length).toBeGreaterThan(20);
        for (const [ply, note] of Object.entries(course.game.notes)) {
          expect(Number(ply)).toBeGreaterThan(0);
          expect(Number(ply)).toBeLessThanOrEqual(moves.length);
          expect(note).toBeTruthy();
        }
      });
    });
  it("rejects illegal board moves and recognises castling using legal SAN", () => {
    expect(
      resolveAttempt(new Chess().fen(), { from: "e2", to: "e5" }),
    ).toBeNull();
    const line = getCourse("italian-game")!.lessons[0];
    expect(
      resolveAttempt(positionAt(line.moves, 10).fen, { from: "e1", to: "g1" })
        ?.san,
    ).toBe("O-O");
  });
  it("finds authored alternatives only when the played prefix matches", () => {
    const lines = getCourse("italian-game")!.lessons;
    const prefix = lines[0].moves.slice(0, 5);
    expect(matchingLines(lines, prefix, "Nf6").map((l) => l.id)).toEqual([
      "two-knights",
    ]);
    expect(matchingLines(lines, ["d4"], "Nf6")).toEqual([]);
  });
  it("keeps accepted final answers within the offline engine review tolerance", () => {
    const checks = JSON.parse(
      readFileSync("src/content/opening-lessons/challenge-checks.json", "utf8"),
    );
    expect(checks.depth).toBeGreaterThanOrEqual(16);
    for (const slug of Object.keys(OPENINGS))
      for (const line of getCourse(slug)!.lessons) {
        const record = checks.results.find(
          (r: { slug: string; line: string }) =>
            r.slug === slug && r.line === line.id,
        );
        expect(record, `${slug}/${line.id} missing review`).toBeTruthy();
        expect(record.moves).toEqual(line.moves);
        for (const san of line.challenge.answers) {
          const answer = record.answers.find(
            (a: { san: string }) => a.san === san,
          );
          expect(answer, `${slug}/${line.id}/${san} unreviewed`).toBeTruthy();
          expect(answer.lossCp).not.toBeNull();
          expect(answer.lossCp).toBeLessThanOrEqual(60);
        }
      }
  });
});

describe("lesson progress and mixed practice", () => {
  const lines = getCourse("italian-game")!.lessons;
  it("ignores corrupt or incompatible stored progress", () => {
    expect(parseProgress("broken")).toEqual({});
    expect(parseProgress("[]")).toEqual({});
    expect(
      parseProgress(
        '{"x":{"studied":true,"assisted":-1,"clean":0,"attempts":0}}',
      ),
    ).toEqual({});
  });
  it("versions progress, preserves assisted/clean counts and only mixes studied lines", () => {
    const progress = Object.fromEntries(
      lines
        .slice(0, 3)
        .map((line, i) => [
          progressId(line),
          {
            ...EMPTY_PROGRESS,
            studied: true,
            assisted: 1,
            clean: 2,
            attempts: i,
          },
        ]),
    );
    expect(parseProgress(JSON.stringify(progress))).toEqual(progress);
    expect(pickMixedLine(lines, progress, lines[0].id, () => 0)?.id).toBe(
      lines[1].id,
    );
    expect(pickMixedLine(lines, {}, lines[0].id)).toBeNull();
    expect(
      pickMixedLine(
        lines,
        { [progressId(lines[0])]: progress[progressId(lines[0])] },
        lines[0].id,
      ),
    ).toBeNull();
    const updated = { ...lines[0], version: 2 };
    expect(pickMixedLine([updated, lines[1]], progress, "")).toBeNull();
    expect(getOpening("french-defense")?.learnerSide).toBe("b");
  });
});
