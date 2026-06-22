"use client";

/**
 * The coach, client-side: builds a grounded payload from live game + analysis state, streams
 * the reply from /api/coach, and exposes it reactively for the Coaching panel.
 *
 * Two surfaces (M3): on-demand **tiered hints** for the current position (nudge → concept →
 * candidate → line, each a deliberate escalation, never auto-revealed) and **explain** for any
 * move in the log. Responses are cached in-memory by position + surface + tier, so re-asking
 * the same thing in a session is instant and free (the durable IndexedDB cache is M6). A hint is
 * inherently about the live position, so it self-clears the moment the board moves on.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { Color } from "chess.js";
import type { PositionEval } from "@/lib/engine/analysis";
import type { MoveFact } from "@/lib/grounding/payload";
import {
  buildHintPayload,
  buildExplainPayload,
  type CoachPayload,
  type HintTier,
} from "@/lib/coach/payload";

export const HINT_TIERS: HintTier[] = ["nudge", "concept", "candidate", "line"];
export const HINT_TIER_LABEL: Record<HintTier, string> = {
  nudge: "Nudge",
  concept: "The idea",
  candidate: "A move to consider",
  line: "The engine's line",
};

export interface CoachActive {
  surface: "hint" | "explain";
  tier: HintTier | null;
  /** A short human label for the panel header. */
  label: string;
  /** Ply being explained (explain surface only), for move-log highlight. */
  ply: number | null;
}

export interface CoachState {
  /** The coach message, filled in as it streams. */
  text: string;
  loading: boolean;
  error: string | null;
  /** What's currently being shown, or null when the panel is idle. */
  active: CoachActive | null;
  /** Highest hint tier shown for the current position (drives the "go deeper" affordance). */
  hintTier: HintTier | null;
  /** Whether hints can be requested right now (engine facts available, player to move). */
  canHint: boolean;
  /** Request a hint at a specific tier. */
  hint: (tier: HintTier) => void;
  /** Escalate to the next, more revealing hint tier. */
  deeper: () => void;
  /** Explain a move from the log. */
  explain: (fact: MoveFact) => void;
  /** Clear the panel. */
  dismiss: () => void;
}

interface CoachInputs {
  /** Live game position (the player faces this when asking for a hint). */
  fen: string;
  /** Full SAN history. */
  history: string[];
  /** Which colour the human plays. */
  playerColor: Color;
  /** Full eval of the current position (best move + PV), or null if unavailable. */
  currentPosition: PositionEval | null;
  /** Whether it's the human's move and the game is live (hints only make sense then). */
  playerToMove: boolean;
}

function cacheKey(p: CoachPayload): string {
  return p.surface === "hint"
    ? `hint:${p.tier}:${p.fen}`
    : `explain:${p.played?.uci ?? ""}:${p.fen}`;
}

export function useCoach(inputs: CoachInputs): CoachState {
  const { fen, history, playerColor, currentPosition, playerToMove } = inputs;

  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState<CoachActive | null>(null);
  const [hintTier, setHintTier] = useState<HintTier | null>(null);

  const cache = useRef<Map<string, string>>(new Map());
  const abortRef = useRef<AbortController | null>(null);

  const canHint = playerToMove && currentPosition != null;

  const run = useCallback(async (payload: CoachPayload, activeLabel: CoachActive) => {
    const key = cacheKey(payload);
    abortRef.current?.abort();
    setActive(activeLabel);
    setError(null);

    const cached = cache.current.get(key);
    if (cached != null) {
      setText(cached);
      setLoading(false);
      return;
    }

    const ac = new AbortController();
    abortRef.current = ac;
    setLoading(true);
    setText("");

    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: ac.signal,
      });
      if (!res.ok || !res.body) throw new Error(`coach ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setText(acc);
      }
      cache.current.set(key, acc);
    } catch {
      if (ac.signal.aborted) return;
      setError("The coach is offline right now — try again in a moment.");
    } finally {
      if (!ac.signal.aborted) setLoading(false);
    }
  }, []);

  const hint = useCallback(
    (tier: HintTier) => {
      if (!canHint) return;
      setHintTier(tier);
      void run(buildHintPayload({ fen, positionEval: currentPosition, history, playerColor, tier }), {
        surface: "hint",
        tier,
        label: `Hint · ${HINT_TIER_LABEL[tier]}`,
        ply: null,
      });
    },
    [canHint, fen, currentPosition, history, playerColor, run],
  );

  const deeper = useCallback(() => {
    const i = hintTier ? HINT_TIERS.indexOf(hintTier) : -1;
    const next = HINT_TIERS[i + 1];
    if (next) hint(next);
  }, [hintTier, hint]);

  const explain = useCallback(
    (fact: MoveFact) => {
      setHintTier(null);
      void run(buildExplainPayload({ fact, history, playerColor }), {
        surface: "explain",
        tier: null,
        label: `Move ${fact.moveNumber}${fact.color === "w" ? "." : "…"} ${fact.san}`,
        ply: fact.ply,
      });
    },
    [history, playerColor, run],
  );

  const dismiss = useCallback(() => {
    abortRef.current?.abort();
    setActive(null);
    setText("");
    setError(null);
    setHintTier(null);
    setLoading(false);
  }, []);

  // A hint is about the live position — once the board moves on, it's stale, so clear it.
  // Explanations are about a fixed past move, so leave them be.
  const fenRef = useRef(fen);
  useEffect(() => {
    if (fenRef.current !== fen) {
      fenRef.current = fen;
      setActive((a) => {
        if (a?.surface === "hint") {
          setText("");
          setHintTier(null);
          setLoading(false);
          abortRef.current?.abort();
          return null;
        }
        return a;
      });
    }
  }, [fen]);

  return {
    text,
    loading,
    error,
    active,
    hintTier,
    canHint,
    hint,
    deeper,
    explain,
    dismiss,
  };
}
