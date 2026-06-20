# Chess Coach — Project Spec & Milestones

## Context

A **personal web-based chess coach** that makes studying chess enjoyable, consistent, and genuinely useful — sitting between raw engine analysis and human learning. The core promise: after every meaningful chess moment, answer *"What is the useful lesson here?"* in plain language, grounded in engine truth, delivered by a warm playful-mentor coach.

This spec builds on three source docs in this folder:
- `objective.md` — product vision, principles, V1 focus, opening-learning vision, coach personality.
- `deep-research-chess-coach.md` — architecture (Next.js/Vercel, react-chessboard + chess.js, browser Stockfish WASM, server LLM coaching), licensing analysis, dependency shortlist, risks.
- `distinctive_design.md` — anti-"AI-slop" frontend strategy (frontend-design skill, design tokens, banned-defaults, Motion for React).

Four product decisions shape the milestone structure:

1. **Milestones are outcome-based** — defined by what works end-to-end, each independently demoable, no time-boxes.
2. **Coaching LLM = Claude (Anthropic)** — latest Claude model via the Anthropic API, behind a thin provider abstraction.
3. **Opening learning is the priority feature.** The research doc deferred it; we elevate it into the V1 arc as the centerpiece (M5), placed *after* the grounding spine and coaching layer it depends on.
4. **Full design investment from day one.** Distinctive design is first-class in every milestone, anchored by a design system established in M0.

---

## Architecture (decided)

The non-negotiable principle: **separation of calculation from teaching.** The engine is the source of truth for chess facts; Claude is constrained to *narrate* those facts, never to invent them.

Three cleanly separated layers:

- **Play & board (client):** `chess.js` (BSD-2-Clause) for rules/legal moves/PGN/FEN, with a **custom hand-built board** for UI (M1 shipped this in place of the originally-planned `react-chessboard` — see the M1 "✅ Shipped" note for why). All move validation local and instant.
- **Analysis (client, Web Worker):** Stockfish compiled to WASM (`nmrugg/stockfish.js`, GPLv3), off the main thread. Produces eval (cp/mate), best move, principal variation. **Start with the single-threaded "lite" build** to avoid COOP/COEP cross-origin-isolation complexity on Vercel; upgrade later if needed.
- **Coaching (server, Vercel Function):** Next.js route handler receives a *structured engine payload* (FEN, side to move, move played, eval before/after, eval delta, best move(s)+PV in SAN, deterministic classification) and calls **Claude** to explain *why it matters*. API key in a server-side env var.

**Stack:** Next.js (App Router) on Vercel; GitHub as source of truth (prod from `main`, preview deploy per PR). Local-first storage via **IndexedDB** (`idb`). Deterministic move classification (blunder/mistake/inaccuracy) computed **in code** from eval-delta / win-probability swings — never by the LLM.

**Licensing guardrail (carry through every milestone):** keep *our* code on a permissive foundation. Treat Stockfish WASM as a deliberately isolated component (static asset in `public/`, communicated with only via the UCI text protocol over Worker messages) so our app code is never a derivative work. **Avoid GPL JS libraries** (`chessground`, `chessops`) entirely. Be prepared to publish the engine's corresponding source + a GPLv3 §6 notice (M7).

---

## Design Approach (first-class throughout)

Design is invested in from day one. M0 establishes the system; every milestone ships UI that meets it.

- Install Anthropic's **frontend-design** skill so it auto-activates on UI work.
- Author **`DESIGN.md`** (loaded every session): semantic CSS variable tokens, a *named aesthetic direction*, and an explicit **banned-defaults** list (no Inter/Roboto/system fonts, no purple-indigo gradients, no glassmorphism, no three-identical-card grids, no gradient text on metrics, no uniform border-radius, no bounce easing).
- **Aesthetic direction (proposed, finalize via short exploration):** a *warm editorial study* feel — the coach as a knowledgeable, encouraging mentor, not a cold engine dashboard. Distinctive display + refined body type pairing; a committed dominant color with one or two sharp accents; intentional spatial rhythm; restraint plus one or two signature motion moments. Explicitly **not** neo-brutalist, not generic SaaS, not "engine UI with a friendly label."
- **Motion:** Motion for React (default); GSAP only for genuine timeline/scroll storytelling (e.g. an opening-journey walkthrough). Always ship `prefers-reduced-motion` fallbacks.
- **Workflow:** pull reference screens (Mobbin/Refero for patterns, Godly for motion) into `/screenshots`; do throwaway mockups in `research/designs/` before production code; have the agent screenshot its own output and self-correct.
- Bake WCAG basics (focus states, contrast, alt text) into `DESIGN.md`.

---

## Milestones

Each is independently demoable. Dependency order is strict where noted. "Done when" lines are the acceptance criteria.

### M0 — Foundation & Design System
- Next.js (App Router) app scaffolded; deployed to Vercel; GitHub repo with preview-per-PR and prod-from-`main` verified.
- Install frontend-design skill; author `DESIGN.md` (tokens + named aesthetic + banned-defaults + WCAG); brief `research/designs/` exploration to lock the aesthetic.
- App shell: responsive layout, navigation, theme/token wiring, base typography.
- `/screenshots` and `research/designs/` folders established.
- **Done when:** a styled, deployed shell renders on desktop + mobile with the chosen aesthetic and zero banned-default tells; a preview deploy succeeds from a PR.
- **Key files:** `app/`, `DESIGN.md`, `app/globals.css`, `vercel.json` (or `next.config` `headers()`), `package.json`.

### M1 — Play a real game vs an adjustable bot
- `react-chessboard` + `chess.js`: full legal-move play, check/checkmate/stalemate/draw detection, PGN/FEN.
- Stockfish WASM in a Web Worker (single-threaded lite build), served as a static asset from `public/`; UCI message boundary established.
- Adjustable bot strength via `Skill Level` (0–20) and/or `UCI_LimitStrength` + `UCI_Elo` (note the ~1320 Elo floor; use Skill Level for weaker play). Strength selector in UI.
- Polished, tactile board interaction (piece movement, legal-move hints, last-move highlight) meeting the M0 design bar.
- **Done when:** Rory can play a complete legal game vs the bot at a chosen strength, on mobile and desktop, and it *feels* good.
- **Key files:** `components/Board/`, `lib/chess/`, `lib/engine/worker.ts`, `public/stockfish/`.
- **✅ Shipped (M1).** One deliberate deviation from the plan: instead of `react-chessboard`, the board is a **custom `chess.js`-driven component** (`src/components/Board/Board.tsx`). `DESIGN.md` mandates porting the locked sci-fi board verbatim (bespoke unicode glyphs, neon affordances, coordinate placement), so a hand-built board gives full control of that aesthetic and a touch-friendly click-to-move + drag interaction — while keeping our code permissive (no new dependency). `chess.js` remains the sole source of move legality. Actual key files: `components/Board/Board.tsx`, `components/Play/{PlayClient.tsx,useChessGame.ts}`, `lib/engine/{engine.ts,difficulty.ts}` (the engine wrapper, named `engine.ts` not `worker.ts`), `lib/chess/pieces.ts`, `public/stockfish/` (Stockfish 18 lite-single WASM). Strength uses `Skill Level` (0–20) + per-move think time; `UCI_Elo` was not used (its ~1320 floor can't express genuine-beginner play).

### M2 — Engine analysis & the grounding spine
The shared contract coaching *and* openings depend on. Build once, cleanly.
- Engine eval/PV plumbing: eval (cp/mate), best move(s), PV in SAN at a given depth; shallow for in-game, deeper for review.
- **Deterministic move classification** (blunder/mistake/inaccuracy) in code, from eval-delta / win-probability swings.
- The **structured engine-fact payload** type: FEN, side to move, move played (SAN), eval before/after, delta, best move(s)+PV (SAN), classification. The only thing coaching may reason from.
- **Move-validation utility:** validate any move string against `chess.js` legal moves + engine PV (used to reject/regenerate hallucinated LLM moves).
- Eval graph + color-coded move list UI.
- **Done when:** eval, classification, and PV render correctly for any position; the payload type is the single source of chess facts; the validator rejects illegal/non-PV moves.
- **Key files:** `lib/engine/analysis.ts`, `lib/classify.ts`, `lib/grounding/payload.ts`, `lib/grounding/validate-move.ts`, `components/EvalGraph/`, `components/MoveList/`.
- **✅ Shipped (M2).** The grounding spine is live in-game on `/play`. Actual files (under `src/`): pure eval vocabulary in `lib/engine/analysis.ts` (the `Eval` type normalized to White's POV, win-probability math, `formatEval`, `terminalEval`, in-game/review depth budgets) — the *engine search* itself stays in `lib/engine/engine.ts` as `ChessEngine.analyse()` so the Worker lives in exactly one place; `lib/classify.ts` (win-probability classification + quality metadata); `lib/grounding/payload.ts` (the `MoveFact` payload type + `buildMoveFacts`, the single source of chess facts); `lib/grounding/validate-move.ts` (the anti-hallucination validator: SAN/UCI, annotation-tolerant, with PV/best-move membership). UI: `components/EvalGraph/` (eval readout + best line in SAN + win% swing graph), `components/MoveList/` (classification-coloured log), plus an added `components/EvalBar/` (vertical bar beside the board) and the live `components/Play/useAnalysis.ts` hook. Decisions: (1) a **dedicated second full-strength engine** runs analysis (separate from the deliberately-weakened bot) so its judgement is honest and runs in parallel with the bot's thinking; (2) classification is **win-probability based, not raw centipawns**, so a +12→+6 move in a won position isn't a false "blunder" (the documented chess.com pain point); (3) evals are **cached by FEN** (takebacks/new games/transpositions self-heal, no reset); in-game search is depth 14, review depth 18 is defined for M4; (4) analysis is **on-demand** — a toggle (default on); the eval bar hides ≤640px so the board keeps full width; (5) added a **race-safe engine abort** (consume the post-`stop` `bestmove` before advancing the queue) so a stale search can never be misattributed. Verification: **vitest** added with 28 unit tests covering `classify` (blunder/mistake/inaccuracy tiers, the win-prob-beats-cp case, mover-perspective symmetry) and `validate-move` (illegal/gibberish rejected, SAN+UCI+promotion+castling accepted, PV membership) — run with `npm test`.

### M3 — The Coach (Claude coaching layer)
Turn engine facts into teaching — the make-or-break quality layer.
- Server route → **Claude**, behind a thin provider abstraction. API key in Vercel env var.
- Strict engine-grounded prompt: pass *only* the M2 payload; forbid inventing evals/ratings; bridge notation to plain language ("Qxh7+ — queen takes h7 with check"); ground in coordinates ("the knight on f3").
- **Anti-hallucination loop:** validate every move Claude names against `chess.js` + PV (M2 validator); reject/regenerate on miss.
- Streaming responses; single warm playful-mentor persona (celebrates good ideas, names mistakes gently, surfaces *one* useful lesson).
- **On-demand tiered hints** during play (nudge → concept → candidate move → full line), non-intrusive, never auto-revealing, shallow-depth engine output.
- Per-position explanation caching to control LLM cost.
- **Done when:** Rory can ask for a hint mid-game and get a grounded, tiered nudge; a finished game produces specific, correct key-moment explanations that never cite an illegal move.
- **Key files:** `app/api/coach/route.ts`, `lib/coach/prompt.ts`, `lib/coach/provider.ts`, `lib/coach/cache.ts`, `components/HintButton/`, `components/Coaching/`.

### M4 — Post-game review
The "what did I learn" moment, composing M2 + M3.
- Full review view: eval graph, color-coded move list, "key moments" (largest eval swings), per-move classification, on-tap Claude explanations.
- Avoid documented chess.com pain points: keep the eval graph visible during review; don't cram the move list; sensible classification in already-winning positions (win-probability based).
- **Done when:** Rory finishes a game, opens review, and steps through key moments with grounded plain-English coaching.
- **Key files:** `app/review/`, `components/GameReview/`; reuses `lib/classify.ts` + `lib/coach/`.

### M5 — Opening learning (PRIORITY FEATURE)
The centerpiece. Openings as *ideas*, not move memorization. Depends on M2 + M3.
- **Opening data source:** ECO classification + the **Lichess opening explorer API** for move popularity/typical continuations (used as an opening-position cache; respect rate limits). Engine grounding (M2) supplies evals so explanations stay truthful.
- **Guided opening journeys:** for a chosen opening, teach the main purpose, typical pawn structures, where pieces belong, common tactical ideas/traps, what both sides want, and how it transitions to a middlegame — with board playback and grounded coaching from Claude.
- **In-game opening awareness:** when an opening appears in a game, the coach names *what kind of position it is* and the available plans (not just the next engine move).
- Curate a small initial set of openings (depth over breadth — "3–5 exemplary" quality bar).
- **Personalization hook:** structure so "the mistakes Rory makes in this opening" can plug in once M6 weakness tracking exists.
- **Done when:** Rory can pick an opening and walk through a guided, board-illustrated, engine-grounded journey of its ideas — and a game that enters that opening triggers a plan-level note from the coach.
- **Key files:** `app/openings/`, `lib/openings/explorer.ts`, `lib/openings/eco.ts`, `content/openings/`, `components/OpeningJourney/`; reuses `lib/coach/`.

### M6 — Remember (local-first persistence & weaknesses)
- IndexedDB (`idb`) local-first storage: saved games, PGNs, mistakes, weakness tallies. Private by default, no DB cost.
- **Recurring-weakness tally** across games (e.g. "you keep giving away dark-square control") + a simple progress dashboard.
- Feed weaknesses back into opening learning (M5 personalization) and post-game review framing.
- **Done when:** games persist locally across sessions; the dashboard surfaces ≥1 recurring theme from real games; opening journeys can reference Rory's own recurring mistakes.
- **Key files:** `lib/storage/db.ts`, `lib/storage/games.ts`, `lib/weakness/tally.ts`, `app/dashboard/`, `components/WeaknessDashboard/`.

### M7 — Release readiness
- Accessibility pass: focus states, contrast, alt text, `prefers-reduced-motion` across all motion.
- Engine robustness: fallback engine build for browser-specific WASM crashes; throttle depth on mobile/Safari; loading/skeleton states.
- Error handling for LLM/route failures and offline behavior.
- **GPL compliance:** publish the Stockfish WASM corresponding source + a GPLv3 §6 "where to find Corresponding Source" notice next to the object code.
- Production build verified; README.
- **Done when:** a clean production deploy passes a real-device mobile check, a11y check, engine-fallback test, and the GPL notice is in place.
- **Key files:** `README.md`, GPL `NOTICE`/source link, `next.config` headers, error boundaries.

---

## Deferred (post-V1)
Imported game review (PGN upload / Lichess / Chess.com import), Maia human-like opponent, multi-threaded Stockfish with full cross-origin isolation, auto-generated puzzles from Rory's mistakes, adaptive training plans, accounts + cloud sync + multi-device.

## Key risks (carry forward)
- **Coaching/opening quality is everything** — mitigate with strict grounding + move validation + deterministic classification (the M2 spine is the defense).
- **LLM hallucinating chess** — never let Claude compute chess; validate every named move.
- **GPL contamination of our code** — permissive libs only; isolate Stockfish behind the UCI boundary; no `chessground`/`chessops`.
- **COOP/COEP misconfig on Vercel** — avoided by starting single-threaded.
- **WASM size / mobile-Safari perf** — lite build, CDN-served static asset, depth throttling, fallback build.
- **LLM cost creep** — on-demand calls, compact payloads, per-position caching, streaming.
- **Lichess API rate limits** — opening explorer used as a cache, one request at a time, back off on 429.

## Verification (end-to-end)
- **Per milestone:** the "Done when" criteria, checked in a deployed preview on desktop + a real mobile device.
- **Play loop (M1):** complete a legal game vs the bot at low and high strength; no illegal moves; correct end-state detection.
- **Grounding (M2):** unit-test `lib/classify.ts` against known blunder/mistake/inaccuracy positions; confirm the validator rejects an illegal move string.
- **Coach (M3):** ask for a hint in a tactical position; confirm tiered output and that no cited move fails the PV/legal validator (probe for hallucination).
- **Openings (M5):** walk a curated opening journey end-to-end; play into that opening and confirm the plan-level note fires; confirm Lichess calls respect rate limits.
- **Persistence (M6):** play → close tab → reopen; game + weakness tally survive; dashboard shows a real recurring theme.
- **Design (all):** agent screenshot self-review against `DESIGN.md`; zero banned-default tells; verify `prefers-reduced-motion`.
- **Release (M7):** production deploy + GPL notice + a11y/contrast check + engine fallback verified on a second browser.
