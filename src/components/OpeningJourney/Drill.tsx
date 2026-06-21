"use client";

/**
 * Recall-drill phase of an opening journey (M5).
 *
 * You play your side against a scripted "book bot" — no engine. The bot picks among the
 * curated taught replies (weighted by popularity via `pickWeighted`), so it varies its
 * tries but only ever inside lines the read-through taught. A non-book move is rejected
 * (the board doesn't move): first miss is a gentle nudge, the next reveals the move —
 * plus a "show me" escape hatch any time. The drill ends when the taught tree runs out.
 *
 * chess.js is the authority for the live position (gameRef); React state mirrors what the
 * board needs. `nodesRef` tracks the current set of book continuations to match/pick from.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Chess, type Color, type Square } from "chess.js";
import { Board, type AttemptedMove } from "@/components/Board/Board";
import {
  START_FEN,
  moverAt,
  mainChild,
  matchLearnerMove,
  pickWeighted,
  type BookMove,
  type Opening,
} from "@/lib/openings/tree";

type Tone = "neutral" | "good" | "warn";
interface Feedback {
  tone: Tone;
  text: string;
}

const BOT_DELAY_MS = 520;

export function Drill({
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
