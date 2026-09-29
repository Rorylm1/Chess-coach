import { createServer } from "node:http";
import { WebSocket, WebSocketServer } from "ws";
import { Rooms, RoomError, requireToken } from "./rooms";
import type { ServerMessage } from "./protocol";

type Peer = { roomId: string | null; token: string | null; alive: boolean; count: number; since: number };

/** A standalone WebSocket service; deploy one process behind a TLS reverse proxy. */
export function createRelay(options: { origins: string[]; rooms?: Rooms; trustProxy?: boolean }) {
  const rooms = options.rooms ?? new Rooms();
  const peers = new Map<WebSocket, Peer>();
  const limits = new Map<string, { connections: number; creates: number; since: number; upgrades: number }>();
  const allowed = new Set(options.origins);
  const server = createServer((req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Content-Type", "application/json");
    res.writeHead(req.url === "/health" ? 200 : 404);
    res.end(JSON.stringify(req.url === "/health" ? { ok: true } : { error: "Not found" }));
  });
  const wss = new WebSocketServer({ noServer: true, maxPayload: 16 * 1024, perMessageDeflate: false });

  const send = (ws: WebSocket, message: ServerMessage) => {
    if (ws.readyState !== WebSocket.OPEN) return;
    if (ws.bufferedAmount > 256 * 1024) { ws.terminate(); return; }
    ws.send(JSON.stringify(message));
  };
  const fail = (ws: WebSocket, error: RoomError) => {
    send(ws, { type: "error", code: error.code, message: error.message, fatal: error.fatal });
    if (error.fatal) ws.close(1008, error.code);
  };
  const broadcast = (roomId: string) => {
    const members = [...peers].filter(([ws, peer]) => peer.roomId === roomId && ws.readyState === WebSocket.OPEN);
    const presence = { w: false, b: false };
    try {
      for (const [, peer] of members) {
        const color = rooms.color(roomId, peer.token!);
        if (color) presence[color] = true;
      }
      const room = rooms.snapshot(roomId, presence);
      for (const [ws, peer] of members) {
        const color = rooms.color(roomId, peer.token!);
        if (!color && room.joined) fail(ws, new RoomError("full", "Both seats are taken. Ask your friend for a new invite.", true));
        else send(ws, { type: "state", room, color });
      }
    } catch (error) {
      for (const [ws] of members) fail(ws, error instanceof RoomError ? error : new RoomError("unavailable", "The game is unavailable.", true));
    }
  };

  server.on("upgrade", (req, socket, head) => {
    socket.on("error", () => socket.destroy());
    const reject = (status: number) => { socket.end(`HTTP/1.1 ${status} Rejected\r\nConnection: close\r\n\r\n`); };
    if (req.url !== "/socket" || !req.headers.origin || !allowed.has(req.headers.origin)) { reject(403); return; }
    // Only trust X-Forwarded-For when a configured reverse proxy is the sole ingress.
    const forwarded = req.headers["x-forwarded-for"];
    const ip = options.trustProxy && typeof forwarded === "string"
      ? forwarded.split(",").at(-1)!.trim() : req.socket.remoteAddress ?? "unknown";
    const now = Date.now();
    let limit = limits.get(ip);
    if (!limit) {
      if (limits.size >= 5000) { reject(503); return; }
      limit = { connections: 0, creates: 0, since: now, upgrades: 0 };
      limits.set(ip, limit);
    }
    if (now - limit.since > 3_600_000) Object.assign(limit, { creates: 0, upgrades: 0, since: now });
    if (peers.size >= 1000 || limit.connections >= 20 || ++limit.upgrades > 600) { reject(429); return; }
    const rate = limit;
    wss.handleUpgrade(req, socket, head, (ws) => {
      rate.connections++;
      const peer: Peer = { roomId: null, token: null, alive: true, count: 0, since: now };
      peers.set(ws, peer);
      const helloTimeout = setTimeout(() => { if (!peer.roomId) ws.close(1008, "idle"); }, 10_000);
      ws.on("error", () => ws.terminate());
      ws.on("pong", () => { peer.alive = true; });
      ws.on("close", () => {
        clearTimeout(helloTimeout);
        peers.delete(ws);
        rate.connections--;
        if (peer.roomId) broadcast(peer.roomId);
      });
      ws.on("message", (data, binary) => {
        try {
          if (Date.now() - peer.since > 10_000) { peer.count = 0; peer.since = Date.now(); }
          if (++peer.count > 40) throw new RoomError("rate", "Too many actions. Please reconnect in a moment.", true);
          if (binary) throw new RoomError("invalid", "Only text messages are supported.", true);
          let msg: Record<string, unknown>;
          try {
            const value = JSON.parse(data.toString());
            if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error();
            msg = value;
          } catch { throw new RoomError("invalid", "Invalid game message.", true); }
          if (msg.type === "create" || msg.type === "enter") {
            if (peer.roomId) throw new RoomError("attached", "This connection already belongs to a game.");
            const token = requireToken(msg.token);
            if (msg.type === "create") {
              if (++rate.creates > 10) throw new RoomError("rate", "You've created several games. Please try again in an hour.", true);
              const roomId = rooms.create(token, msg.table);
              peer.roomId = roomId; peer.token = token;
              send(ws, { type: "created", roomId });
            } else {
              if (typeof msg.roomId !== "string") throw new RoomError("invalid", "Invalid invite.", true);
              rooms.enter(msg.roomId, token);
              if ([...peers.values()].filter((p) => p.roomId === msg.roomId).length >= 8) {
                throw new RoomError("connections", "Too many tabs are open for this game. Close an older tab and retry.", true);
              }
              peer.roomId = msg.roomId; peer.token = token;
            }
          } else {
            if (!peer.roomId || !peer.token) throw new RoomError("not-attached", "Open an invite first.", true);
            rooms.command(peer.roomId, peer.token, msg);
          }
          broadcast(peer.roomId!);
        } catch (error) {
          fail(ws, error instanceof RoomError ? error : new RoomError("internal", "Couldn't complete that action. Please reconnect.", true));
          if (peer.roomId && ws.readyState === WebSocket.OPEN) broadcast(peer.roomId);
        }
      });
    });
  });

  const heartbeat = setInterval(() => {
    for (const [ws, peer] of peers) {
      if (!peer.alive) { ws.terminate(); continue; }
      peer.alive = false;
      ws.ping();
    }
    for (const id of rooms.sweep()) broadcast(id);
    for (const [ip, limit] of limits) if (!limit.connections && Date.now() - limit.since > 3_600_000) limits.delete(ip);
  }, 15_000);
  heartbeat.unref();
  return {
    server,
    close: () => new Promise<void>((resolve, reject) => {
      clearInterval(heartbeat);
      for (const ws of peers.keys()) ws.terminate();
      wss.close();
      server.close((error) => error ? reject(error) : resolve());
    }),
  };
}
