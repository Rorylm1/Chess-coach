import type { Color, PieceSymbol } from "chess.js";
import { GLYPH } from "@/lib/chess/pieces";

/** A plain SAN move log for hot-seat — no classification colours, no engine. */
export function HumanMoves({ history }: { history: string[] }) {
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

export function PlayerStrip({
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
