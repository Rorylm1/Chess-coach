"use client";

/**
 * The on-demand, tiered hint control.
 *
 * Help is available but never intrusive: nothing reveals until the player asks, and each press
 * reveals strictly more (nudge → idea → a move to consider → the engine's line). The first ask
 * is the gentlest nudge; "Go deeper" escalates one rung at a time. Disabled until the analysis
 * engine has facts for the live position — hints are engine-grounded or they don't appear.
 */

import { HINT_TIERS, HINT_TIER_LABEL } from "@/components/Play/useCoach";
import type { HintTier } from "@/lib/coach/payload";

interface HintButtonProps {
  canHint: boolean;
  /** The tier currently shown, or null if no hint is active. */
  hintTier: HintTier | null;
  /** True while a hint is the active coach message (vs. an explanation or idle). */
  hintActive: boolean;
  loading: boolean;
  onHint: (tier: HintTier) => void;
  onDeeper: () => void;
}

export function HintButton({
  canHint,
  hintTier,
  hintActive,
  loading,
  onHint,
  onDeeper,
}: HintButtonProps) {
  const atDeepest = hintTier === "line";
  const canEscalate = hintActive && hintTier != null && !atDeepest;

  return (
    <div className="hint-controls">
      <button
        type="button"
        className="hint-btn"
        onClick={() => onHint("nudge")}
        disabled={!canHint || loading}
        title={canHint ? "Get a gentle hint" : "Turn on engine analysis to enable hints"}
      >
        <span className="hint-ic" aria-hidden="true">
          ✦
        </span>
        {hintActive ? "Hint again" : "Get a hint"}
      </button>

      {canEscalate && (
        <button
          type="button"
          className="hint-deeper"
          onClick={onDeeper}
          disabled={loading}
          title={`Reveal more: ${HINT_TIER_LABEL[HINT_TIERS[HINT_TIERS.indexOf(hintTier) + 1]]}`}
        >
          Go deeper →
        </button>
      )}
    </div>
  );
}
