"use client";

/**
 * Owns the per-game board palette (M6, Feature 1). The rolled board *sticks* until changed
 * and persists across sessions in localStorage; the seed string is its whole identity, so
 * the M7 share-link will reuse exactly this. SSR-safe: starts on the classic default (so
 * server + first client render agree), then hydrates any stored seed in an effect.
 *
 * `sweepKey` bumps only on a user reroll/reset — the Board animates the re-tint sweep off
 * that, so the silent hydrate-from-storage settles without a spurious animation.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CLASSIC_THEME,
  generateBoardTheme,
  themeForSeed,
  randomBoardSeed,
  type BoardTheme,
} from "@/lib/board/theme";

const STORAGE_KEY = "cc:boardSeed";

export interface BoardThemeControls {
  theme: BoardTheme;
  sweepKey: number;
  reroll: () => void;
  reset: () => void;
}

export function useBoardTheme(): BoardThemeControls {
  const [theme, setTheme] = useState<BoardTheme>(CLASSIC_THEME);
  const [sweepKey, setSweepKey] = useState(0);
  const hydrated = useRef(false);

  // Hydrate a stored seed once on mount (no sweep — the board just settles).
  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      // Hydrating an external store (localStorage) post-mount is the SSR-safe pattern here:
      // server + first client render are classic, then we settle to the stored seed.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (stored && stored !== "classic") setTheme(themeForSeed(stored));
    } catch {
      // localStorage unavailable (private mode / blocked) — stay classic.
    }
  }, []);

  const persist = useCallback((seed: string) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, seed);
    } catch {
      // ignore write failures; the in-memory theme still applies for this session.
    }
  }, []);

  const reroll = useCallback(() => {
    const next = generateBoardTheme(randomBoardSeed());
    setTheme(next);
    setSweepKey((k) => k + 1);
    persist(next.seed);
  }, [persist]);

  const reset = useCallback(() => {
    setTheme(CLASSIC_THEME);
    setSweepKey((k) => k + 1);
    persist("classic");
  }, [persist]);

  return { theme, sweepKey, reroll, reset };
}
