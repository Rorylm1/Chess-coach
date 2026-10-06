"use client";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Chess } from "chess.js";
import { Board, type AttemptedMove } from "@/components/Board/Board";
import { Reveal } from "@/components/Reveal";
import type { Opening } from "@/lib/openings/tree";
import {
  acceptsMove,
  british,
  learnerTurn,
  matchingLines,
  positionAt,
  resolveAttempt,
  type OpeningCourse,
  type OpeningGame,
  type OpeningHistory,
  type OpeningLesson,
} from "@/lib/openings/lessons";
import { pickMixedLine, progressId } from "@/lib/openings/lesson-progress";
import { useProgress } from "./useProgress";
import s from "./lessons.module.css";

type Mode = "learn" | "practice" | "game";
export function OpeningLessons({
  opening,
  course,
  preview = false,
}: {
  opening: Opening;
  course: OpeningCourse;
  preview?: boolean;
}) {
  const [lineId, setLineId] = useState(course.lessons[0].id);
  const [mode, setMode] = useState<Mode>("learn");
  const [run, setRun] = useState(0);
  const progress = useProgress(opening.slug);
  const line = course.lessons.find((line) => line.id === lineId)!;
  function selectLine(id: string) {
    setLineId(id);
    setMode("learn");
    setRun((n) => n + 1);
  }
  function practise(next = line) {
    progress.start(next);
    setLineId(next.id);
    setMode("practice");
    setRun((n) => n + 1);
  }
  const learnt = course.lessons.filter(
    (line) => progress.progress[progressId(line)]?.studied,
  ).length;
  const record = progress.progress[progressId(line)];
  const name = british(opening.name);
  return (
    <div className={`${s.shell} wrap`}>
      <div className={s.breadcrumb}>
        <Link href="/openings">← All openings</Link>
        {preview && <span className={s.previewTag}>Design preview</span>}
      </div>
      <header className={s.header}>
        <div className={s.heading}>
          <h1>
            {name.slice(0, name.lastIndexOf(" "))}{" "}
            <span>{name.slice(name.lastIndexOf(" ") + 1)}</span>
          </h1>
        </div>
      </header>
      <div className={s.toolbar}>
        {mode !== "game" ? (
          <>
            <div className={s.linePicker}>
              <label htmlFor="lesson-line">Line</label>
              <select
                id="lesson-line"
                value={lineId}
                onChange={(event) => selectLine(event.target.value)}
              >
                {course.lessons.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                    {progress.progress[progressId(item)]?.clean ? " ✓" : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className={s.modeSwitch} role="group" aria-label="Lesson mode">
              <button
                aria-pressed={mode === "learn"}
                onClick={() => setMode("learn")}
              >
                Walkthrough
              </button>
              <button
                aria-pressed={mode === "practice"}
                onClick={() => practise()}
              >
                Play it yourself
              </button>
            </div>
          </>
        ) : (
          <button className={s.backToLesson} onClick={() => setMode("learn")}>
            ← Back to lesson
          </button>
        )}
      </div>
      {mode === "game" ? (
        <GameReplay game={course.game} />
      ) : (
        <>
          <LessonWorkspace
            key={`${line.id}-${mode}-${run}`}
            opening={opening}
            course={course}
            line={line}
            mode={mode}
            onStudy={() => progress.study(line)}
            onComplete={(assisted) => progress.complete(line, assisted)}
            onPractice={() => practise()}
            onRestart={() => practise()}
            onSelect={selectLine}
          />
          <details className={s.practiceOptions}>
            <summary>
              Practice options
              {record?.clean
                ? " · completed without hints"
                : record?.assisted
                  ? " · completed with help"
                  : ""}
            </summary>
            <div className={s.mix}>
              <p>
                {learnt < 2
                  ? "Walk through two lines to unlock mixed practice."
                  : `${learnt} learnt lines · progress saved on this device`}
              </p>
              <button
                disabled={learnt < 2}
                onClick={() => {
                  const next = pickMixedLine(
                    course.lessons,
                    progress.progress,
                    line.id,
                  );
                  if (next) practise(next);
                }}
              >
                Mix learnt lines ↗
              </button>
              <button onClick={progress.reset}>Reset progress</button>
            </div>
          </details>
        </>
      )}
      {mode !== "game" && (
        <details className={s.extras}>
          <summary>Famous game</summary>
          <div className={s.gameTeaser}>
            <span className={s.kicker}>
              {course.game.year} · {course.game.result}
            </span>
            <h2>{course.game.title}</h2>
            <p>{course.game.intro}</p>
            <button
              onClick={() => {
                setMode("game");
                window.scrollTo({ top: 0, behavior: "instant" });
              }}
            >
              Watch the game →
            </button>
          </div>
        </details>
      )}
      <details className={s.extras}>
        <summary>Plans, pieces &amp; common traps</summary>
        <div className={s.themes}>
          {Object.entries(opening.panels).map(([key, value]) => (
            <div key={key}>
              <h2>{typeof value === "string" ? key : value.name}</h2>
              <p>{british(typeof value === "string" ? value : value.text)}</p>
            </div>
          ))}
          <a href={course.source} target="_blank" rel="noreferrer">
            Opening reference ↗
          </a>
        </div>
      </details>
    </div>
  );
}

function History({ history }: { history: OpeningHistory }) {
  return (
    <aside className={s.history} aria-label="The story behind the opening">
      <div className={s.historyIntro}>
        <div className={s.portrait}>
          <Image
            src={history.image.src}
            alt={history.image.alt}
            width={history.image.width}
            height={history.image.height}
            sizes="106px"
          />
        </div>
        <div className={s.historyText}>
          <span className={s.kicker}>Opening history · {history.era}</span>
          <h2>{history.title}</h2>
          <p>{history.text}</p>
          <details className={s.historyDetails}>
            <summary>
              Sources &amp; portrait <span aria-hidden="true">↗</span>
            </summary>
            <div>
              <p>{history.image.caption}</p>
              <p className={s.credit}>
                {history.image.credit} ·{" "}
                <a
                  href={history.image.licenceUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  {history.image.licence}
                </a>
                . Displayed in monochrome.
              </p>
              <a href={history.source} target="_blank" rel="noreferrer">
                Opening history ↗
              </a>
              <a href={history.image.source} target="_blank" rel="noreferrer">
                Image source ↗
              </a>
            </div>
          </details>
        </div>
      </div>
    </aside>
  );
}

function LessonWorkspace({
  opening,
  course,
  line,
  mode,
  onStudy,
  onComplete,
  onPractice,
  onRestart,
  onSelect,
}: {
  opening: Opening;
  course: OpeningCourse;
  line: OpeningLesson;
  mode: "learn" | "practice";
  onStudy: () => void;
  onComplete: (assisted: boolean) => void;
  onPractice: () => void;
  onRestart: () => void;
  onSelect: (id: string) => void;
}) {
  const [ply, setPly] = useState(0);
  const [extra, setExtra] = useState<ReturnType<typeof resolveAttempt>>(null);
  const [feedback, setFeedback] = useState("");
  const [assisted, setAssisted] = useState(false);
  const [warning, setWarning] = useState(false);
  const [notation, setNotation] = useState("");
  const [alternative, setAlternative] = useState<OpeningLesson | null>(null);
  const side = opening.learnerSide;
  const learner = side === "w" ? "White" : "Black";
  const opponent = side === "w" ? "Black" : "White";
  const atEnd = ply === line.moves.length;
  const thinking = mode === "practice" && !atEnd && !learnerTurn(side, ply);
  const interactive = mode === "practice" && !extra && !thinking;
  const position = useMemo(
    () => extra ?? positionAt(line.moves, ply),
    [extra, line.moves, ply],
  );
  const legal = useMemo(
    () => (interactive ? new Chess(position.fen).moves() : []),
    [interactive, position.fen],
  );
  useEffect(() => {
    if (!thinking) return;
    const delay = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? 0
      : 450;
    const timer = setTimeout(() => {
      setPly((p) => p + 1);
      setFeedback("");
      setNotation("");
    }, delay);
    return () => clearTimeout(timer);
  }, [thinking, ply]);
  function jump(next: number) {
    setPly(next);
    if (next === line.moves.length) onStudy();
  }
  function attempt(move: AttemptedMove) {
    if (!interactive) return;
    const result = resolveAttempt(position.fen, move);
    if (!result) return;
    if (!acceptsMove(line, ply, result.san)) {
      setWarning(true);
      setAssisted(true);
      setAlternative(
        atEnd
          ? null
          : (matchingLines(
              course.lessons,
              line.moves.slice(0, ply),
              result.san,
            ).find((candidate) => candidate.id !== line.id) ?? null),
      );
      setFeedback(
        atEnd
          ? "That move is outside this challenge’s prepared answers. Use a hint to find the plan."
          : `That is a different continuation. Here we’re practising ${line.name}.`,
      );
      return;
    }
    setWarning(false);
    setAlternative(null);
    setNotation("");
    if (atEnd) {
      setExtra(result);
      setFeedback(line.challenge.explanation);
      onComplete(assisted);
    } else {
      setPly((p) => p + 1);
      setFeedback("");
    }
  }
  function playNotation() {
    const move = new Chess(position.fen)
      .moves({ verbose: true })
      .find((m) => m.san === notation);
    if (move)
      attempt({
        from: move.from,
        to: move.to,
        promotion: move.promotion as AttemptedMove["promotion"],
      });
  }
  return (
    <div className={`journey ${s.walkthrough}`}>
      <section className="journey-board-col" aria-label="Lesson board">
        <div
          className="board-row"
          data-pieceset="cburnett"
          data-pieces="filled"
        >
          <Board
            fen={position.fen}
            orientation={side}
            interactive={interactive}
            lastMove={position.lastMove}
            onMove={attempt}
            pieceStyle="classic-staunton"
          />
        </div>
        {mode === "learn" ? (
          <>
            <MoveRibbon moves={line.moves} ply={ply} onJump={jump} />
            <div
              className="journey-controls"
              role="group"
              aria-label="Walk the line"
            >
              <button
                className="jbtn"
                disabled={!ply}
                onClick={() => jump(ply - 1)}
              >
                ← Back
              </button>
              <span className="journey-progress">
                {ply} / {line.moves.length}
              </span>
              <button
                className="jbtn"
                disabled={atEnd}
                onClick={() => jump(ply + 1)}
              >
                Next →
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="journey-controls">
              <button className="jbtn" onClick={onRestart}>
                ↺ Restart
              </button>
              <span className="journey-progress">
                {extra
                  ? "Line complete"
                  : thinking
                    ? `${opponent} to move`
                    : `${learner} to move`}
              </span>
            </div>
            <details className={s.moveDetails}>
              <summary>Move list</summary>
              <MoveRibbon
                moves={[
                  ...line.moves.slice(0, ply),
                  ...(extra ? [extra.san] : []),
                ]}
                ply={ply + (extra ? 1 : 0)}
              />
            </details>
            {!extra && (
              <details className={s.notation}>
                <summary>Play by notation</summary>
                <div>
                  <label htmlFor="lesson-move">Legal move</label>
                  <select
                    id="lesson-move"
                    value={notation}
                    disabled={!interactive}
                    onChange={(event) => setNotation(event.target.value)}
                  >
                    <option value="">Choose a move</option>
                    {legal.map((san) => (
                      <option key={san}>{san}</option>
                    ))}
                  </select>
                  <button
                    onClick={playNotation}
                    disabled={!interactive || !notation}
                  >
                    Play move
                  </button>
                </div>
              </details>
            )}
          </>
        )}
      </section>
      <aside className="journey-panel" aria-label="Opening guide">
        {mode === "learn" ? (
          <>
            <Reveal key={ply} delay={0}>
              <div className="jnote bracket" aria-live="polite">
                <span className="jnote-label">
                  {!ply ? (
                    "The idea"
                  ) : (
                    <>
                      {learnerTurn(side, ply - 1)
                        ? "You play"
                        : `${opponent} plays`}
                      <span className="jnote-move">
                        {Math.ceil(ply / 2)}
                        {ply % 2 ? "." : "…"} {line.moves[ply - 1]}
                      </span>
                    </>
                  )}
                </span>
                <p className="jnote-text">
                  {british(!ply ? line.idea : line.notes[ply - 1])}
                </p>
              </div>
            </Reveal>
            {atEnd && (
              <button className="btn btn-primary" onClick={onPractice}>
                Now play it yourself →
              </button>
            )}
          </>
        ) : (
          <div
            className={`jnote bracket ${warning ? s.warning : ""}`}
            aria-live="polite"
          >
            <span className="jnote-label">
              {extra
                ? "Line complete"
                : atEnd
                  ? "One more move"
                  : `You play ${learner}`}
            </span>
            <p className="jnote-text">
              {feedback ||
                (thinking
                  ? `${opponent} is making its reply…`
                  : atEnd
                    ? line.challenge.prompt
                    : `Play the next ${learner} move in ${line.name}.`)}
            </p>
            {extra ? (
              <>
                <p className={s.completion}>
                  {assisted
                    ? "Completed with help. Try again to recall it unaided."
                    : "Completed without hints."}
                </p>
                <button
                  className="btn btn-primary"
                  onClick={() =>
                    onSelect(
                      course.lessons[
                        (course.lessons.indexOf(line) + 1) %
                          course.lessons.length
                      ].id,
                    )
                  }
                >
                  Explore the next line →
                </button>
              </>
            ) : (
              <div className={s.hintActions}>
                <button
                  disabled={!interactive}
                  onClick={() => {
                    setAssisted(true);
                    setWarning(false);
                    setFeedback(atEnd ? line.challenge.hint : line.notes[ply]);
                  }}
                >
                  Give me a hint
                </button>
                <button
                  disabled={!interactive}
                  onClick={() => {
                    setAssisted(true);
                    setWarning(false);
                    setFeedback(
                      `Try ${atEnd ? line.challenge.answers.join(" or ") : line.moves[ply]}.`,
                    );
                  }}
                >
                  Show the move
                </button>
                {alternative && (
                  <button onClick={() => onSelect(alternative.id)}>
                    Learn {alternative.name} →
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </aside>
      <History history={course.history} />
    </div>
  );
}

function MoveRibbon({
  moves,
  ply,
  onJump,
}: {
  moves: string[];
  ply: number;
  onJump?: (ply: number) => void;
}) {
  return (
    <div className="move-ribbon" role="group" aria-label="Selected line moves">
      {onJump && (
        <button
          className={`ribbon-chip start${!ply ? " cur" : ""}`}
          onClick={() => onJump(0)}
          aria-label="Starting position"
        >
          ◆
        </button>
      )}
      {moves.map((san, index) => {
        const content = (
          <>
            {index % 2 === 0 && (
              <span className="ribbon-n">{Math.floor(index / 2) + 1}.</span>
            )}
            {san}
          </>
        );
        return onJump ? (
          <button
            key={index}
            className={`ribbon-chip${ply === index + 1 ? " cur" : ""}${ply > index ? " done" : ""}`}
            onClick={() => onJump(index + 1)}
            aria-current={ply === index + 1 ? "step" : undefined}
            aria-label={`Go to move ${Math.floor(index / 2) + 1}, ${index % 2 ? "Black" : "White"} ${san}`}
          >
            {content}
          </button>
        ) : (
          <span key={index} className="ribbon-chip done">
            {content}
          </span>
        );
      })}
    </div>
  );
}

function GameReplay({ game }: { game: OpeningGame }) {
  const moves = useMemo(() => {
    const chess = new Chess();
    chess.loadPgn(game.pgn);
    return chess.history();
  }, [game.pgn]);
  const [ply, setPly] = useState(0);
  const position = useMemo(() => positionAt(moves, ply), [moves, ply]);
  const notes = Object.entries(game.notes);
  const note = notes.filter(([step]) => Number(step) <= ply).at(-1)?.[1];
  return (
    <div className={`journey ${s.walkthrough}`}>
      <section className="journey-board-col" aria-label="Famous game replay">
        <div
          className="board-row"
          data-pieceset="cburnett"
          data-pieces="filled"
        >
          <Board
            fen={position.fen}
            orientation="w"
            interactive={false}
            lastMove={position.lastMove}
            onMove={() => {}}
            pieceStyle="classic-staunton"
          />
        </div>
        <div className="journey-controls">
          <button
            className="jbtn"
            disabled={!ply}
            onClick={() => setPly((p) => p - 1)}
          >
            ← Back
          </button>
          <span className="journey-progress">
            {ply} / {moves.length}
          </span>
          <button
            className="jbtn"
            disabled={ply === moves.length}
            onClick={() => setPly((p) => p + 1)}
          >
            Next →
          </button>
        </div>
        <details className={s.moveDetails}>
          <summary>Move list</summary>
          <MoveRibbon moves={moves} ply={ply} onJump={setPly} />
        </details>
      </section>
      <aside className="journey-panel">
        <div className={s.gameIntro}>
          <span className={s.kicker}>
            {game.year} · {game.result}
          </span>
          <h2>{game.title}</h2>
          <p>{game.event}</p>
          <p>{game.intro}</p>
        </div>
        <div
          className={s.gameChapters}
          role="group"
          aria-label="Game highlights"
        >
          {notes.map(([step]) => (
            <button
              key={step}
              onClick={() => setPly(Number(step))}
              aria-pressed={ply === Number(step)}
            >
              Move {Math.ceil(Number(step) / 2)}
              {Number(step) % 2 ? "." : "…"} {moves[Number(step) - 1]} →
            </button>
          ))}
          <button onClick={() => setPly(moves.length)}>Final position →</button>
        </div>
        <div className="jnote bracket" aria-live="polite">
          <p className="jnote-text">
            {note ??
              "Start from the initial position, or choose a highlighted move."}
          </p>
        </div>
        <a
          className={s.sourceLink}
          href={game.source}
          target="_blank"
          rel="noreferrer"
        >
          Original game score ↗
        </a>
      </aside>
    </div>
  );
}
