/**
 * Stockfish engine, isolated behind the UCI text-protocol boundary.
 *
 * The engine is the GPLv3 Stockfish WASM build, loaded as a Web Worker from a static
 * asset in /public. Our (permissive) code only ever exchanges UCI strings with it — it
 * never links the engine in. This file is the *only* place that knows the worker exists.
 *
 * Browser-only: instantiate inside a client component (it constructs a `Worker`).
 *
 * Two jobs:
 *  - `bestMove` — pick the bot's move at a (deliberately weakened) Skill Level. Drives play.
 *  - `analyse` — full-strength eval + best move + PV for a position. Drives the M2 grounding
 *    spine (eval bar, graph, classification). `analyse` never sets a Skill Level, so run it
 *    on a *dedicated* engine instance, separate from the bot, to keep its judgement honest
 *    and to let analysis run in parallel with the bot's thinking.
 */

import {
  IN_GAME_ANALYSIS,
  type AnalysisLine,
} from "@/lib/engine/analysis";

const ENGINE_URL = "/stockfish/stockfish-18-lite-single.js";

export interface BestMoveOptions {
  /** Position to think from, as a FEN string. */
  fen: string;
  /** Stockfish Skill Level 0–20. */
  skill: number;
  /** Per-move think time budget (ms). */
  movetime: number;
  /** Optional hard depth cap. */
  depth?: number;
  /** Abort signal — rejects the pending search if the game resets mid-think. */
  signal?: AbortSignal;
}

export interface AnalyseOptions {
  /** Position to evaluate, as a FEN string. */
  fen: string;
  /** Search depth, in plies. */
  depth: number;
  /** Hard time cap (ms) so a single position can't stall the queue. */
  movetime?: number;
  /** Abort signal — cancels the search cleanly (the engine is told to `stop`). */
  signal?: AbortSignal;
}

/** A move in UCI long-algebraic form, split for chess.js consumption. */
export interface EngineMove {
  from: string;
  to: string;
  promotion?: string;
}

type Resolver = () => void;

type PendingPlay = {
  kind: "play";
  resolve: (m: EngineMove) => void;
  reject: (e: Error) => void;
  aborted: boolean;
};

type PendingAnalyse = {
  kind: "analyse";
  resolve: (line: AnalysisLine) => void;
  reject: (e: Error) => void;
  aborted: boolean;
  /** Deepest PV line parsed so far. */
  best: AnalysisLine | null;
};

type Pending = PendingPlay | PendingAnalyse;

/** Parse a UCI `info` line into a PV line. Returns null for lines without a usable
 *  (score + pv) pair, e.g. `currmove` progress or bound-only updates. */
function parseInfo(line: string): AnalysisLine | null {
  if (line.includes("lowerbound") || line.includes("upperbound")) return null;
  const t = line.split(/\s+/);
  let depth = 0;
  let cp: number | null = null;
  let mate: number | null = null;
  let pvUci: string[] = [];
  let hasScore = false;
  for (let i = 1; i < t.length; i++) {
    const tok = t[i];
    if (tok === "depth") {
      depth = parseInt(t[++i], 10);
    } else if (tok === "score") {
      const type = t[++i];
      const val = parseInt(t[++i], 10);
      if (type === "cp") {
        cp = val;
        mate = null;
        hasScore = true;
      } else if (type === "mate") {
        mate = val;
        cp = null;
        hasScore = true;
      }
    } else if (tok === "pv") {
      pvUci = t.slice(i + 1);
      break; // pv is always the last field
    }
  }
  if (!hasScore || pvUci.length === 0) return null;
  return { depth, cp, mate, bestMoveUci: pvUci[0] ?? null, pvUci };
}

export class ChessEngine {
  private worker: Worker | null = null;
  private ready: Promise<void> | null = null;
  /** Resolvers waiting on a specific `readyok`/`uciok` token. */
  private readyWaiters: Resolver[] = [];
  /** The in-flight search (play or analyse), if any. */
  private pending: Pending | null = null;
  /** Serializes requests so we only ever ask the single-threaded engine one thing. */
  private queue: Promise<unknown> = Promise.resolve();
  private lastSkill: number | null = null;
  private terminated = false;

  /** Boots the worker and completes UCI handshake. Idempotent. */
  init(): Promise<void> {
    if (this.ready) return this.ready;

    this.ready = new Promise<void>((resolve, reject) => {
      try {
        this.worker = new Worker(ENGINE_URL);
      } catch (e) {
        reject(e instanceof Error ? e : new Error("Failed to start engine worker"));
        return;
      }

      this.worker.onmessage = (e: MessageEvent) => this.onMessage(e.data);
      this.worker.onerror = (e) => {
        const err = new Error(`Engine worker error: ${e.message ?? "unknown"}`);
        this.pending?.reject(err);
        this.pending = null;
      };

      // UCI handshake: uci -> uciok, then isready -> readyok.
      this.waitFor().then(() => {
        this.send("isready");
        this.waitFor().then(() => resolve()).catch(reject);
      }).catch(reject);

      this.send("uci");
    });

    return this.ready;
  }

  /** Resolve the next `uciok`/`readyok` token. */
  private waitFor(): Promise<void> {
    return new Promise<void>((resolve) => this.readyWaiters.push(resolve));
  }

  private send(cmd: string) {
    this.worker?.postMessage(cmd);
  }

  private onMessage(line: unknown) {
    if (typeof line !== "string") return;

    if (line === "uciok" || line === "readyok") {
      this.readyWaiters.shift()?.();
      return;
    }

    const p = this.pending;

    if (line.startsWith("info")) {
      if (p?.kind === "analyse") {
        const parsed = parseInfo(line);
        if (parsed) p.best = parsed; // depth increases monotonically; keep the deepest
      }
      return;
    }

    if (line.startsWith("bestmove")) {
      if (!p) return;
      this.pending = null;
      // An aborted search still emits a final `bestmove` after `stop`; consuming it here
      // (rather than nulling pending the instant abort fires) guarantees a stale result
      // can never be misattributed to the next queued request.
      if (p.aborted) {
        p.reject(new DOMException("Aborted", "AbortError"));
        return;
      }
      const uci = line.split(/\s+/)[1];
      if (p.kind === "play") {
        if (!uci || uci === "(none)") {
          p.reject(new Error("Engine returned no move"));
          return;
        }
        p.resolve({
          from: uci.slice(0, 2),
          to: uci.slice(2, 4),
          promotion: uci.length > 4 ? uci[4] : undefined,
        });
      } else {
        p.resolve(
          p.best ?? {
            depth: 0,
            cp: 0,
            mate: null,
            bestMoveUci: uci && uci !== "(none)" ? uci : null,
            pvUci: uci && uci !== "(none)" ? [uci] : [],
          },
        );
      }
    }
  }

  /** Tell the engine a brand-new game is starting (clears its hash/heuristics). */
  async newGame(): Promise<void> {
    await this.init();
    this.send("ucinewgame");
    this.send("isready");
    await this.waitFor();
    this.lastSkill = null;
  }

  /**
   * Ask the engine for the best move in a position at a given strength.
   * Calls are serialized; the single-threaded engine only searches one at a time.
   */
  bestMove(opts: BestMoveOptions): Promise<EngineMove> {
    const run = async (): Promise<EngineMove> => {
      await this.init();
      if (this.terminated) throw new Error("Engine terminated");
      if (opts.signal?.aborted) throw new DOMException("Aborted", "AbortError");

      if (this.lastSkill !== opts.skill) {
        this.send(`setoption name Skill Level value ${opts.skill}`);
        this.lastSkill = opts.skill;
      }

      return new Promise<EngineMove>((resolve, reject) => {
        const pending: PendingPlay = {
          kind: "play",
          aborted: false,
          resolve: (m) => {
            opts.signal?.removeEventListener("abort", onAbort);
            resolve(m);
          },
          reject: (e) => {
            opts.signal?.removeEventListener("abort", onAbort);
            reject(e);
          },
        };
        const onAbort = () => {
          pending.aborted = true;
          this.send("stop");
        };
        opts.signal?.addEventListener("abort", onAbort, { once: true });

        this.pending = pending;
        this.send(`position fen ${opts.fen}`);
        this.send(opts.depth ? `go depth ${opts.depth} movetime ${opts.movetime}` : `go movetime ${opts.movetime}`);
      });
    };

    // Chain onto the queue so requests never overlap; isolate failures.
    const result = this.queue.then(run, run);
    this.queue = result.catch(() => undefined);
    return result;
  }

  /**
   * Full-strength evaluation of a position: eval (cp/mate), best move and PV (all in
   * UCI / side-to-move POV — normalize with `lineToWhiteEval`). Serialized like bestMove.
   * Run on a dedicated instance (no Skill Level is set, so it plays at full strength).
   */
  analyse(opts: AnalyseOptions): Promise<AnalysisLine> {
    const run = async (): Promise<AnalysisLine> => {
      await this.init();
      if (this.terminated) throw new Error("Engine terminated");
      if (opts.signal?.aborted) throw new DOMException("Aborted", "AbortError");

      return new Promise<AnalysisLine>((resolve, reject) => {
        const pending: PendingAnalyse = {
          kind: "analyse",
          aborted: false,
          best: null,
          resolve: (line) => {
            opts.signal?.removeEventListener("abort", onAbort);
            resolve(line);
          },
          reject: (e) => {
            opts.signal?.removeEventListener("abort", onAbort);
            reject(e);
          },
        };
        const onAbort = () => {
          pending.aborted = true;
          this.send("stop");
        };
        opts.signal?.addEventListener("abort", onAbort, { once: true });

        this.pending = pending;
        const movetime = opts.movetime ?? IN_GAME_ANALYSIS.movetime;
        this.send(`position fen ${opts.fen}`);
        this.send(`go depth ${opts.depth} movetime ${movetime}`);
      });
    };

    const result = this.queue.then(run, run);
    this.queue = result.catch(() => undefined);
    return result;
  }

  terminate() {
    this.terminated = true;
    this.pending?.reject(new Error("Engine terminated"));
    this.pending = null;
    this.worker?.terminate();
    this.worker = null;
    this.ready = null;
  }
}
