/** Ephemeral, single-process room authority. Never imported into the browser bundle. */
import { createHash, randomBytes } from "node:crypto";
import { Chess, type Color } from "chess.js";
import { backstop } from "../table/backstop";
import { parseTable } from "../table/validate";
import type { TableSpec } from "../table/spec";
import { chessResult, colorName, opposite, PLAYER_TOKEN, ROOM_ID, type OnlineResult, type RoomSnapshot } from "./protocol";

const HOUR = 60 * 60 * 1000;
const digest = (token: string) => createHash("sha256").update(token).digest("hex");

export class RoomError extends Error {
  constructor(public code: string, message: string, public fatal = false) { super(message); }
}

export function requireToken(value: unknown): string {
  if (typeof value !== "string" || !PLAYER_TOKEN.test(value)) {
    throw new RoomError("invalid-token", "Your player key is invalid. Open a new invite.", true);
  }
  return value;
}

type Room = {
  id: string;
  game: Chess;
  seats: { w: string; b: string | null };
  table: TableSpec | null;
  drawOffer: Color | null;
  result: OnlineResult | null;
  expiresAt: number;
};

export class Rooms {
  private rooms = new Map<string, Room>();
  constructor(private now = Date.now, private maxRooms = 1000) {}

  create(token: string, table: unknown): string {
    requireToken(token);
    this.sweep();
    if (this.rooms.size >= this.maxRooms) throw new RoomError("capacity", "All tables are busy. Please try again later.");
    let design: TableSpec | null = null;
    if (table != null) {
      try { design = backstop(parseTable(table)); }
      catch { throw new RoomError("invalid-table", "This board design couldn't be shared. Reset the board and try again."); }
    }
    const id = randomBytes(18).toString("base64url");
    this.rooms.set(id, { id, game: new Chess(), seats: { w: digest(token), b: null },
      table: design, drawOffer: null, result: null, expiresAt: this.now() + HOUR });
    return id;
  }

  private get(id: string): Room {
    const room = ROOM_ID.test(id) ? this.rooms.get(id) : undefined;
    if (!room || room.expiresAt <= this.now()) {
      this.rooms.delete(id);
      throw new RoomError("expired", "This invite has expired. Create a new game to play together.", true);
    }
    return room;
  }

  color(id: string, token: string): Color | null {
    const room = this.get(id), hash = digest(requireToken(token));
    return room.seats.w === hash ? "w" : room.seats.b === hash ? "b" : null;
  }

  enter(id: string, token: string): Color | null {
    const color = this.color(id, token);
    if (!color && this.get(id).seats.b) throw new RoomError("full", "Both seats are taken. Reopen this link in the browser you joined with.", true);
    return color;
  }

  command(id: string, token: string, input: Record<string, unknown>): void {
    const room = this.get(id);
    const color = this.color(id, token);
    if (input.type === "claim") {
      if (color) return;
      if (room.seats.b) throw new RoomError("full", "Someone has already taken the second seat.", true);
      room.seats.b = digest(token);
      room.expiresAt = this.now() + 24 * HOUR;
      return;
    }
    if (!color) throw new RoomError("not-player", "Join the game before making a move.");
    if (!room.seats.b) throw new RoomError("waiting", "Wait for your friend to join.");
    if (room.result) throw new RoomError("finished", "This game has finished.");
    switch (input.type) {
      case "move": {
        if (room.game.turn() !== color) throw new RoomError("turn", "It's your friend's turn.");
        if (input.ply !== room.game.history().length) throw new RoomError("stale", "The position changed. Your board has been updated; try your move again.");
        if (typeof input.from !== "string" || typeof input.to !== "string" ||
          !/^[a-h][1-8]$/.test(input.from) || !/^[a-h][1-8]$/.test(input.to) ||
          (input.promotion !== undefined && !["q", "r", "b", "n"].includes(String(input.promotion)))) {
          throw new RoomError("illegal", "That move isn't legal.");
        }
        try { room.game.move({ from: input.from, to: input.to, promotion: input.promotion as string | undefined }); }
        catch { throw new RoomError("illegal", "That move isn't legal."); }
        room.drawOffer = null;
        room.result = chessResult(room.game);
        // Bounded even for contrived games that avoid the repetition/fifty-move rules.
        if (!room.result && room.game.history().length >= 1200) {
          room.result = { title: "Draw", detail: "The room's 600-move limit was reached.", winner: null };
        }
        break;
      }
      case "resign":
        room.result = { title: "Resignation", detail: `${colorName(color)} resigned — ${colorName(opposite(color))} wins.`, winner: opposite(color) };
        room.drawOffer = null;
        break;
      case "draw":
        if (input.action === "offer") {
          if (room.drawOffer) throw new RoomError("draw-pending", "There's already a draw offer to answer.");
          room.drawOffer = color;
        } else if ((input.action === "accept" || input.action === "decline") && room.drawOffer === opposite(color)) {
          if (input.action === "accept") room.result = { title: "Draw agreed", detail: "You both agreed to a draw.", winner: null };
          room.drawOffer = null;
        } else throw new RoomError("no-offer", "There isn't a draw offer from your friend to answer.");
        break;
      default: throw new RoomError("invalid", "Unknown game action.");
    }
    room.expiresAt = this.now() + 24 * HOUR;
  }

  snapshot(id: string, presence: Record<Color, boolean>): RoomSnapshot {
    const room = this.get(id);
    return { id, fen: room.game.fen(), history: room.game.history(), turn: room.game.turn(),
      joined: !!room.seats.b, presence, table: room.table, drawOffer: room.drawOffer,
      result: room.result, expiresAt: room.expiresAt };
  }

  sweep(): string[] {
    const expired: string[] = [];
    for (const [id, room] of this.rooms) if (room.expiresAt <= this.now()) {
      this.rooms.delete(id);
      expired.push(id);
    }
    return expired;
  }
}
