"use client";

/**
 * The Play screen — one generalized loop with a Bot ⇄ Multiplayer switch (M6).
 *
 * Bot mode keeps the full "Deep-Space Analysis Deck": a dedicated full-strength engine
 * (useAnalysis, separate from the bot) drives the eval bar, Analysis card and coach; the
 * randomized board (useBoardTheme) re-tints either mode. Multiplayer mode is hot-seat —
 * two humans on one device, no coach/analysis (a live best-line beside two competing humans
 * is an engine assist, and Play is "just play"): two player strips, a plain move log, manual
 * flip, single-ply takeback and per-side resign.
 */

import { useState } from "react";
import type { Color } from "chess.js";
import { Board } from "@/components/Board/Board";
import { EvalBar } from "@/components/EvalBar/EvalBar";
import { EvalGraph } from "@/components/EvalGraph/EvalGraph";
import { MoveList } from "@/components/MoveList/MoveList";
import { CoachPanel } from "@/components/Coaching/CoachPanel";
import { useChessGame, type GameMode } from "@/components/Play/useChessGame";
import { useAnalysis } from "@/components/Play/useAnalysis";
import { useCoach } from "@/components/Play/useCoach";
import { BoardRandomizer } from "@/components/BoardRandomizer/BoardRandomizer";
import { useBoardTheme } from "@/components/BoardRandomizer/useBoardTheme";
import {
  DIFFICULTIES,
  DEFAULT_DIFFICULTY,
  getDifficulty,
} from "@/lib/engine/difficulty";
import { GLYPH } from "@/lib/chess/pieces";
import type { PieceSymbol } from "chess.js";

export function PlayClient() {
  const game = useChessGame("w", DEFAULT_DIFFICULTY);
  const boardTheme = useBoardTheme();
  const [orientation, setOrientation] = useState<Color>("w");
  const [analysisOn, setAnalysisOn] = useState(true);

  const isBot = game.mode === "bot";
  const showAnalysis = isBot && analysisOn;
  const analysis = useAnalysis(game.history, showAnalysis);

  const diff = getDifficulty(game.difficulty);
  const interactive = game.interactive;

  const coach = useCoach({
    fen: game.fen,
    history: game.history,
    playerColor: game.playerColor,
    currentPosition: analysis.currentPosition,
    playerToMove: isBot && interactive,
  });

  const switchMode = (mode: GameMode) => {
    setOrientation("w");
    game.setMode(mode);
  };

  return (
    <div className="game wrap">
      {/* ===================== BOARD COLUMN ===================== */}
      <div className="board-col">
        <TopStrip game={game} orientation={orientation} diff={diff} />

        <div className="board-row">
          {showAnalysis && <EvalBar evaluation={analysis.currentEval} orientation={orientation} />}
          <Board
            fen={game.fen}
            orientation={orientation}
            interactive={interactive}
            lastMove={game.lastMove}
            onMove={game.playerMove}
            theme={boardTheme.theme}
            sweepKey={boardTheme.sweepKey}
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

        <BottomStrip game={game} orientation={orientation} interactive={interactive} />
      </div>

      {/* ===================== SIDE PANEL ===================== */}
      <aside className="panel" aria-label="Game panel">
        <div className="mode-switch">
          <span className="field-label">Mode</span>
          <div className="seg two" role="group" aria-label="Game mode">
            <button
              className={`seg-btn${isBot ? " on" : ""}`}
              aria-pressed={isBot}
              onClick={() => switchMode("bot")}
            >
              Bot
            </button>
            <button
              className={`seg-btn${!isBot ? " on" : ""}`}
              aria-pressed={!isBot}
              onClick={() => switchMode("local")}
            >
              Multiplayer
            </button>
          </div>
        </div>

        <BoardRandomizer {...boardTheme} />

        {isBot ? (
          <>
            <div className="ana-switch">
              <span className="label">Engine analysis</span>
              <button
                type="button"
                role="switch"
                aria-checked={analysisOn}
                aria-label="Toggle engine analysis"
                onClick={() => setAnalysisOn((on) => !on)}
              >
                <span className="knob" aria-hidden="true" />
              </button>
            </div>

            {analysisOn && (
              <EvalGraph
                series={analysis.series}
                moveFacts={analysis.moveFacts}
                currentEval={analysis.currentEval}
                currentDepth={analysis.currentDepth}
                currentPvSan={analysis.currentPvSan}
                analyzing={analysis.analyzing}
              />
            )}

            <CoachPanel coach={coach} />

            <MoveList
              moveFacts={analysis.moveFacts}
              onExplain={coach.explain}
              explainedPly={coach.active?.surface === "explain" ? coach.active.ply : null}
            />

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
          </>
        ) : (
          <HotseatMoves history={game.history} />
        )}

        <section className="actions" aria-label="Game actions">
          <button onClick={() => game.newGame()}>
            <span className="ic" aria-hidden="true">
              ◆
            </span>{" "}
            New game
          </button>
          <button onClick={game.takeback} disabled={!game.canTakeback}>
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
            onClick={() => game.resign()}
            disabled={!!game.result || game.history.length === 0}
          >
            <span className="ic" aria-hidden="true">
              ✕
            </span>{" "}
            {isBot ? "Resign" : `${game.turn === "w" ? "White" : "Black"} resigns`}
          </button>
        </section>
      </aside>
    </div>
  );
}

/** The strip above the board: the bot opponent, or the player sitting at the top in hot-seat. */
function TopStrip({
  game,
  orientation,
  diff,
}: {
  game: ReturnType<typeof useChessGame>;
  orientation: Color;
  diff: ReturnType<typeof getDifficulty>;
}) {
  if (game.mode === "bot") {
    const opponentColor: Color = game.playerColor === "w" ? "b" : "w";
    const status = !game.engineReady ? "Booting engine…" : game.thinking ? "Thinking…" : "Ready";
    return (
      <PlayerStrip
        avatar="◓"
        name="Coach Bot"
        role={`CPU · ${diff.label} ${diff.elo}`}
        captured={game.capturedBy[opponentColor]}
        capturedColor={game.playerColor}
        status={status}
        live={game.thinking}
      />
    );
  }
  const topColor: Color = orientation === "w" ? "b" : "w";
  return <SideStrip game={game} color={topColor} />;
}

/** The strip below the board: you (bot mode), or the player sitting at the bottom (hot-seat). */
function BottomStrip({
  game,
  orientation,
  interactive,
}: {
  game: ReturnType<typeof useChessGame>;
  orientation: Color;
  interactive: boolean;
}) {
  if (game.mode === "bot") {
    const opponentColor: Color = game.playerColor === "w" ? "b" : "w";
    return (
      <PlayerStrip
        variant="you"
        avatar="▲"
        name="You"
        role={game.playerColor === "w" ? "White" : "Black"}
        captured={game.capturedBy[game.playerColor]}
        capturedColor={opponentColor}
        status={interactive ? "Your move" : ""}
        live={interactive}
      />
    );
  }
  return <SideStrip game={game} color={orientation} />;
}

/** A hot-seat player strip, identified purely by colour (name entry is a later nicety). */
function SideStrip({ game, color }: { game: ReturnType<typeof useChessGame>; color: Color }) {
  const toMove = !game.result && game.turn === color;
  return (
    <PlayerStrip
      avatar={color === "w" ? "♔" : "♚"}
      name={color === "w" ? "White" : "Black"}
      role="Player"
      captured={game.capturedBy[color]}
      capturedColor={color === "w" ? "b" : "w"}
      status={toMove ? "To move" : ""}
      live={toMove}
    />
  );
}

/** A plain SAN move log for hot-seat — no classification colours, no engine. */
function HotseatMoves({ history }: { history: string[] }) {
  const rows: Array<{ n: number; w: string; b: string }> = [];
  for (let i = 0; i < history.length; i += 2) {
    rows.push({ n: i / 2 + 1, w: history[i], b: history[i + 1] ?? "" });
  }
  return (
    <section className="card" aria-label="Moves">
      <div className="card-head">
        <h2>Moves</h2>
        <span className="tag">{rows.length ? `${rows.length} full` : "—"}</span>
      </div>
      <div className="moves">
        {rows.length === 0 ? (
          <p className="moves-empty">No moves yet — White to start.</p>
        ) : (
          rows.map((r) => (
            <div className="moverow" key={r.n}>
              <span className="n">{r.n}</span>
              <span className="m plain">{r.w}</span>
              <span className="m plain">{r.b}</span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function PlayerStrip({
  avatar,
  name,
  role,
  captured,
  capturedColor,
  status,
  live,
  variant = "",
}: {
  avatar: string;
  name: string;
  role: string;
  captured: string[];
  capturedColor: Color;
  status: string;
  live: boolean;
  variant?: string;
}) {
  return (
    <div className={`pstrip${variant ? ` ${variant}` : ""}${live ? " active" : ""}`}>
      <span className="avatar" aria-hidden="true">
        {avatar}
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
