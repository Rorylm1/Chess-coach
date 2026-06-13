"use client";

/**
 * The M1 game loop: a human plays a full legal game against Stockfish.
 *
 * chess.js holds the authoritative game (a ref); React state mirrors just what the UI
 * needs (fen, history, status). The engine is reached only through ChessEngine's UCI
 * boundary. The bot's reply is fired after each human move; an AbortController cancels an
 * in-flight search whenever the game resets so a stale bot move can never land.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Chess, type Color, type Square } from "chess.js";
import { ChessEngine } from "@/lib/engine/engine";
import { getDifficulty, type DifficultyId } from "@/lib/engine/difficulty";
import type { AttemptedMove } from "@/components/Board/Board";

export type GameResult = {
  /** Headline, e.g. "Checkmate". */
  title: string;
  /** Plain-language detail, e.g. "You win — Black is mated." */
  detail: string;
  /** Who comes out on top, for accent colour. */
  outcome: "win" | "loss" | "draw";
};

export interface ChessGame {
  fen: string;
  /** SAN move list, in play order. */
  history: string[];
  lastMove: { from: Square; to: Square } | null;
  turn: Color;
  playerColor: Color;
  thinking: boolean;
  engineReady: boolean;
  result: GameResult | null;
  difficulty: DifficultyId;
  setDifficulty: (id: DifficultyId) => void;
  /** Captured piece-type lists, e.g. capturedBy.w = black pieces White has taken. */
  capturedBy: { w: string[]; b: string[] };
  canTakeback: boolean;
  playerMove: (move: AttemptedMove) => void;
  newGame: (opts?: { color?: Color; difficulty?: DifficultyId }) => void;
  resign: () => void;
  takeback: () => void;
}

const START_FEN = new Chess().fen();

export function useChessGame(initialColor: Color, initialDifficulty: DifficultyId): ChessGame {
  const engineRef = useRef<ChessEngine | null>(null);
  const gameRef = useRef(new Chess());
  const abortRef = useRef<AbortController | null>(null);
  const playerColorRef = useRef<Color>(initialColor);
  const difficultyRef = useRef<DifficultyId>(initialDifficulty);

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

  // Lazily boot the engine once, on mount.
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
    const youAreToMove = g.turn() === playerColorRef.current;
    if (g.isCheckmate()) {
      // The side to move is checkmated.
      setResult(
        youAreToMove
          ? { title: "Checkmate", detail: "The bot mated you. Rematch?", outcome: "loss" }
          : { title: "Checkmate", detail: "You delivered mate. Well played.", outcome: "win" },
      );
    } else if (g.isStalemate()) {
      setResult({ title: "Stalemate", detail: "No legal moves — it's a draw.", outcome: "draw" });
    } else if (g.isInsufficientMaterial()) {
      setResult({
        title: "Draw",
        detail: "Insufficient material to checkmate.",
        outcome: "draw",
      });
    } else if (g.isThreefoldRepetition()) {
      setResult({ title: "Draw", detail: "Threefold repetition.", outcome: "draw" });
    } else {
      setResult({ title: "Draw", detail: "Fifty-move rule — it's a draw.", outcome: "draw" });
    }
    return true;
  }, []);

  const makeBotMove = useCallback(async () => {
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
      if (g.turn() !== playerColorRef.current || thinking || result) return;
      try {
        g.move({ from: move.from, to: move.to, promotion: move.promotion });
      } catch {
        return; // illegal — chess.js threw; ignore.
      }
      sync();
      if (!evaluateEnd()) void makeBotMove();
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
      void engineRef.current?.newGame().then(() => {
        // If the human took Black, the bot (White) opens.
        if (color === "b") void makeBotMove();
      });
    },
    [sync, makeBotMove],
  );

  const resign = useCallback(() => {
    if (result || gameRef.current.isGameOver()) return;
    abortRef.current?.abort();
    setThinking(false);
    setResult({ title: "Resigned", detail: "You resigned. The bot takes it.", outcome: "loss" });
  }, [result]);

  const takeback = useCallback(() => {
    const g = gameRef.current;
    if (thinking) return;
    // Undo back to the human's turn (their move + the bot's reply, if present).
    let undone = false;
    if (g.history().length > 0 && g.turn() === playerColorRef.current) {
      g.undo(); // bot's reply
      undone = true;
    }
    if (g.history().length > 0) {
      g.undo(); // your move
      undone = true;
    }
    if (undone) {
      setResult(null);
      sync();
    }
  }, [thinking, sync]);

  return {
    fen,
    history,
    lastMove,
    turn: fen.split(" ")[1] === "b" ? "b" : "w",
    playerColor,
    thinking,
    engineReady,
    result,
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
