import type { TableSpec } from "../table/spec";
import { ROOM_ID, type ServerMessage } from "./protocol";

export function relayUrl(): string {
  const configured = process.env.NEXT_PUBLIC_CHESS_RELAY_URL;
  if (configured) {
    const url = new URL(configured);
    if (!["ws:", "wss:"].includes(url.protocol) || (location.protocol === "https:" && url.protocol !== "wss:")) {
      throw new Error("Online play needs a secure game-service connection.");
    }
    return url.href;
  }
  if (["localhost", "127.0.0.1"].includes(location.hostname)) return `ws://${location.hostname}:8787/socket`;
  throw new Error("Online play isn't available on this site yet. You can still play on one device.");
}

const key = (roomId: string) => `chess-online:v1:${roomId}`;

/** Each room has a private player key. It never appears in the shareable URL. */
export function playerToken(roomId: string): string {
  const saved = localStorage.getItem(key(roomId));
  if (saved) return saved;
  const token = crypto.randomUUID();
  localStorage.setItem(key(roomId), token);
  return token;
}

export function createOnlineRoom(table: TableSpec | null): Promise<string> {
  // Check storage BEFORE reserving a seat; refresh recovery depends on it.
  const probe = "chess-online:storage-check";
  localStorage.setItem(probe, "1");
  localStorage.removeItem(probe);
  const token = crypto.randomUUID();
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(relayUrl());
    let settled = false;
    const finish = (error?: Error, id?: string) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      socket.close();
      if (error) reject(error); else resolve(id!);
    };
    const timeout = setTimeout(() => finish(new Error("Couldn't reach online play. Please try again.")), 10_000);
    socket.onopen = () => socket.send(JSON.stringify({ type: "create", token, table }));
    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as ServerMessage;
        if (message.type === "error") finish(new Error(message.message));
        if (message.type === "created" && ROOM_ID.test(message.roomId)) {
          localStorage.setItem(key(message.roomId), token);
          finish(undefined, message.roomId);
        }
      } catch { finish(new Error("Couldn't save your seat. Allow browser storage and try again.")); }
    };
    socket.onerror = () => finish(new Error("Couldn't reach online play. Please try again."));
    socket.onclose = () => finish(new Error("The connection closed. Please try again."));
  });
}
