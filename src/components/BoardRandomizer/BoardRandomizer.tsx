"use client";

/**
 * "Dealer's roll" — the board randomizer control (M6, Feature 1; direction A, locked).
 * One verb: Reroll a one-of-a-kind board. Reset returns the classic Deep-Space deck, and
 * a rolled board carries a short shareable seed (the M7 live-link will reuse it). The board
 * itself is the canvas; this is the slim control beside it.
 */

import { useCallback, useEffect, useState } from "react";
import type { BoardThemeControls } from "./useBoardTheme";

export function BoardRandomizer({ theme, reroll, reset }: BoardThemeControls) {
  const [copied, setCopied] = useState(false);

  // Clear the "Copied" confirmation after a moment.
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(t);
  }, [copied]);

  const copyLink = useCallback(async () => {
    if (theme.isClassic) return;
    const url = `${window.location.origin}${window.location.pathname}?b=${encodeURIComponent(theme.seed)}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      // clipboard blocked — no-op; the seed is still visible in the nameplate.
    }
  }, [theme.isClassic, theme.seed]);

  return (
    <section className="card board-roller" aria-label="Board appearance">
      <div className="card-head">
        <h2>Board</h2>
        <span className="tag mono">{theme.name}</span>
      </div>

      <div className="roller-body">
        <span className="roller-swatches" aria-hidden="true">
          <i style={{ background: theme.vars["--sq-light"] }} />
          <i style={{ background: theme.vars["--sq-dark"] }} />
          <i style={{ background: theme.vars["--board-accent"] }} />
        </span>

        <div className="roller-actions">
          <button type="button" className="roll-btn" onClick={reroll}>
            <span className="ic" aria-hidden="true">
              ↻
            </span>{" "}
            Reroll
          </button>
          <button type="button" onClick={reset} disabled={theme.isClassic}>
            Reset
          </button>
        </div>

        <button
          type="button"
          className="roller-share"
          onClick={copyLink}
          disabled={theme.isClassic}
          aria-label={theme.isClassic ? "Roll a board to get a shareable link" : "Copy a shareable link to this board"}
        >
          <span className="ic" aria-hidden="true">
            {copied ? "✓" : "⧉"}
          </span>{" "}
          {copied ? "Link copied" : theme.isClassic ? "Roll to share a board" : "Copy board link"}
        </button>
      </div>
    </section>
  );
}
