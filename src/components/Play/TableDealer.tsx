"use client";

/**
 * "Deal a table" — the generative-table control (Play tab). Subsumes the old board
 * randomizer into one verb: deal a complete, one-of-a-kind world (board + chrome + pieces),
 * invented live by Claude. Reset returns the classic Deep-Space deck. Ephemeral — nothing
 * is saved; the classic look is always the default.
 */

import type { GameTable } from "./useGameTable";

export function TableDealer({ table }: { table: GameTable }) {
  const { spec, dealing, deal, reset } = table;
  return (
    <section className="card table-dealer" aria-label="Table appearance">
      <div className="card-head">
        <h2>Table</h2>
        <span className="tag mono">{spec ? spec.name : "Deep-Space · classic"}</span>
      </div>

      <div className="dealer-body">
        {spec && (
          <p className="dealer-flavor" dangerouslySetInnerHTML={{ __html: spec.flavor }} />
        )}
        <div className="dealer-actions">
          <button type="button" className="deal-btn" onClick={deal} disabled={dealing}>
            <span className="ic" aria-hidden="true">
              {dealing ? "✦" : "↻"}
            </span>{" "}
            {dealing ? "Inventing…" : "Deal a table"}
          </button>
          <button type="button" onClick={reset} disabled={dealing || !spec}>
            Reset
          </button>
        </div>
        <p className="dealer-note mono">A fresh world invented for this game · ~15–30s</p>
      </div>
    </section>
  );
}
