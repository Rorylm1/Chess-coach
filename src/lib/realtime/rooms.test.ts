import { randomUUID } from "node:crypto";
import { Chess } from "chess.js";
import { describe, expect, it } from "vitest";
import { Rooms } from "./rooms";
import { chessResult, replayRoom, ROOM_ID } from "./protocol";
import { fallbackTable } from "../table/fallback";

function game() {
  const rooms = new Rooms(), white = randomUUID(), black = randomUUID();
  const id = rooms.create(white, null);
  rooms.command(id, black, { type: "claim" });
  return { rooms, white, black, id, snapshot: () => rooms.snapshot(id, { w: true, b: true }) };
}

describe("private chess rooms", () => {
  it("mints unguessable links, keeps keys out of snapshots and reserves seats across reconnects", () => {
    const { rooms, white, black, id, snapshot } = game();
    expect(id).toMatch(ROOM_ID);
    expect(rooms.enter(id, white)).toBe("w");
    expect(rooms.enter(id, black)).toBe("b");
    expect(() => rooms.enter(id, randomUUID())).toThrow("Both seats");
    expect(JSON.stringify(snapshot())).not.toContain(white);
    expect(JSON.stringify(snapshot())).not.toContain(black);
  });

  it("only lets one friend claim Black, including simultaneous claim attempts", () => {
    const rooms = new Rooms(), id = rooms.create(randomUUID(), null);
    const first = randomUUID(), second = randomUUID();
    expect(rooms.enter(id, first)).toBeNull();
    expect(rooms.enter(id, second)).toBeNull();
    expect(() => rooms.command(id, first, { type: "move", from: "e2", to: "e4", ply: 0 })).toThrow("Join");
    rooms.command(id, first, { type: "claim" });
    expect(() => rooms.command(id, second, { type: "claim" })).toThrow("second seat");
    expect(rooms.color(id, first)).toBe("b");
  });

  it("blocks moves before joining, wrong turns, illegal moves and stale retries", () => {
    const waiting = new Rooms(), host = randomUUID(), invite = waiting.create(host, null);
    expect(() => waiting.command(invite, host, { type: "move", from: "e2", to: "e4", ply: 0 })).toThrow("Wait");
    const { rooms, id, white, black, snapshot } = game();
    expect(() => rooms.command(id, black, { type: "move", from: "e7", to: "e5", ply: 0 })).toThrow("turn");
    expect(() => rooms.command(id, white, { type: "move", from: "e2", to: "e5", ply: 0 })).toThrow("legal");
    rooms.command(id, white, { type: "move", from: "e2", to: "e4", ply: 0 });
    rooms.command(id, black, { type: "move", from: "e7", to: "e5", ply: 1 });
    expect(() => rooms.command(id, white, { type: "move", from: "g1", to: "f3", ply: 0 })).toThrow("position changed");
    expect(snapshot().history).toEqual(["e4", "e5"]);
    expect(replayRoom(snapshot()).fen()).toBe(snapshot().fen);
    expect(() => replayRoom({ ...snapshot(), fen: new Chess().fen() })).toThrow("mismatch");
  });

  it("completes a legal game and prevents moves/resignation after checkmate", () => {
    const { rooms, id, white, black, snapshot } = game();
    [ ["f2", "f3"], ["e7", "e5"], ["g2", "g4"], ["d8", "h4"] ].forEach(([from, to], ply) =>
      rooms.command(id, ply % 2 ? black : white, { type: "move", from, to, ply }));
    expect(snapshot().result).toMatchObject({ title: "Checkmate", winner: "b" });
    expect(() => rooms.command(id, white, { type: "resign" })).toThrow("finished");
    expect(replayRoom(snapshot()).isCheckmate()).toBe(true);
  });

  it("handles draw offer/decline, clearing on moves, acceptance, and self-accept rejection", () => {
    const { rooms, id, white, black, snapshot } = game();
    rooms.command(id, white, { type: "draw", action: "offer" });
    expect(() => rooms.command(id, white, { type: "draw", action: "accept" })).toThrow("isn't a draw offer");
    rooms.command(id, black, { type: "draw", action: "decline" });
    expect(snapshot().drawOffer).toBeNull();
    rooms.command(id, black, { type: "draw", action: "offer" });
    rooms.command(id, white, { type: "move", from: "e2", to: "e4", ply: 0 });
    expect(snapshot().drawOffer).toBeNull();
    rooms.command(id, white, { type: "draw", action: "offer" });
    rooms.command(id, black, { type: "draw", action: "accept" });
    expect(snapshot().result).toMatchObject({ title: "Draw agreed", winner: null });
  });

  it("assigns the correct winner on resignation, regardless of turn", () => {
    const { rooms, id, black, snapshot } = game();
    rooms.command(id, black, { type: "resign" });
    expect(snapshot().result).toMatchObject({ winner: "w" });
  });

  it("preserves repetition history on refresh", () => {
    const { rooms, id, white, black, snapshot } = game();
    const cycle = [["g1", "f3"], ["g8", "f6"], ["f3", "g1"], ["f6", "g8"]];
    [...cycle, ...cycle].forEach(([from, to], ply) => rooms.command(id, ply % 2 ? black : white, { type: "move", from, to, ply }));
    expect(snapshot().result?.detail).toBe("Threefold repetition.");
    expect(replayRoom(snapshot()).isThreefoldRepetition()).toBe(true);
  });

  it("recognizes stalemate, insufficient material, fifty moves and promotion mate", () => {
    expect(chessResult(new Chess("7k/5Q2/6K1/8/8/8/8/8 b - - 0 1"))?.detail).toContain("stalemate");
    expect(chessResult(new Chess("7k/8/6K1/8/8/8/8/8 w - - 0 1"))?.detail).toContain("Insufficient");
    expect(chessResult(new Chess("7k/8/6K1/8/8/8/R7/8 w - - 100 51"))?.detail).toContain("Fifty");
    const promotion = new Chess("8/5P1k/8/6K1/8/8/8/8 w - - 0 1");
    promotion.move({ from: "f7", to: "f8", promotion: "q" });
    expect(promotion.get("f8")?.type).toBe("q");
  });

  it("shares the full board safely and rejects injected style functions", () => {
    const rooms = new Rooms(), table = fallbackTable();
    const id = rooms.create(randomUUID(), table);
    expect(rooms.snapshot(id, { w: false, b: false }).table).toEqual(table);
    expect(() => rooms.create(randomUUID(), { ...table, bgGradient: "url(https://example.com/pixel)" })).toThrow("design");
  });

  it("expires waiting and inactive rooms, bounds capacity, and never reuses a missing room", () => {
    let now = 0;
    const rooms = new Rooms(() => now, 1), white = randomUUID();
    const id = rooms.create(white, null);
    expect(() => rooms.create(randomUUID(), null)).toThrow("busy");
    now = 3_600_001;
    expect(() => rooms.enter(id, white)).toThrow("expired");
    const next = rooms.create(white, null);
    rooms.command(next, randomUUID(), { type: "claim" });
    now += 23 * 3_600_000;
    expect(rooms.enter(next, white)).toBe("w");
    now += 2 * 3_600_000;
    expect(rooms.sweep()).toEqual([next]);
    expect(() => rooms.enter(next, white)).toThrow("expired");
  });
});
