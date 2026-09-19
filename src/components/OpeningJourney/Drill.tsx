"use client";

/**
 * Recall-drill phase of an opening journey (M5 + named-line prototype).
 *
 * You play your side against a scripted "book bot" — no engine. The bot picks among the
 * curated taught replies (weighted by popularity via `pickWeighted`), so it varies its
 * tries but only ever inside lines the read-through taught. A non-book move is rejected
 * (the board doesn't move): first miss is a gentle nudge, the next reveals the move —
 * plus a "show me" escape hatch any time. The drill ends when the taught tree runs out.
 *
 * Openings without named variations retain that behavior. A named-line opening instead
 * hides one random route, accepts its taught moves immediately, and uses Stockfish to judge
 * off-line moves. Sound alternatives continue against engine replies; weaker ideas get a
 * thematic nudge without being labelled "wrong".
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Chess, type Color, type Square } from "chess.js";
import { Board, type AttemptedMove } from "@/components/Board/Board";
import { classify } from "@/lib/classify";
import { lineToPositionEval } from "@/lib/engine/analysis";
import { ChessEngine } from "@/lib/engine/engine";
import {
  START_FEN,
  moverAt,
  mainChild,
  matchLearnerMove,
  pickOpeningLine,
  pickWeighted,
  readSteps,
  sanMatches,
  type BookMove,
  type Opening,
  type OpeningLine,
} from "@/lib/openings/tree";

type Tone = "neutral" | "good" | "warn";
interface Feedback {
  tone: Tone;
  text: string;
}

const BOT_DELAY_MS = 520;
const SIDELINE_ANALYSIS = { depth: 12, movetime: 500 } as const;

export function Drill(props: {
  opening: Opening;
  onReplayReadThrough: () => void;
}) {
  if (props.opening.lines?.length) return <VariationDrill {...props} />;
  return <BookDrill {...props} />;
}

function BookDrill({
  opening,
  onReplayReadThrough,
}: {
  opening: Opening;
  onReplayReadThrough: () => void;
}) {
  const orientation = opening.learnerSide as Color;
  const learnerName = opening.learnerSide === "w" ? "White" : "Black";
  const botLabel = opening.learnerSide === "w" ? "Black" : "White";

  const introText = `You're ${learnerName}. Play the ${opening.name} — ${
    opening.learnerSide === "w" ? "you're up first" : "I'll open and you respond"
  }, and I'll vary my replies to keep you honest.`;

  const gameRef = useRef(new Chess());
  const nodesRef = useRef<BookMove[] | undefined>(opening.root);
  const wrongRef = useRef(0);
  const reducedRef = useRef(false);

  const [fen, setFen] = useState(START_FEN);
  const [history, setHistory] = useState<string[]>([]);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [ply, setPly] = useState(0);
  const [status, setStatus] = useState<"playing" | "done">("playing");
  const [botThinking, setBotThinking] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>({ tone: "neutral", text: introText });

  useEffect(() => {
    reducedRef.current =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
  }, []);

  const finish = useCallback((text: string) => {
    setStatus("done");
    setBotThinking(false);
    setFeedback({ tone: "good", text });
  }, []);

  const restart = useCallback(() => {
    gameRef.current = new Chess();
    nodesRef.current = opening.root;
    wrongRef.current = 0;
    setLastMove(null);
    setStatus("playing");
    setBotThinking(false);
    setFeedback({ tone: "neutral", text: introText });
    setFen(gameRef.current.fen());
    setHistory([]);
    setPly(0);
  }, [opening, introText]);

  // ── The book bot's turn: pick a taught reply, after a short "thinking" beat. ──
  useEffect(() => {
    if (status !== "playing") return;
    if (moverAt(ply) === opening.learnerSide) return; // learner to move — wait for them
    const nodes = nodesRef.current;
    if (!nodes || nodes.length === 0) return;

    setBotThinking(true);
    const id = setTimeout(
      () => {
        const choice = pickWeighted(nodes);
        let applied;
        try {
          applied = gameRef.current.move(choice.san);
        } catch {
          setBotThinking(false);
          return;
        }
        nodesRef.current = choice.children;
        wrongRef.current = 0;
        setLastMove({ from: applied.from, to: applied.to });
        setFen(gameRef.current.fen());
        setHistory(gameRef.current.history());
        setBotThinking(false);
        if (!choice.children || choice.children.length === 0) {
          finish(
            `${botLabel} played ${choice.san}, and that's the end of the book — you steered the whole opening. That's a healthy position; go enjoy the middlegame.`,
          );
        } else {
          setFeedback({
            tone: "neutral",
            text: `${botLabel} replied ${choice.san}. Your move — find the book answer.`,
          });
          setPly((p) => p + 1);
        }
      },
      reducedRef.current ? 0 : BOT_DELAY_MS,
    );

    return () => {
      clearTimeout(id);
      setBotThinking(false);
    };
  }, [ply, status, opening.learnerSide, botLabel, finish]);

  const interactive =
    status === "playing" && moverAt(ply) === opening.learnerSide && !botThinking;

  // Recreated each render → always sees fresh state (no stale closures).
  function handleLearnerMove(attempt: AttemptedMove) {
    if (!interactive) return;
    const probe = new Chess(gameRef.current.fen());
    let mv;
    try {
      mv = probe.move({ from: attempt.from, to: attempt.to, promotion: attempt.promotion });
    } catch {
      return; // illegal — ignore
    }

    const match = matchLearnerMove(nodesRef.current, mv.san);
    if (!match) {
      wrongRef.current += 1;
      const main = mainChild(nodesRef.current);
      if (wrongRef.current >= 2 && main) {
        setFeedback({
          tone: "warn",
          text: `Not the book move. The line goes ${main.san}${
            main.hint ? ` — ${main.hint}` : ""
          } Give that a try.`,
        });
      } else {
        setFeedback({
          tone: "warn",
          text:
            main?.hint ??
            "That's not the book move here. Think about what this opening is trying to do, then try again.",
        });
      }
      return; // board stays put — we never touched gameRef
    }

    const applied = gameRef.current.move(match.san);
    nodesRef.current = match.children;
    wrongRef.current = 0;
    setLastMove({ from: applied.from, to: applied.to });
    setFen(gameRef.current.fen());
    setHistory(gameRef.current.history());
    if (!match.children || match.children.length === 0) {
      finish(
        `${match.san} — that's the book, all the way through. You played the whole opening cleanly. That's exactly the position you were after.`,
      );
    } else {
      setFeedback({
        tone: "good",
        text: match.note ?? "Book move — nicely done.",
      });
      setPly((p) => p + 1);
    }
  }

  function reveal() {
    const main = mainChild(nodesRef.current);
    if (!main) return;
    setFeedback({
      tone: "neutral",
      text: `The book move here is ${main.san}${main.hint ? ` — ${main.hint}` : ""}`,
    });
  }

  return (
    <div className="journey drill">
      <div className="journey-board-col">
        <div className="board-row">
          <Board
            fen={fen}
            orientation={orientation}
            interactive={interactive}
            lastMove={lastMove}
            onMove={handleLearnerMove}
          />
        </div>

        <DrillRibbon history={history} />

        <div className="journey-controls" role="group" aria-label="Drill controls">
          <button className="jbtn" onClick={restart}>
            <span aria-hidden="true">↺</span> Restart
          </button>
          <span className="journey-progress">
            {botThinking ? `${botLabel} thinking…` : status === "done" ? "Complete" : "Your line"}
          </span>
          <button className="jbtn" onClick={reveal} disabled={!interactive}>
            Show the move
          </button>
        </div>
      </div>

      <aside className="journey-panel" aria-label="Coach">
        <div className={`jfeedback bracket tone-${feedback.tone}`} aria-live="polite">
          <span className="jnote-label">
            {status === "done"
              ? "Drill complete"
              : feedback.tone === "warn"
                ? "Not quite"
                : feedback.tone === "good"
                  ? "Good"
                  : "Coach"}
          </span>
          <p className="jnote-text">{feedback.text}</p>
        </div>

        {status === "done" && (
          <div className="jdone-actions">
            <button className="btn btn-primary" onClick={restart}>
              Drill again
            </button>
            <button className="btn btn-ghost" onClick={onReplayReadThrough}>
              Back to the walkthrough
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}

/** Multi-line prototype: the variation stays hidden, exact taught moves pass instantly,
 * while Stockfish judges legal alternatives and takes over the reply if the player finds
 * a sound route of their own. */
function VariationDrill({
  opening,
  onReplayReadThrough,
}: {
  opening: Opening;
  onReplayReadThrough: () => void;
}) {
  const lines = opening.lines!;
  const orientation = opening.learnerSide as Color;
  const learnerName = opening.learnerSide === "w" ? "White" : "Black";
  const botLabel = opening.learnerSide === "w" ? "Black" : "White";
  const introText = `You're ${learnerName}. I've secretly chosen one of ${lines.length} real variations. Read the position and find a sound response — you don't have to copy the exact line.`;

  const gameRef = useRef(new Chess());
  const lineRef = useRef<OpeningLine>(pickOpeningLine(lines));
  const freeModeRef = useRef(false);
  const judgeRef = useRef<ChessEngine | null>(null);
  const replyRef = useRef<ChessEngine | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const generationRef = useRef(0);
  const reducedRef = useRef(false);

  const [fen, setFen] = useState(START_FEN);
  const [history, setHistory] = useState<string[]>([]);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [ply, setPly] = useState(0);
  const [status, setStatus] = useState<"playing" | "done">("playing");
  const [engineReady, setEngineReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>({
    tone: "neutral",
    text: introText,
  });

  useEffect(() => {
    reducedRef.current = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
    const judge = new ChessEngine();
    const reply = new ChessEngine();
    let active = true;
    judgeRef.current = judge;
    replyRef.current = reply;
    Promise.all([judge.init(), reply.init()])
      .then(() => {
        if (active) setEngineReady(true);
      })
      .catch(() => {
        if (active) {
          setEngineReady(true);
          setFeedback({
            tone: "warn",
            text: "The move checker could not start. You can still follow the taught variation, but sidelines cannot be assessed just now.",
          });
        }
      });

    return () => {
      active = false;
      abortRef.current?.abort();
      judge.terminate();
      reply.terminate();
    };
  }, [introText, lines]);

  const finish = useCallback(() => {
    const line = lineRef.current;
    const text = freeModeRef.current
      ? `That began as the ${line.name}, and your alternative kept a healthy position. You understood the ideas rather than merely copying the moves.`
      : `You navigated the ${line.name}. That was the hidden variation — and you found the full route.`;
    setStatus("done");
    setBusy(false);
    setFeedback({ tone: "good", text });
  }, []);

  const restart = useCallback(() => {
    abortRef.current?.abort();
    generationRef.current += 1;
    lineRef.current = pickOpeningLine(lines, Math.random, lineRef.current.id);
    freeModeRef.current = false;
    gameRef.current = new Chess();
    setFen(START_FEN);
    setHistory([]);
    setLastMove(null);
    setPly(0);
    setStatus("playing");
    setBusy(false);
    setFeedback({ tone: "neutral", text: introText });
  }, [introText, lines]);

  // Scripted replies keep the chosen variation coherent. Once a sound alternative leaves
  // the tree, Stockfish supplies the opponent's replies for the rest of the same depth.
  useEffect(() => {
    if (!engineReady || status !== "playing") return;
    if (moverAt(ply) === opening.learnerSide) return;

    const generation = generationRef.current;
    const controller = new AbortController();
    abortRef.current = controller;
    const timer = window.setTimeout(
      async () => {
        setBusy(true);
        try {
          let applied;
          if (freeModeRef.current) {
            const engineMove = await replyRef.current!.bestMove({
              fen: gameRef.current.fen(),
              skill: 16,
              depth: 11,
              movetime: 420,
              signal: controller.signal,
            });
            applied = gameRef.current.move({
              from: engineMove.from,
              to: engineMove.to,
              promotion: engineMove.promotion,
            });
          } else {
            const expected = lineRef.current.moves[ply];
            if (!expected) {
              finish();
              return;
            }
            applied = gameRef.current.move(expected);
          }

          if (controller.signal.aborted || generation !== generationRef.current) return;
          const nextPly = ply + 1;
          setLastMove({ from: applied.from, to: applied.to });
          setFen(gameRef.current.fen());
          setHistory(gameRef.current.history());
          setBusy(false);

          if (nextPly >= lineRef.current.moves.length || gameRef.current.isGameOver()) {
            finish();
            return;
          }

          setFeedback({
            tone: "neutral",
            text: freeModeRef.current
              ? `${botLabel} replied ${applied.san}. You're outside the memorised route now — keep choosing sound opening moves.`
              : `${botLabel} replied ${applied.san}. Read the new position and choose the best response.`,
          });
          setPly(nextPly);
        } catch (error) {
          if (controller.signal.aborted || generation !== generationRef.current) return;
          setBusy(false);
          if (error instanceof DOMException && error.name === "AbortError") return;
          finish();
        }
      },
      reducedRef.current ? 0 : BOT_DELAY_MS,
    );

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [botLabel, engineReady, finish, opening.learnerSide, ply, status]);

  const interactive =
    engineReady &&
    status === "playing" &&
    moverAt(ply) === opening.learnerSide &&
    !busy;

  function commitLearnerMove(san: string, text: string, leavesBook: boolean) {
    const applied = gameRef.current.move(san);
    if (leavesBook) freeModeRef.current = true;
    const nextPly = ply + 1;
    setLastMove({ from: applied.from, to: applied.to });
    setFen(gameRef.current.fen());
    setHistory(gameRef.current.history());
    setBusy(false);
    setFeedback({ tone: "good", text });

    if (nextPly >= lineRef.current.moves.length || gameRef.current.isGameOver()) {
      finish();
    } else {
      setPly(nextPly);
    }
  }

  async function handleLearnerMove(attempt: AttemptedMove) {
    if (!interactive) return;
    const beforeFen = gameRef.current.fen();
    const probe = new Chess(beforeFen);
    let attempted;
    try {
      attempted = probe.move({
        from: attempt.from,
        to: attempt.to,
        promotion: attempt.promotion,
      });
    } catch {
      return;
    }

    const expected = lineRef.current.moves[ply];
    if (!freeModeRef.current && expected && sanMatches(attempted.san, expected)) {
      const note = readSteps(opening, lineRef.current.id)[ply]?.move.note;
      commitLearnerMove(attempted.san, note ?? "That fits the position — keep going.", false);
      return;
    }

    const generation = generationRef.current;
    const controller = new AbortController();
    abortRef.current = controller;
    setBusy(true);
    setFeedback({ tone: "neutral", text: "Checking that idea against the position…" });

    try {
      const beforeLine = await judgeRef.current!.analyse({
        fen: beforeFen,
        ...SIDELINE_ANALYSIS,
        signal: controller.signal,
      });
      const afterFen = probe.fen();
      const afterLine = await judgeRef.current!.analyse({
        fen: afterFen,
        ...SIDELINE_ANALYSIS,
        signal: controller.signal,
      });
      if (controller.signal.aborted || generation !== generationRef.current) return;

      const playedUci = `${attempt.from}${attempt.to}${attempt.promotion ?? ""}`;
      const result = classify({
        evalBefore: lineToPositionEval(beforeLine, beforeFen).eval,
        evalAfter: lineToPositionEval(afterLine, afterFen).eval,
        mover: opening.learnerSide,
        isBest: beforeLine.bestMoveUci === playedUci,
      });

      if (result.quality === "best" || result.quality === "good") {
        commitLearnerMove(
          attempted.san,
          "That works — it's a sensible move and keeps a healthy position. We're leaving the prepared route, so I'll play the position from here.",
          true,
        );
        return;
      }

      const hint = readSteps(opening, lineRef.current.id)[ply]?.move.hint;
      setBusy(false);
      setFeedback({
        tone: "warn",
        text: `There's a stronger opening idea here. ${hint ?? "Look for the move that improves development or challenges the centre."} Try another move when you're ready.`,
      });
    } catch (error) {
      if (controller.signal.aborted || generation !== generationRef.current) return;
      setBusy(false);
      if (error instanceof DOMException && error.name === "AbortError") return;
      setFeedback({
        tone: "warn",
        text: "I couldn't assess that sideline just now. Try the thematic move, or use the hint below.",
      });
    }
  }

  async function reveal() {
    if (!interactive) return;
    if (!freeModeRef.current) {
      const expected = lineRef.current.moves[ply];
      const hint = readSteps(opening, lineRef.current.id)[ply]?.move.hint;
      setFeedback({
        tone: "neutral",
        text: `A thematic move here is ${expected}${hint ? ` — ${hint}` : "."}`,
      });
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setBusy(true);
    try {
      const currentFen = gameRef.current.fen();
      const line = await judgeRef.current!.analyse({
        fen: currentFen,
        ...SIDELINE_ANALYSIS,
        signal: controller.signal,
      });
      if (!line.bestMoveUci) throw new Error("No engine move");
      const helper = new Chess(currentFen);
      const strong = helper.move({
        from: line.bestMoveUci.slice(0, 2),
        to: line.bestMoveUci.slice(2, 4),
        promotion: line.bestMoveUci.slice(4) || undefined,
      });
      setFeedback({ tone: "neutral", text: `A strong move in this position is ${strong.san}.` });
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        setFeedback({ tone: "warn", text: "The engine hint isn't available just now." });
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="journey drill">
      <div className="journey-board-col">
        <div className="board-row">
          <Board
            fen={fen}
            orientation={orientation}
            interactive={interactive}
            lastMove={lastMove}
            onMove={handleLearnerMove}
          />
        </div>

        <DrillRibbon history={history} />

        <div className="journey-controls" role="group" aria-label="Variation drill controls">
          <button className="jbtn" onClick={restart}>
            <span aria-hidden="true">↺</span> New line
          </button>
          <span className="journey-progress" aria-live="polite">
            {!engineReady
              ? "Loading move checker…"
              : moverAt(ply) !== opening.learnerSide
                ? `${botLabel} thinking…`
                : busy
                  ? "Checking the idea…"
                : status === "done"
                  ? "Variation revealed"
                  : "Read the position"}
          </span>
          <button className="jbtn" onClick={reveal} disabled={!interactive}>
            Show a hint
          </button>
        </div>
      </div>

      <aside className="journey-panel" aria-label="Coach">
        <div className="variation-blind-tag">
          <span aria-hidden="true">◈</span>
          Hidden line · {lines.length} possibilities
        </div>
        <div className={`jfeedback bracket tone-${feedback.tone}`} aria-live="polite">
          <span className="jnote-label">
            {status === "done"
              ? "Variation revealed"
              : busy
                ? "Engine check"
                : feedback.tone === "warn"
                  ? "Try another idea"
                  : feedback.tone === "good"
                    ? "Sound move"
                    : "Coach"}
          </span>
          <p className="jnote-text">{feedback.text}</p>
        </div>

        {status === "done" && (
          <div className="jdone-actions">
            <button className="btn btn-primary" onClick={restart}>
              Try another line
            </button>
            <button className="btn btn-ghost" onClick={onReplayReadThrough}>
              Back to the walkthrough
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}

/** Live move ribbon built from the played history (SAN), grouped by full move. */
function DrillRibbon({ history }: { history: string[] }) {
  if (history.length === 0) {
    return (
      <div className="move-ribbon empty" aria-hidden="true">
        <span className="ribbon-chip start cur">◆</span>
      </div>
    );
  }
  return (
    <div className="move-ribbon" role="group" aria-label="Moves played">
      {history.map((san, i) => (
        <span key={i} className="ribbon-chip done">
          {i % 2 === 0 && <span className="ribbon-n">{Math.floor(i / 2) + 1}.</span>}
          {san}
        </span>
      ))}
    </div>
  );
}
