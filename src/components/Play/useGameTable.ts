"use client";

/**
 * Owns the per-game "generative table" (Play tab only). Clicking deal asks the server to
 * invent a fresh design (POST /api/table), loads whatever Google Fonts it chose, then applies
 * it. EPHEMERAL by design: nothing is persisted — the classic Deep-Space look is always the
 * default, and a dealt table lasts only for this view. `sweepKey` bumps on each deal/reset so
 * the Board replays its re-tint sweep. Subsumes the old board-only randomizer.
 */

import { useCallback, useState } from "react";
import { fontsOf, type TableSpec } from "@/lib/table/spec";

const loaded = new Set<string>();
function loadFonts(spec: TableSpec) {
  for (const name of fontsOf(spec)) {
    if (loaded.has(name)) continue;
    loaded.add(name);
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=" +
      encodeURIComponent(name).replace(/%20/g, "+") +
      ":wght@400;500;600;700&display=swap";
    document.head.appendChild(link);
  }
}

export interface GameTable {
  spec: TableSpec | null;
  dealing: boolean;
  sweepKey: number;
  deal: () => void;
  reset: () => void;
}

export function useGameTable(): GameTable {
  const [spec, setSpec] = useState<TableSpec | null>(null);
  const [dealing, setDealing] = useState(false);
  const [sweepKey, setSweepKey] = useState(0);

  const deal = useCallback(async () => {
    setDealing(true);
    try {
      const res = await fetch("/api/table", { method: "POST" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const next = (await res.json()) as TableSpec;
      loadFonts(next);
      // a short beat so the freshly-requested fonts can swap in before the reveal
      await new Promise((r) => setTimeout(r, 350));
      setSpec(next);
      setSweepKey((k) => k + 1);
    } catch {
      // keep the current look on failure (the route itself falls back, so this is rare)
    } finally {
      setDealing(false);
    }
  }, []);

  const reset = useCallback(() => {
    setSpec(null);
    setSweepKey((k) => k + 1);
  }, []);

  return { spec, dealing, sweepKey, deal, reset };
}
