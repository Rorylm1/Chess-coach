"use client";

/**
 * The board randomizer (Play tab) invents a complete world: board, interface and pieces.
 * Reset returns the classic Deep-Space deck. Ephemeral — nothing
 * is saved; the classic look is always the default.
 */

import type { GameTable } from "./useGameTable";

export function TableDealer({ table }: { table: GameTable }) {
  const { spec, dealing, fallback, error, deal, reset } = table;
  return (
    <section className="card table-dealer" aria-label="Board randomizer">
      <div className="card-head">
        <h2>Board randomizer</h2>
        <span className="tag mono">{spec ? spec.name : "Deep-Space · classic"}</span>
      </div>

      <div className="dealer-body">
        {spec && (
          <p className="dealer-flavor">
            {spec.flavor.split(/(<em>.*?<\/em>)/g).map((part, index) =>
              part.startsWith("<em>") && part.endsWith("</em>")
                ? <em key={index}>{part.slice(4, -5)}</em>
                : part,
            )}
          </p>
        )}
        <div className="dealer-actions">
          <button type="button" className="deal-btn" onClick={deal} disabled={dealing}>
            <span className="ic" aria-hidden="true">
              {dealing ? "✦" : "↻"}
            </span>{" "}
            {dealing ? "Dreaming…" : error ? "Try again" : "Randomize board"}
          </button>
          <button type="button" onClick={reset} disabled={dealing || !spec}>
            Reset
          </button>
        </div>
        {error ? <p className="dealer-error" role="alert">{error}</p> : null}
        <p className="dealer-note mono" role="status" aria-live="polite">
          {dealing
            ? "New pieces, colours & atmosphere on the way…"
            : fallback
              ? "Shuffled from the built-in worlds · AI is unavailable"
              : "A little chess magic · new pieces, colours & atmosphere · ~15–30s"}
        </p>
      </div>
    </section>
  );
}
