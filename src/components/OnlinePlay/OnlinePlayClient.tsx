"use client";

import Link from "next/link";
import { useState, type CSSProperties } from "react";
import type { Color } from "chess.js";
import { Board } from "@/components/Board/Board";
import { HumanMoves, PlayerStrip } from "@/components/Play/HumanGame";
import { colorName, opposite } from "@/lib/realtime/protocol";
import { specToAttrs, specToVars } from "@/lib/table/spec";
import { useOnlineGame } from "./useOnlineGame";
import { InviteFriend } from "./InviteFriend";

export function OnlinePlayClient({ roomId }: { roomId: string }) {
  const game = useOnlineGame(roomId);
  const { room, color, connection, pending, send } = game;
  const [flipped, setFlipped] = useState(false);
  const [copyStatus, setCopyStatus] = useState("");
  const [confirmResign, setConfirmResign] = useState(false);
  const [showResult, setShowResult] = useState(true);
  const orientation = flipped ? opposite(color ?? "w") : color ?? "w";
  const spec = room?.table;
  const style = spec ? { ...specToVars(spec), background: spec.bg, backgroundImage: spec.bgGradient } as CSSProperties : undefined;
  const connected = connection === "connected";
  const canAct = connected && !pending && !!color && !!room?.joined && !room.result;
  const status = connection === "unavailable" ? "Game unavailable"
    : !connected ? connection === "reconnecting" ? "Reconnecting — your seat is saved…" : "Connecting to your table…"
    : room?.result ? room.result.detail
    : !color ? "Your friend saved you a seat."
    : !room?.joined ? "Your table is ready. Invite your friend."
    : !room.presence[opposite(color)] ? "Your friend disconnected. Their seat is saved."
    : room.turn === color ? "Your move." : "Your friend's move.";
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${location.origin}/play/${roomId}`);
      setCopyStatus("Invite copied — send it to your friend.");
    } catch { setCopyStatus("Copy the invite from the link field below."); }
  };
  const strip = (side: Color) => {
    const isYou = color === side;
    const live = connected && !!room?.joined && !room.result && room.turn === side;
    const present = room?.presence[side];
    return <PlayerStrip avatar={side === "w" ? "♔" : "♚"} name={isYou ? "You" : "Your friend"}
      role={colorName(side)} captured={game.capturedBy[side]} capturedColor={opposite(side)}
      status={!connected ? "Offline" : !room?.joined && side === "b" ? "Open seat" : !present ? "Offline" : live ? "To move" : "Connected"}
      live={live} variant={isYou ? "you" : ""} />;
  };

  return (
    <div className="game wrap online-game" style={style} {...(spec ? specToAttrs(spec) : {})}>
      <div className="board-col">
        {strip(opposite(orientation))}
        <div className="board-row">
          <Board key={`${orientation}-${game.interactive}`} fen={game.fen} orientation={orientation}
            interactive={game.interactive} lastMove={game.lastMove} onMove={game.playerMove} pieceStyle={spec?.pieceStyle} />
          {room?.result && showResult ? (
            <div className="result-overlay" role="status">
              <div className={`result-card bracket ${room.result.winner === null ? "draw" : room.result.winner === color ? "win" : "loss"}`}>
                <span className="result-kicker">Game over</span>
                <h2>{room.result.title}</h2><p>{room.result.detail}</p>
                <button className="btn btn-primary" onClick={() => setShowResult(false)}>View final board</button>
              </div>
            </div>
          ) : null}
        </div>
        {strip(orientation)}
      </div>
      <aside className="panel" aria-label="Online game panel">
        <section className="card online-invite" aria-label="Online game">
          <div className="card-head"><h2>Across the board</h2><span className="tag">{connected ? "Live" : "Online"}</span></div>
          <div className="online-body">
            <p className="online-status" role="status" aria-live="polite">{status}</p>
            {game.error ? <p className="dealer-error" role="alert">{game.error}</p> : null}
            {connected && !color && !room?.joined ? (
              <button className="btn btn-primary" disabled={pending} onClick={() => send({ type: "claim" })}>
                {pending ? "Joining…" : "Join game as Black"}
              </button>
            ) : null}
            {color && !room?.joined ? (
              <>
                <button className="btn btn-primary" onClick={() => void copy()}>Copy invite link</button>
                <label className="online-link-label">Private invite
                  <input aria-label="Private invite link" readOnly value={typeof window === "undefined" ? "" : `${window.location.origin}/play/${roomId}`}
                    onFocus={(event) => event.target.select()} />
                </label>
                {copyStatus ? <p role="status" className="online-note">{copyStatus}</p> : null}
              </>
            ) : null}
            <p className="online-note">No clock. No accounts. Reopen this link in the same browser to return to your seat.</p>
            <p className="online-note">{spec ? `Shared world · ${spec.name}` : "Deep-Space · classic"}</p>
          </div>
        </section>

        {room?.drawOffer && !room.result ? (
          <section className="card online-body" aria-label="Draw offer">
            <p role="status">{room.drawOffer === color ? "Draw offered. Waiting for your friend." : "Your friend offered a draw."}</p>
            {room.drawOffer !== color && color ? <div className="online-controls">
              <button className="btn btn-primary" disabled={!canAct} onClick={() => send({ type: "draw", action: "accept" })}>Accept draw</button>
              <button disabled={!canAct} onClick={() => send({ type: "draw", action: "decline" })}>Keep playing</button>
            </div> : null}
          </section>
        ) : null}
        <HumanMoves history={room?.history ?? []} />
        <section className="actions" aria-label="Game actions">
          <button onClick={() => setFlipped((value) => !value)}>⇅ Flip board</button>
          <button disabled={!canAct || !!room?.drawOffer} onClick={() => send({ type: "draw", action: "offer" })}>Offer draw</button>
          <button className="danger" disabled={!canAct} onClick={() => setConfirmResign(true)}>Resign</button>
        </section>
        {confirmResign && !room?.result ? <section className="card online-body" aria-label="Confirm resignation">
          <p>Resign this game? Your friend will win.</p>
          <div className="online-controls">
            <button className="danger" disabled={!canAct} onClick={() => { send({ type: "resign" }); setConfirmResign(false); }}>Yes, resign</button>
            <button onClick={() => setConfirmResign(false)}>Keep playing</button>
          </div>
        </section> : null}
        {room?.result || connection === "unavailable" ? <InviteFriend table={spec ?? null} /> : null}
        <Link className="online-back" href="/play">← Back to Play</Link>
      </aside>
    </div>
  );
}
