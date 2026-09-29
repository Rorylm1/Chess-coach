"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Chess, type Color } from "chess.js";
import { playerToken, relayUrl } from "@/lib/realtime/client";
import { replayRoom, type GameCommand, type RoomSnapshot, type ServerMessage } from "@/lib/realtime/protocol";
import { parseTable } from "@/lib/table/validate";
import { loadFonts } from "@/components/Play/useGameTable";
import type { AttemptedMove } from "@/components/Board/Board";

type Connection = "connecting" | "connected" | "reconnecting" | "unavailable";

export function useOnlineGame(roomId: string) {
  const [room, setRoom] = useState<RoomSnapshot | null>(null);
  const [color, setColor] = useState<Color | null>(null);
  const [connection, setConnection] = useState<Connection>("connecting");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const busyRef = useRef(false);

  useEffect(() => {
    if (!pending) return;
    // A dropped acknowledgement must never leave the board disabled indefinitely.
    const timeout = setTimeout(() => socketRef.current?.close(), 10_000);
    return () => clearTimeout(timeout);
  }, [pending]);

  useEffect(() => {
    let disposed = false, fatal = false, attempts = 0;
    let retry: ReturnType<typeof setTimeout> | undefined;
    let deadline: ReturnType<typeof setTimeout> | undefined;
    let token: string, url: string;
    try { token = playerToken(roomId); url = relayUrl(); }
    catch (reason) {
      const failure = setTimeout(() => {
        setConnection("unavailable");
        setError(reason instanceof Error ? reason.message : "Allow browser storage to save your seat, then reload.");
      }, 0);
      return () => clearTimeout(failure);
    }
    const connect = () => {
      if (disposed || fatal) return;
      const socket = new WebSocket(url);
      socketRef.current = socket;
      deadline = setTimeout(() => socket.close(), 12_000);
      socket.onopen = () => socket.send(JSON.stringify({ type: "enter", roomId, token }));
      socket.onmessage = (event) => {
        if (disposed || socketRef.current !== socket) return;
        try {
          const message = JSON.parse(event.data) as ServerMessage;
          if (message.type === "error") {
            setError(message.message);
            busyRef.current = false;
            setPending(false);
            if (message.fatal) { fatal = true; setConnection("unavailable"); socket.close(); }
          } else if (message.type === "state") {
            if (message.room.id !== roomId || ![null, "w", "b"].includes(message.color)) throw new Error("Invalid game");
            replayRoom(message.room);
            if (message.room.table) {
              message.room.table = parseTable(message.room.table);
              loadFonts(message.room.table);
            }
            clearTimeout(deadline);
            attempts = 0;
            setRoom(message.room);
            setColor(message.color);
            setConnection("connected");
            busyRef.current = false;
            setPending(false);
          }
        } catch {
          fatal = true;
          setError("The game position couldn't be verified. Reload to reconnect safely.");
          setConnection("unavailable");
          socket.close();
        }
      };
      socket.onerror = () => socket.close();
      socket.onclose = () => {
        clearTimeout(deadline);
        if (disposed || fatal) return;
        busyRef.current = false;
        setPending(false);
        setConnection("reconnecting");
        retry = setTimeout(connect, Math.min(500 * 2 ** attempts++, 10_000));
      };
    };
    connect();
    // Reconnect promptly when a phone tab returns from sleep or connectivity returns.
    const resume = () => {
      if (document.visibilityState === "hidden" || fatal || disposed) return;
      const socket = socketRef.current;
      if (socket?.readyState === WebSocket.CLOSED) { clearTimeout(retry); connect(); }
      else if (socket?.readyState === WebSocket.OPEN) socket.close();
    };
    window.addEventListener("online", resume);
    document.addEventListener("visibilitychange", resume);
    return () => {
      disposed = true;
      clearTimeout(retry);
      clearTimeout(deadline);
      socketRef.current?.close();
      window.removeEventListener("online", resume);
      document.removeEventListener("visibilitychange", resume);
    };
  }, [roomId]);

  const send = useCallback((command: GameCommand) => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN || busyRef.current) return;
    busyRef.current = true;
    setPending(true);
    setError(null);
    socket.send(JSON.stringify(command));
  }, []);

  const chess = useMemo(() => room ? replayRoom(room) : new Chess(), [room]);
  const verbose = useMemo(() => chess.history({ verbose: true }), [chess]);
  const last = verbose.at(-1);
  const capturedBy = useMemo(() => {
    const captured = { w: [] as string[], b: [] as string[] };
    for (const move of verbose) if (move.captured) captured[move.color].push(move.captured);
    return captured;
  }, [verbose]);
  const interactive = connection === "connected" && !!room?.joined && !room.result && !pending && color === room.turn;
  const playerMove = useCallback((move: AttemptedMove) => {
    if (!interactive || !room) return;
    try { const check = new Chess(room.fen); check.move(move); } catch { return; }
    send({ type: "move", ...move, ply: room.history.length });
  }, [interactive, room, send]);

  return { room, color, connection, error, pending, interactive, send, playerMove, capturedBy,
    fen: chess.fen(), lastMove: last ? { from: last.from, to: last.to } : null };
}
