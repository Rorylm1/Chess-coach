import { randomUUID } from "node:crypto";
import type { AddressInfo } from "node:net";
import { WebSocket } from "ws";
import { afterEach, describe, expect, it } from "vitest";
import { createRelay } from "./server";
import type { ClientMessage, RoomSnapshot, ServerMessage } from "./protocol";

const ORIGIN = "http://localhost:3000";
const cleanup: Array<() => Promise<void>> = [];
afterEach(async () => { for (const close of cleanup.splice(0).reverse()) await close(); });

async function relay() {
  const app = createRelay({ origins: [ORIGIN] });
  await new Promise<void>((resolve) => app.server.listen(0, "127.0.0.1", resolve));
  cleanup.push(app.close);
  return `ws://127.0.0.1:${(app.server.address() as AddressInfo).port}/socket`;
}

async function client(url: string) {
  const ws = new WebSocket(url, { origin: ORIGIN });
  const queue: ServerMessage[] = [];
  let notify: (() => void) | undefined;
  ws.on("message", (data) => { queue.push(JSON.parse(data.toString())); notify?.(); });
  await new Promise<void>((resolve, reject) => { ws.once("open", resolve); ws.once("error", reject); });
  const next = (predicate: (message: ServerMessage) => boolean) => new Promise<ServerMessage>((resolve, reject) => {
    const timeout = setTimeout(() => { notify = undefined; reject(new Error("Timed out waiting for game message")); }, 2500);
    const read = () => {
      const index = queue.findIndex(predicate);
      if (index < 0) return;
      const message = queue.splice(index, 1)[0];
      clearTimeout(timeout); notify = undefined; resolve(message);
    };
    notify = read; read();
  });
  return {
    ws, next,
    send: (message: ClientMessage) => ws.send(JSON.stringify(message)),
    state: async (predicate: (room: RoomSnapshot) => boolean) => {
      const msg = await next((m) => m.type === "state" && predicate(m.room));
      if (msg.type !== "state") throw new Error("Expected state");
      return msg;
    },
    close: () => new Promise<void>((resolve) => { ws.once("close", () => resolve()); ws.close(); }),
  };
}

describe("real WebSocket transport", () => {
  it("plays across two clients, broadcasts presence, restores refresh and completes checkmate", async () => {
    const url = await relay();
    const host = await client(url), white = randomUUID(), black = randomUUID();
    host.send({ type: "create", token: white, table: null });
    const created = await host.next((m) => m.type === "created");
    if (created.type !== "created") throw new Error();
    const roomId = created.roomId;
    const friend = await client(url);
    friend.send({ type: "enter", token: black, roomId });
    expect((await friend.state((r) => !r.joined)).color).toBeNull();
    friend.send({ type: "claim" });
    expect((await friend.state((r) => r.joined)).color).toBe("b");
    expect((await host.state((r) => r.joined)).room.presence).toEqual({ w: true, b: true });
    friend.send({ type: "move", from: "e7", to: "e5", ply: 0 });
    expect(await friend.next((m) => m.type === "error")).toMatchObject({ code: "turn", fatal: false });
    host.send({ type: "move", from: "f2", to: "f3", ply: 0 });
    const position = (await friend.state((r) => r.history.length === 1)).room.fen;
    await friend.close();
    await host.state((r) => r.joined && !r.presence.b);
    const refreshed = await client(url);
    refreshed.send({ type: "enter", token: black, roomId });
    expect((await refreshed.state((r) => r.history.length === 1)).room.fen).toBe(position);
    refreshed.send({ type: "move", from: "e7", to: "e5", ply: 1 });
    await host.state((r) => r.history.length === 2);
    host.send({ type: "move", from: "g2", to: "g4", ply: 2 });
    await refreshed.state((r) => r.history.length === 3);
    refreshed.send({ type: "move", from: "d8", to: "h4", ply: 3 });
    const finished = await host.state((r) => !!r.result);
    expect(finished.room.result).toMatchObject({ title: "Checkmate", winner: "b" });
    expect((await refreshed.state((r) => !!r.result)).room.fen).toBe(finished.room.fen);
    const intruder = await client(url);
    intruder.send({ type: "enter", token: randomUUID(), roomId });
    expect(await intruder.next((m) => m.type === "error")).toMatchObject({ code: "full", fatal: true });
  });

  it("rejects a foreign browser origin before upgrading", async () => {
    const url = await relay();
    const status = await new Promise<number>((resolve, reject) => {
      const ws = new WebSocket(url, { origin: "https://untrusted.example" });
      ws.on("unexpected-response", (_, response) => { response.resume(); ws.terminate(); resolve(response.statusCode!); });
      ws.on("error", reject);
    });
    expect(status).toBe(403);
  });

  it("handles malformed JSON and anonymous actions without killing the service", async () => {
    const url = await relay();
    const malformed = await client(url);
    malformed.ws.send("{");
    expect(await malformed.next((m) => m.type === "error")).toMatchObject({ code: "invalid", fatal: true });
    const anonymous = await client(url);
    anonymous.send({ type: "resign" });
    expect(await anonymous.next((m) => m.type === "error")).toMatchObject({ code: "not-attached", fatal: true });
    const valid = await client(url);
    valid.send({ type: "create", token: randomUUID(), table: null });
    expect(await valid.next((m) => m.type === "created")).toHaveProperty("roomId");
  });
});
