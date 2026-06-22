"use client";

/**
 * Live analysis — the in-game face of the M2 grounding spine.
 *
 * Runs a *dedicated* full-strength Stockfish (separate from the bot in `useChessGame`, so
 * analysis stays honest and runs in parallel with the bot's thinking). As the SAN history
 * grows it evaluates each new position once, at shallow in-game depth, caching results by
 * FEN. From that cache it derives everything the UI needs: the current eval + best line,
 * a per-ply White win% series for the graph, and per-move classification facts.
 *
 * The cache lives in React state (updated immutably) so every derived value is reactive
 * and recomputes the instant an eval lands. Caching by FEN means takebacks, new games and
 * transpositions all reuse prior work and the state self-heals — there is no separate
 * "reset". Positions are searched newest-first so the eval bar tracks the live position;
 * older gaps backfill behind it.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Chess } from "chess.js";
import { ChessEngine } from "@/lib/engine/engine";
import {
  IN_GAME_ANALYSIS,
  lineToPositionEval,
  terminalEval,
  whiteWinPct,
  type Eval,
  type PositionEval,
} from "@/lib/engine/analysis";
import { buildMoveFacts, pvToSan, type MoveFact } from "@/lib/grounding/payload";

export interface SeriesPoint {
  ply: number;
  /** White's winning chance at this position, 0–100 (null until evaluated). */
  winWhite: number | null;
}

export interface AnalysisState {
  /** Analysis engine is booted. */
  ready: boolean;
  /** Whether analysis is switched on. */
  enabled: boolean;
  /** A search is currently in flight. */
  analyzing: boolean;
  /** White-POV eval of the latest position. */
  currentEval: Eval | null;
  /** Search depth of the latest position's eval. */
  currentDepth: number;
  /** Engine's best line from the latest position, in SAN. */
  currentPvSan: string[];
  /** Full White-POV eval of the latest position (eval + best move + PV in UCI), for the coach
   *  payload. null until evaluated or when the position is terminal. */
  currentPosition: PositionEval | null;
  /** White win% per position, index 0…plies. */
  series: SeriesPoint[];
  /** Per-move classified facts (the grounding payload). */
  moveFacts: MoveFact[];
}

interface PositionRef {
  fen: string;
  ply: number;
  /** White-POV eval if this position is terminal (game over), else null. */
  terminal: Eval | null;
}

export function useAnalysis(history: string[], enabled: boolean): AnalysisState {
  const engineRef = useRef<ChessEngine | null>(null);
  /** FENs with a search in flight, to avoid firing duplicates across re-renders. */
  const inFlightRef = useRef<Set<string>>(new Set());

  const [ready, setReady] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  /** FEN → engine eval. The durable spine; only ever grows (FENs are position-unique). */
  const [cache, setCache] = useState<Map<string, PositionEval>>(new Map());

  // Boot one analysis engine for the lifetime of the screen.
  useEffect(() => {
    const engine = new ChessEngine();
    engineRef.current = engine;
    engine.init().then(() => setReady(true)).catch(() => setReady(false));
    return () => engine.terminate();
  }, []);

  // Replay the SAN history into a position-per-ply list (with terminal evals baked in).
  const positions = useMemo<PositionRef[]>(() => {
    const game = new Chess();
    const list: PositionRef[] = [{ fen: game.fen(), ply: 0, terminal: terminalEval(game) }];
    for (let i = 0; i < history.length; i++) {
      try {
        game.move(history[i]);
      } catch {
        break;
      }
      list.push({ fen: game.fen(), ply: i + 1, terminal: terminalEval(game) });
    }
    return list;
  }, [history]);

  // Evaluate any positions we don't have yet, newest-first. The engine's queue serializes
  // the searches; inFlight guards against re-firing the same FEN as the cache updates.
  useEffect(() => {
    const engine = engineRef.current;
    if (!enabled || !ready || !engine) return;

    const missing = positions
      .filter((p) => !p.terminal && !cache.has(p.fen) && !inFlightRef.current.has(p.fen))
      .reverse(); // newest position first

    if (missing.length === 0) return;
    setAnalyzing(true);

    for (const pos of missing) {
      inFlightRef.current.add(pos.fen);
      engine
        .analyse({ fen: pos.fen, depth: IN_GAME_ANALYSIS.depth, movetime: IN_GAME_ANALYSIS.movetime })
        .then((line) => {
          const evaluated = lineToPositionEval(line, pos.fen);
          setCache((prev) => new Map(prev).set(pos.fen, evaluated));
        })
        .catch(() => {
          /* aborted or engine gone — leave it uncached, a later pass retries */
        })
        .finally(() => {
          inFlightRef.current.delete(pos.fen);
          if (inFlightRef.current.size === 0) setAnalyzing(false);
        });
    }
  }, [positions, cache, ready, enabled]);

  // Derived state — all reactive on the cache, so verdicts stream in as evals land.
  const moveFacts = useMemo(
    () => buildMoveFacts(history, (fen) => cache.get(fen)),
    [history, cache],
  );

  const series = useMemo<SeriesPoint[]>(
    () =>
      positions.map((p) => {
        const e = p.terminal ?? cache.get(p.fen)?.eval ?? null;
        return { ply: p.ply, winWhite: e ? whiteWinPct(e) : null };
      }),
    [positions, cache],
  );

  const { currentEval, currentDepth, currentPvSan, currentPosition } = useMemo(() => {
    const latest = positions[positions.length - 1];
    if (!latest)
      return { currentEval: null, currentDepth: 0, currentPvSan: [] as string[], currentPosition: null };
    if (latest.terminal)
      return { currentEval: latest.terminal, currentDepth: 0, currentPvSan: [], currentPosition: null };
    const cached = cache.get(latest.fen);
    return {
      currentEval: cached?.eval ?? null,
      currentDepth: cached?.depth ?? 0,
      currentPvSan: cached ? pvToSan(latest.fen, cached.pvUci) : [],
      currentPosition: cached ?? null,
    };
  }, [positions, cache]);

  return {
    ready,
    enabled,
    analyzing,
    currentEval,
    currentDepth,
    currentPvSan,
    currentPosition,
    series,
    moveFacts,
  };
}
