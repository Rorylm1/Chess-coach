"use client";

/**
 * Owns the per-game board randomizer (Play tab only). Clicking randomize asks the server to
 * invent a fresh design (POST /api/table), loads whatever Google Fonts it chose, then applies
 * it. EPHEMERAL by design: nothing is persisted — the classic Deep-Space look is always the
 * default, and a dealt table lasts only for this view. `sweepKey` bumps on each deal/reset so
 * the Board replays its re-tint sweep. Subsumes the old board-only randomizer.
 */

import { useCallback, useRef, useState } from "react";
import { fontsOf, type TableSpec } from "@/lib/table/spec";
import type { RecentTable } from "@/lib/table/brief";

// The default uses classic chess glyphs. Treat them as the classic silhouette family
// so the very first randomization also requests a visible change in the pieces.
const CLASSIC_TABLE: RecentTable = {
  name: "Deep-Space · classic",
  pieceStyle: "classic-staunton",
  bg: "#0a0e14",
  boardLight: "#5c7382",
  boardDark: "#1b2733",
  frame: "glow",
  fontDisplay: "Chakra Petch",
};

function summarize(spec: TableSpec): RecentTable {
  const { name, pieceStyle, bg, boardLight, boardDark, frame, fontDisplay, brief } = spec;
  return { name, pieceStyle, bg, boardLight, boardDark, frame, fontDisplay, brief };
}

const loaded = new Set<string>();
export function loadFonts(spec: TableSpec) {
  for (const name of fontsOf(spec)) {
    if (loaded.has(name)) continue;
    loaded.add(name);
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=" +
      encodeURIComponent(name).replace(/%20/g, "+") +
      "&display=swap";
    document.head.appendChild(link);
  }
}

export interface GameTable {
  spec: TableSpec | null;
  dealing: boolean;
  fallback: boolean;
  error: string | null;
  sweepKey: number;
  deal: () => void;
  reset: () => void;
}

export function useGameTable(): GameTable {
  const [spec, setSpec] = useState<TableSpec | null>(null);
  const [dealing, setDealing] = useState(false);
  const [fallback, setFallback] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sweepKey, setSweepKey] = useState(0);
  const inFlight = useRef(false);
  const recent = useRef<RecentTable[]>([CLASSIC_TABLE]);

  const deal = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setDealing(true);
    setError(null);
    try {
      const res = await fetch("/api/table", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recent: recent.current }),
        signal: AbortSignal.timeout(55_000),
      });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const next = (await res.json()) as TableSpec & { fallback?: boolean };
      loadFonts(next);
      // a short beat so the freshly-requested fonts can swap in before the reveal
      await new Promise((r) => setTimeout(r, 350));
      setSpec(next);
      setFallback(next.fallback === true);
      recent.current = [summarize(next), ...recent.current].slice(0, 5);
      setSweepKey((k) => k + 1);
    } catch {
      setError("Couldn't reach the board randomizer. Try again.");
    } finally {
      inFlight.current = false;
      setDealing(false);
    }
  }, []);

  const reset = useCallback(() => {
    if (inFlight.current) return;
    setSpec(null);
    setFallback(false);
    setError(null);
    recent.current = [CLASSIC_TABLE, ...recent.current.filter((item) => item !== CLASSIC_TABLE)].slice(0, 5);
    setSweepKey((k) => k + 1);
  }, []);

  return { spec, dealing, fallback, error, sweepKey, deal, reset };
}
