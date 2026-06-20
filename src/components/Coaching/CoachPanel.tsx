"use client";

/**
 * The coach's panel — the human-teaching voice on the HUD.
 *
 * Deliberately set in `Sora` (the coach prose), not the `JetBrains Mono` engine voice: the
 * product's "engine truth vs human teaching" split, made visible. It narrates whatever the
 * coach hook is currently saying — a streamed hint or a move explanation — and houses the
 * tiered HintButton. Idle, it invites the two actions without nagging.
 */

import { HintButton } from "@/components/HintButton/HintButton";
import type { CoachState } from "@/components/Play/useCoach";

export function CoachPanel({ coach }: { coach: CoachState }) {
  const { text, loading, error, active, hintTier, canHint, hint, deeper, dismiss } = coach;
  const streaming = loading && text.length > 0;
  const thinking = loading && text.length === 0;

  return (
    <section className="card coach-card" aria-label="Coach">
      <div className="card-head">
        <h2>
          <span className="coach-avatar" aria-hidden="true">
            ◈
          </span>
          Coach
        </h2>
        {active && (
          <button
            type="button"
            className="coach-dismiss"
            onClick={dismiss}
            aria-label="Dismiss coach message"
          >
            ✕
          </button>
        )}
      </div>

      <div className="coach-body" aria-live="polite">
        {active ? (
          <>
            <span className="coach-label">{active.label}</span>
            {thinking ? (
              <p className="coach-thinking">
                <span className="coach-dot" aria-hidden="true" />
                Coach is thinking…
              </p>
            ) : (
              <p className="coach-text">
                {text}
                {streaming && <span className="coach-caret" aria-hidden="true" />}
              </p>
            )}
            {error && <p className="coach-error">{error}</p>}
          </>
        ) : (
          <p className="coach-idle">
            Stuck? Ask for a hint — or tap any move in the log to see what it did.
          </p>
        )}
      </div>

      <HintButton
        canHint={canHint}
        hintTier={hintTier}
        hintActive={active?.surface === "hint"}
        loading={loading}
        onHint={hint}
        onDeeper={deeper}
      />
    </section>
  );
}
