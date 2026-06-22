"use client";

/**
 * The generalized game loop (M1 bot play → M6 opponent-aware).
 *
 * chess.js holds the authoritative game (a ref); React state mirrors just what the UI needs
 * (fen, history, status). The chess bookkeeping — sync, captures, end-detection, promotion,
 * lastMove, takeback — is shared across modes; only *who supplies the opponent move* and
 * *takeback depth* differ:
 *   • "bot"   — a human plays `playerColor`; Stockfish replies via ChessEngine's UCI boundary
 *               (an AbortController cancels an in-flight search on reset so a stale move can't
 *               land). Takeback undoes 2 plies (your move + the bot's reply).
 *   • "local" — hot-seat: two humans share one device, both sides interactive, no engine and
 *               no auto-reply. Takeback undoes 1 ply. Result text is neutral (M6 Feature 2).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Chess, type Color, type Square } from "chess.js";
import { ChessEngine } from "@/lib/engine/engine";
import { getDifficulty, type DifficultyId } from "@/lib/engine/difficulty";
import type { AttemptedMove } from "@/components/Board/Board";

export type GameMode = "bot" | "local";

export type GameResult = {
  /** Headline, e.g. "Checkmate". */
  title: string;
  /** Plain-language detail, e.g. "You win — Black is mated." */
  detail: string;
  /** Who comes out on top, for accent colour. */
  outcome: "win" | "loss" | "draw";
};

export interface ChessGame {
  mode: GameMode;
  /** Switch Bot ⇄ Multiplayer; starts a fresh game in the new mode. */
  setMode: (mode: GameMode) => void;
  fen: string;
  /** SAN move list, in play order. */
  history: string[];
  lastMove: { from: Square; to: Square } | null;
  turn: Color;
  /** The human's colour in bot mode (unused in hot-seat). */
  playerColor: Color;
  thinking: boolean;
  engineReady: boolean;
  result: GameResult | null;
  /** Whether a human may move right now (drives the Board's interactivity). */
  interactive: boolean;
  difficulty: DifficultyId;
  setDifficulty: (id: DifficultyId) => void;
  /** Captured piece-type lists, e.g. capturedBy.w = black pieces White has taken. */
  capturedBy: { w: string[]; b: string[] };
  canTakeback: boolean;
  playerMove: (move: AttemptedMove) => void;
  newGame: (opts?: { color?: Color; difficulty?: DifficultyId }) => void;
  /** Resign. In hot-seat, `side` (defaults to the side to move) concedes. */
  resign: (side?: Color) => void;
  takeback: () => void;
}

const START_FEN = new Chess().fen();
const colorName = (c: Color) => (c === "w" ? "White" : "Black");

export function useChessGame(initialColor: Color, initialDifficulty: DifficultyId): ChessGame {
  const engineRef = useRef<ChessEngine | null>(null);
  const gameRef = useRef(new Chess());
  const abortRef = useRef<AbortController | null>(null);
  const playerColorRef = useRef<Color>(initialColor);
  const difficultyRef = useRef<DifficultyId>(initialDifficulty);
  const modeRef = useRef<GameMode>("bot");

  const [mode, setModeState] = useState<GameMode>("bot");
  const [fen, setFen] = useState(START_FEN);
  const [history, setHistory] = useState<string[]>([]);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [capturedBy, setCapturedBy] = useState<{ w: string[]; b: string[] }>({ w: [], b: [] });
  const [playerColor, setPlayerColor] = useState<Color>(initialColor);
  const [thinking, setThinking] = useState(false);
  const [engineReady, setEngineReady] = useState(false);
  const [result, setResult] = useState<GameResult | null>(null);
  const [difficulty, setDifficultyState] = useState<DifficultyId>(initialDifficulty);

  const setDifficulty = useCallback((id: DifficultyId) => {
    difficultyRef.current = id;
    setDifficultyState(id);
  }, []);

  // Lazily boot the engine once, on mount. (It sits idle in hot-seat and is ready the moment
  // you switch back to bot mode.)
  useEffect(() => {
    const engine = new ChessEngine();
    engineRef.current = engine;
    engine
      .init()
      .then(() => setEngineReady(true))
      .catch(() => setEngineReady(false));
    return () => {
      abortRef.current?.abort();
      engine.terminate();
    };
  }, []);

  const sync = useCallback(() => {
    const g = gameRef.current;
    setFen(g.fen());
    setHistory(g.history());
    const verbose = g.history({ verbose: true });
    const last = verbose[verbose.length - 1];
    setLastMove(last ? { from: last.from, to: last.to } : null);
    const caps = { w: [] as string[], b: [] as string[] };
    for (const m of verbose) {
      if (m.captured) caps[m.color].push(m.captured);
    }
    setCapturedBy(caps);
  }, []);

  const evaluateEnd = useCallback((): boolean => {
    const g = gameRef.current;
    if (!g.isGameOver()) return false;
    const local = modeRef.current === "local";
    if (g.isCheckmate()) {
      const mated = g.turn(); // the side to move is checkmated
      if (local) {
        setResult({
          title: "Checkmate",
          detail: `${colorName(mated)} is mated — ${colorName(mated === "w" ? "b" : "w")} wins.`,
          outcome: "win",
        });
      } else {
        const youAreMated = mated === playerColorRef.current;
        setResult(
          youAreMated
            ? { title: "Checkmate", detail: "The bot mated you. Rematch?", outcome: "loss" }
            : { title: "Checkmate", detail: "You delivered mate. Well played.", outcome: "win" },
        );
      }
    } else if (g.isStalemate()) {
      setResult({ title: "Stalemate", detail: "No legal moves — it's a draw.", outcome: "draw" });
    } else if (g.isInsufficientMaterial()) {
      setResult({ title: "Draw", detail: "Insufficient material to checkmate.", outcome: "draw" });
    } else if (g.isThreefoldRepetition()) {
      setResult({ title: "Draw", detail: "Threefold repetition.", outcome: "draw" });
    } else {
      setResult({ title: "Draw", detail: "Fifty-move rule — it's a draw.", outcome: "draw" });
    }
    return true;
  }, []);

  const makeBotMove = useCallback(async () => {
    if (modeRef.current !== "bot") return;
    const engine = engineRef.current;
    const g = gameRef.current;
    if (!engine || g.isGameOver() || g.turn() === playerColorRef.current) return;

    const controller = new AbortController();
    abortRef.current = controller;
    setThinking(true);
    const diff = getDifficulty(difficultyRef.current);
    try {
      const move = await engine.bestMove({
        fen: g.fen(),
        skill: diff.skill,
        movetime: diff.movetime,
        depth: diff.depth,
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      g.move({ from: move.from, to: move.to, promotion: move.promotion });
      sync();
      evaluateEnd();
    } catch {
      // Aborted (game reset) or engine error — leave state as-is; a new game recovers.
    } finally {
      if (!controller.signal.aborted) setThinking(false);
    }
  }, [sync, evaluateEnd]);

  const playerMove = useCallback(
    (move: AttemptedMove) => {
      const g = gameRef.current;
      if (result || thinking) return;
      // Bot mode: only the human's colour is playable. Hot-seat: whoever's to move.
      if (modeRef.current === "bot" && g.turn() !== playerColorRef.current) return;
      try {
        g.move({ from: move.from, to: move.to, promotion: move.promotion });
      } catch {
        return; // illegal — chess.js threw; ignore.
      }
      sync();
      if (!evaluateEnd() && modeRef.current === "bot") void makeBotMove();
    },
    [thinking, result, sync, evaluateEnd, makeBotMove],
  );

  const newGame = useCallback(
    (opts?: { color?: Color; difficulty?: DifficultyId }) => {
      abortRef.current?.abort();
      const color = opts?.color ?? playerColorRef.current;
      if (opts?.difficulty) {
        difficultyRef.current = opts.difficulty;
        setDifficultyState(opts.difficulty);
      }
      playerColorRef.current = color;
      setPlayerColor(color);
      gameRef.current = new Chess();
      setResult(null);
      setThinking(false);
      sync();
      if (modeRef.current === "bot") {
        void engineRef.current?.newGame().then(() => {
          // If the human took Black, the bot (White) opens.
          if (color === "b") void makeBotMove();
        });
      }
    },
    [sync, makeBotMove],
  );

  const setMode = useCallback(
    (next: GameMode) => {
      if (next === modeRef.current) return;
      modeRef.current = next;
      setModeState(next);
      abortRef.current?.abort();
      // Hot-seat always starts White-to-move with both sides human; bot mode resets to White.
      playerColorRef.current = "w";
      setPlayerColor("w");
      gameRef.current = new Chess();
      setResult(null);
      setThinking(false);
      sync();
      if (next === "bot") void engineRef.current?.newGame();
    },
    [sync],
  );

  const resign = useCallback(
    (side?: Color) => {
      if (result || gameRef.current.isGameOver()) return;
      abortRef.current?.abort();
      setThinking(false);
      if (modeRef.current === "local") {
        const loser = side ?? gameRef.current.turn();
        setResult({
          title: "Resignation",
          detail: `${colorName(loser)} resigned — ${colorName(loser === "w" ? "b" : "w")} wins.`,
          outcome: "win",
        });
      } else {
        setResult({ title: "Resigned", detail: "You resigned. The bot takes it.", outcome: "loss" });
      }
    },
    [result],
  );

  const takeback = useCallback(() => {
    const g = gameRef.current;
    if (thinking) return;
    let undone = false;
    if (modeRef.current === "bot") {
      // Undo back to the human's turn (their move + the bot's reply, if present).
      if (g.history().length > 0 && g.turn() === playerColorRef.current) {
        g.undo(); // bot's reply
        undone = true;
      }
      if (g.history().length > 0) {
        g.undo(); // your move
        undone = true;
      }
    } else if (g.history().length > 0) {
      g.undo(); // hot-seat: undo a single ply
      undone = true;
    }
    if (undone) {
      setResult(null);
      sync();
    }
  }, [thinking, sync]);

  const turn: Color = fen.split(" ")[1] === "b" ? "b" : "w";
  const interactive =
    mode === "bot"
      ? engineReady && !thinking && !result && turn === playerColor
      : !result; // hot-seat: both humans, no engine gate

  return {
    mode,
    setMode,
    fen,
    history,
    lastMove,
    turn,
    playerColor,
    thinking,
    engineReady,
    result,
    interactive,
    difficulty,
    setDifficulty,
    capturedBy,
    canTakeback: history.length > 0 && !thinking && !result,
    playerMove,
    newGame,
    resign,
    takeback,
  };
}
