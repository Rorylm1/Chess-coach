"use client";

/**
 * The Play screen — composes the board, player strips, move log and game controls into
 * the locked "Deep-Space Analysis Deck" layout. M1 scope: a complete legal game vs the
 * adjustable Stockfish bot. (Eval bar, coach and clocks arrive in M2/M3 — deliberately
 * absent here rather than faked.)
 */

import { useState } from "react";
import type { Color } from "chess.js";
import { Board } from "@/components/Board/Board";
import { useChessGame } from "@/components/Play/useChessGame";
import {
  DIFFICULTIES,
  DEFAULT_DIFFICULTY,
  getDifficulty,
} from "@/lib/engine/difficulty";
import { GLYPH } from "@/lib/chess/pieces";
import type { PieceSymbol } from "chess.js";

export function PlayClient() {
  const game = useChessGame("w", DEFAULT_DIFFICULTY);
  const [orientation, setOrientation] = useState<Color>("w");

  const diff = getDifficulty(game.difficulty);
  const interactive =
    game.engineReady && !game.thinking && !game.result && game.turn === game.playerColor;

  const opponentColor: Color = game.playerColor === "w" ? "b" : "w";
  const oppStatus = !game.engineReady
    ? "Booting engine…"
    : game.thinking
      ? "Thinking…"
      : "Ready";

  return (
    <div className="game wrap">
      {/* ===================== BOARD COLUMN ===================== */}
      <div className="board-col">
        <PlayerStrip
          variant="opponent"
          name="Coach Bot"
          role={`CPU · ${diff.label} ${diff.elo}`}
          captured={game.capturedBy[opponentColor]}
          capturedColor={game.playerColor}
          status={oppStatus}
          live={game.thinking}
        />

        <div className="board-row">
          <Board
            fen={game.fen}
            orientation={orientation}
            interactive={interactive}
            lastMove={game.lastMove}
            onMove={game.playerMove}
          />
          {game.result && (
            <div className="result-overlay" role="status">
              <div className={`result-card bracket ${game.result.outcome}`}>
                <span className="result-kicker">Game over</span>
                <h2>{game.result.title}</h2>
                <p>{game.result.detail}</p>
                <button className="btn btn-primary" onClick={() => game.newGame()}>
                  New game
                </button>
              </div>
            </div>
          )}
        </div>

        <PlayerStrip
          variant="you"
          name="You"
          role={game.playerColor === "w" ? "White" : "Black"}
          captured={game.capturedBy[game.playerColor]}
          capturedColor={opponentColor}
          status={interactive ? "Your move" : ""}
          live={interactive}
        />
      </div>

      {/* ===================== SIDE PANEL ===================== */}
      <aside className="panel" aria-label="Game panel">
        <MoveLog history={game.history} />

        <section className="card setup-card" aria-label="Opponent settings">
          <div className="card-head">
            <h2>Opponent</h2>
            <span className="tag">{diff.elo}</span>
          </div>
          <div className="setup-body">
            <span className="field-label">Strength</span>
            <div className="seg" role="group" aria-label="Bot strength">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d.id}
                  className={`seg-btn${game.difficulty === d.id ? " on" : ""}`}
                  aria-pressed={game.difficulty === d.id}
                  onClick={() => game.setDifficulty(d.id)}
                >
                  {d.label}
                </button>
              ))}
            </div>
            <p className="blurb">{diff.blurb}</p>

            <span className="field-label">Your side</span>
            <div className="seg two" role="group" aria-label="Your side">
              <button
                className={`seg-btn${game.playerColor === "w" ? " on" : ""}`}
                aria-pressed={game.playerColor === "w"}
                onClick={() => {
                  setOrientation("w");
                  game.newGame({ color: "w" });
                }}
              >
                White
              </button>
              <button
                className={`seg-btn${game.playerColor === "b" ? " on" : ""}`}
                aria-pressed={game.playerColor === "b"}
                onClick={() => {
                  setOrientation("b");
                  game.newGame({ color: "b" });
                }}
              >
                Black
              </button>
            </div>
          </div>
        </section>

        <section className="actions" aria-label="Game actions">
          <button onClick={() => game.newGame()}>
            <span className="ic" aria-hidden="true">
              ◆
            </span>{" "}
            New game
          </button>
          <button
            onClick={game.takeback}
            disabled={!game.canTakeback}
          >
            <span className="ic" aria-hidden="true">
              ↩
            </span>{" "}
            Takeback
          </button>
          <button onClick={() => setOrientation((o) => (o === "w" ? "b" : "w"))}>
            <span className="ic" aria-hidden="true">
              ⇅
            </span>{" "}
            Flip
          </button>
          <button
            className="danger"
            onClick={game.resign}
            disabled={!!game.result || game.history.length === 0}
          >
            <span className="ic" aria-hidden="true">
              ✕
            </span>{" "}
            Resign
          </button>
        </section>
      </aside>
    </div>
  );
}

function PlayerStrip({
  variant,
  name,
  role,
  captured,
  capturedColor,
  status,
  live,
}: {
  variant: "you" | "opponent";
  name: string;
  role: string;
  captured: string[];
  capturedColor: Color;
  status: string;
  live: boolean;
}) {
  return (
    <div className={`pstrip ${variant}${live ? " active" : ""}`}>
      <span className="avatar" aria-hidden="true">
        {variant === "you" ? "▲" : "◓"}
      </span>
      <div className="who">
        <div className="name">{name}</div>
        <div className="role">{role}</div>
      </div>
      <div className="captured" aria-label={`Pieces ${name} captured`}>
        {captured.map((p, i) => (
          <span key={i} className={`cap-piece ${capturedColor}`}>
            {GLYPH[p as PieceSymbol]}
          </span>
        ))}
      </div>
      {status && (
        <span className={`pstatus${live ? " live" : ""}`}>
          {live && <span className="dot" aria-hidden="true" />}
          {status}
        </span>
      )}
    </div>
  );
}

function MoveLog({ history }: { history: string[] }) {
  const rows: Array<{ n: number; w?: string; b?: string }> = [];
  for (let i = 0; i < history.length; i += 2) {
    rows.push({ n: i / 2 + 1, w: history[i], b: history[i + 1] });
  }
  const lastIdx = history.length - 1;

  return (
    <section className="card moves-card">
      <div className="card-head">
        <h2>Move Log</h2>
        <span className="tag">
          SAN · {Math.ceil(history.length / 2)} {history.length === 1 ? "move" : "moves"}
        </span>
      </div>
      <div className="moves" aria-label="Move list">
        {rows.length === 0 && <p className="moves-empty">No moves yet — make the first one.</p>}
        {rows.map((row, ri) => (
          <div className="moverow" key={row.n}>
            <span className="n">{row.n}.</span>
            <span className={`m${ri * 2 === lastIdx ? " cur" : ""}`}>{row.w ?? ""}</span>
            <span className={`m${ri * 2 + 1 === lastIdx ? " cur" : ""}`}>{row.b ?? ""}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
