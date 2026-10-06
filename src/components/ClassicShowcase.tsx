"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Image from "next/image";
import { CLASSIC_GAMES } from "@/content/classic-games";
import { FILES, GLYPH, pieceName } from "@/lib/chess/pieces";
import {
  buildClassicReplay, CLASSIC_MOVE_INTERVAL_MS, CLASSIC_START, pickClassicIndex,
  type ReplayPiece,
} from "@/lib/chess/classic-replay";

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
const SQUARES = Array.from({ length: 64 }, (_, index) => ({
  file: index % 8,
  rank: 8 - Math.floor(index / 8),
  square: `${FILES[index % 8]}${8 - Math.floor(index / 8)}`,
}));

function Piece({ piece, captured = false }: { piece: ReplayPiece; captured?: boolean }) {
  const file = piece.square.charCodeAt(0) - 97;
  const row = 8 - Number(piece.square[1]);
  return (
    <span
      className={`classic-piece ${piece.color}${captured ? " classic-captured" : ""}`}
      style={{ transform: `translate(${file * 100}%, ${row * 100}%)` }}
      aria-hidden="true"
      data-square={piece.square}
      data-piece={`${piece.color}${piece.type}`}
    >
      <span className="classic-token">{GLYPH[piece.type]}</span>
    </span>
  );
}

export function ClassicShowcase({ intro }: { intro: ReactNode }) {
  const [gameIndex, setGameIndex] = useState<number | null>(null);
  const [ply, setPly] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [stepping, setStepping] = useState(false);
  const game = gameIndex === null ? null : CLASSIC_GAMES[gameIndex];
  const frames = useMemo(() => game ? buildClassicReplay(game.pgn) : [CLASSIC_START], [game]);
  const frame = frames[ply];
  const total = frames.length - 1;
  const finished = game !== null && ply === total;

  useEffect(() => {
    // Select in the browser after hydration: static/CDN caching must not pin one game
    // for all visitors, and random SSR/client selections must never disagree.
    const media = window.matchMedia(REDUCED_MOTION);
    const boot = window.requestAnimationFrame(() => {
      setGameIndex(pickClassicIndex(CLASSIC_GAMES.length));
      setPlaying(!media.matches);
    });
    const onPreferenceChange = () => { if (media.matches) setPlaying(false); };
    media.addEventListener("change", onPreferenceChange);
    return () => {
      window.cancelAnimationFrame(boot);
      media.removeEventListener("change", onPreferenceChange);
    };
  }, []);

  useEffect(() => {
    if (!game || !playing || finished) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const schedule = () => {
      clearTimeout(timer);
      if (document.hidden) return;
      timer = setTimeout(() => {
        setStepping(false);
        setPly(previous => Math.min(previous + 1, total));
      }, CLASSIC_MOVE_INTERVAL_MS);
    };
    schedule();
    document.addEventListener("visibilitychange", schedule);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", schedule);
    };
  }, [game, playing, finished, ply, total]);

  function togglePlayback() {
    if (finished) { setStepping(true); setPly(0); setPlaying(true); }
    else setPlaying(value => !value);
  }

  function step(delta: number) {
    setPlaying(false);
    setStepping(true);
    setPly(previous => Math.max(0, Math.min(total, previous + delta)));
  }

  function anotherGame() {
    setPlaying(!window.matchMedia(REDUCED_MOTION).matches);
    setPly(0);
    setStepping(true);
    setGameIndex(pickClassicIndex(CLASSIC_GAMES.length, gameIndex ?? undefined));
  }

  const boardDescription = `${frame.label}. ${frame.pieces.map(piece =>
    `${pieceName(piece.color, piece.type)} on ${piece.square}`,
  ).join(", ")}.`;
  const resultLabel = game?.result === "1-0" ? "White wins" : game?.result === "0-1" ? "Black wins" : "Draw";

  return (
    <section className="classic-showcase" aria-label="Watch a classic chess game">
      {intro}
      <div className="classic-visual">
        <div className="classic-stage">
          <div className="classic-table">
            <div className={`classic-board${stepping ? " is-stepping" : ""}`} role="img" aria-label={boardDescription}>
              {SQUARES.map(({ file, rank, square }) => (
                <div
                  key={square}
                  className={`classic-square ${(file + rank) % 2 === 0 ? "light" : "dark"}${
                    frame.lastMove?.from === square || frame.lastMove?.to === square ? " last-move" : ""
                  }`}
                  aria-hidden="true"
                >
                  {file === 0 && <span className="classic-coordinate rank">{rank}</span>}
                  {rank === 1 && <span className="classic-coordinate file">{FILES[file]}</span>}
                </div>
              ))}
              {frame.pieces.map(piece => <Piece key={`${game?.id}-${piece.id}`} piece={piece} />)}
              {frame.captured && !stepping && <Piece key={`capture-${game?.id}-${ply}`} piece={frame.captured} captured />}
            </div>
            <span className="classic-corner top" aria-hidden="true" />
            <span className="classic-corner bottom" aria-hidden="true" />
          </div>
        </div>
        <div className="classic-playback">
          <div className="classic-now">
            <span className="classic-san">{ply ? frame.label : "Opening position"}</span>
            <span>{finished ? `${resultLabel} · ${game.result}` : `${Math.ceil(ply / 2)} / ${Math.ceil(total / 2)} moves`}</span>
          </div>
          <div className="classic-controls" aria-label="Game playback">
            <button type="button" className="classic-step" onClick={() => step(-1)} disabled={!game || ply === 0} aria-label="Previous move">←</button>
            <button type="button" className="classic-toggle" onClick={togglePlayback} disabled={!game}>
              {finished ? "Replay" : playing ? "Pause" : "Play"}
            </button>
            <button type="button" className="classic-step" onClick={() => step(1)} disabled={!game || finished} aria-label="Next move">→</button>
          </div>
          <progress className="classic-progress" value={ply} max={total || 1} aria-label="Game replay progress" />
        </div>
      </div>
      <aside className="classic-story" aria-label="Featured game" aria-busy={!game}>
        <div className="classic-kicker"><span aria-hidden="true" />{finished ? "A classic, complete" : "From the chess archives"}</div>
        <h2>{game?.title ?? "A great game awaits."}</h2>
        <div className="classic-context">
          <div>
            <dl className="classic-players">
              <div><dt><span className="classic-side white" aria-hidden="true" />White</dt><dd>{game?.white ?? "—"}</dd></div>
              <div><dt><span className="classic-side black" aria-hidden="true" />Black</dt><dd>{game?.black ?? "—"}</dd></div>
            </dl>
            <p className="classic-event">{game ? <>{game.event}<br />{game.location} · {game.year}</> : "Choosing one of ten classics…"}</p>
          </div>
          {game && <figure className="classic-photo">
            <a href={game.photo.sourceUrl} target="_blank" rel="noopener noreferrer" aria-label={`View image source: ${game.photo.caption}`}>
              <Image key={game.id} src={game.photo.src} alt={game.photo.alt} width={game.photo.width} height={game.photo.height} sizes="(max-width: 420px) 112px, 152px" />
            </a>
            <figcaption>{game.photo.caption}<a href="/images/classics/credits.txt" target="_blank" rel="noopener noreferrer">Image credits ↗</a></figcaption>
          </figure>}
        </div>
        <div className="classic-links">
          {game && <a href={game.sourceUrl} target="_blank" rel="noopener noreferrer">Game & story <span aria-hidden="true">↗</span></a>}
          <button type="button" onClick={anotherGame} disabled={!game}>Another classic <span aria-hidden="true">↻</span></button>
        </div>
        <span className="classic-pace">One move every {CLASSIC_MOVE_INTERVAL_MS / 1000} seconds.</span>
        <noscript>Enable JavaScript to watch the complete games.</noscript>
      </aside>
    </section>
  );
}
