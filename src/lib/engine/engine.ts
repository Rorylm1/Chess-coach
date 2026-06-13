/**
 * Stockfish engine, isolated behind the UCI text-protocol boundary.
 *
 * The engine is the GPLv3 Stockfish WASM build, loaded as a Web Worker from a static
 * asset in /public. Our (permissive) code only ever exchanges UCI strings with it — it
 * never links the engine in. This file is the *only* place that knows the worker exists.
 *
 * Browser-only: instantiate inside a client component (it constructs a `Worker`).
 *
 * For M1 the engine has one job — pick the bot's move. Eval / PV / classification
 * plumbing arrives in M2; the message parser here is kept deliberately small.
 */

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

/** A move in UCI long-algebraic form, split for chess.js consumption. */
export interface EngineMove {
  from: string;
  to: string;
  promotion?: string;
}

type Resolver = () => void;

export class ChessEngine {
  private worker: Worker | null = null;
  private ready: Promise<void> | null = null;
  /** Resolvers waiting on a specific `readyok`/`uciok` token. */
  private readyWaiters: Resolver[] = [];
  /** The in-flight bestmove search, if any. */
  private pending: {
    resolve: (m: EngineMove) => void;
    reject: (e: Error) => void;
  } | null = null;
  /** Serializes requests so we only ever ask for one move at a time. */
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
      const w = this.readyWaiters.shift();
      w?.();
      return;
    }

    if (line.startsWith("bestmove")) {
      const parts = line.split(/\s+/);
      const uci = parts[1];
      const p = this.pending;
      this.pending = null;
      if (!p) return;
      if (!uci || uci === "(none)") {
        p.reject(new Error("Engine returned no move"));
        return;
      }
      p.resolve({
        from: uci.slice(0, 2),
        to: uci.slice(2, 4),
        promotion: uci.length > 4 ? uci[4] : undefined,
      });
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
        const onAbort = () => {
          this.send("stop");
          this.pending = null;
          reject(new DOMException("Aborted", "AbortError"));
        };
        opts.signal?.addEventListener("abort", onAbort, { once: true });

        this.pending = {
          resolve: (m) => {
            opts.signal?.removeEventListener("abort", onAbort);
            resolve(m);
          },
          reject: (e) => {
            opts.signal?.removeEventListener("abort", onAbort);
            reject(e);
          },
        };

        this.send(`position fen ${opts.fen}`);
        const go = opts.depth
          ? `go depth ${opts.depth} movetime ${opts.movetime}`
          : `go movetime ${opts.movetime}`;
        this.send(go);
      });
    };

    // Chain onto the queue so requests never overlap; isolate failures.
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
