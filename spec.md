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

### M4 — Post-game review _(deferred → `ideas.md`)_
The dedicated "what did I learn" review view has been **deferred to post-release** — see `ideas.md` for the parked spec. The milestone slot is intentionally left as a gap so M5–M7 keep their numbers. (Much of its substance — eval graph, classification, in-game coaching — already ships live on `/play` via M2 + M3.)

### M5 — Opening learning (PRIORITY FEATURE)
The centerpiece. Openings as *ideas*, not move memorization. Depends on M1 + M2 (reuses the M3 coach voice for baked prose). _Design locked via grilling — see decisions below._
- **Scope:** guided **journeys** for **4 curated openings** — Italian Game & Queen's Gambit (you play White), Sicilian Defense & French Defense (you play Black). Chosen for canonical fame, teachability, and structural variety (open / closed / defense, across 1.e4 and 1.d4). The content format is uniform so growing toward ~20 openings later is data entry, not a redesign. _In-game opening awareness was split out → `ideas.md`._
- **Content model — the grounding extension:** opening *ideas* (plans, pawn structures, piece placement, traps) aren't engine-computable, so they live in a researched, **human-reviewed** knowledge layer in `content/openings/` (typed TS data, one file per opening). The spine still holds: the **engine verifies every concrete line + eval**, prose stays tied to sourced theory, and **all 4 are read/approved once before shipping**. The Lichess opening explorer is queried **at build time only** to source realistic continuations, then baked in — **no runtime Lichess calls** (rate limits never bite). Runtime journeys are fully static → instant, ~$0 LLM, zero hallucination risk. (Deferred nicety: a live "ask the coach a follow-up" box.)
- **A journey = two phases on one `/openings/[slug]` page:**
  - **Read-through** — the board steps down the main line, one coach note per move (existing playful-mentor voice), with **deviation asides** wherever the bot may branch (a main-line spine; branches demoted to footnotes), then thematic panels: *what each side wants · where the pieces belong · the signature trap · the middlegame it becomes*. The M2 `EvalBar`/`EvalGraph` show the engine eval per step (grounding).
  - **Recall drill** — you play your side (~8 plies) against a **scripted "book bot"** (no engine; picks among the curated taught replies, weighted by explorer popularity) that deviates *only into taught lines*. A non-book move → **gentle correct-and-retry** with a reveal escape hatch.
- **Narrow & taught:** the per-opening **book tree** (main line + 1–2 popular taught deviations per turn, ~8 plies) is the single source for *both* phases — you can only be drilled on what the read-through taught.
- **Personalization hook (M6 seam):** leave a hidden "your mistakes in this opening" slot; no work in M5. No progress persistence in M5 (that belongs to M6).
- **Done when:** Rory can pick one of the 4 openings, walk a guided board-illustrated read-through of its ideas, then pass a recall drill where the book bot varies its replies within the taught lines and the coach corrects off-book moves.
- **Key files:** `app/openings/page.tsx`, `app/openings/[slug]/page.tsx`, `content/openings/*.ts`, `lib/openings/tree.ts` (book-tree types + drill logic), `lib/openings/build/` (build-time explorer fetch + engine verification), `components/OpeningJourney/`; reuses `components/Board/`, `components/EvalBar/`, `components/EvalGraph/`, and the coach voice from `lib/coach/`.
- **✅ Shipped (M5).** Four journeys live under `/openings`: **Italian Game** & **Queen's Gambit** (play White), **Sicilian Defense** & **French Defense** (play Black) — each statically prerendered (`/openings/[slug]`). Actual files (under `src/`): `lib/openings/tree.ts` (the `Opening`/`BookMove` model + `readSteps`, `pickWeighted`, `matchLearnerMove` — the single source for *both* phases); `content/openings/{italian-game,queens-gambit,sicilian-defense,french-defense}.ts` + `index.ts` (the catalog/registry); `components/OpeningJourney/{OpeningJourney,ReadThrough,Drill}.tsx`; `app/openings/{page,[slug]/page}.tsx`. Decisions vs the plan: (1) **evals are 100% engine-sourced, never hand-typed** — `scripts/refresh-opening-evals.mjs` pulls White-POV cp from the Lichess **cloud-eval** API for every main-line FEN and bakes them into a committed `content/openings/evals.generated.json`, which `readSteps` reads (keyed by FEN, so transpositions share one eval); runtime stays static with zero network/LLM calls. (2) The **drill bot uses no engine** — it picks among the curated taught replies weighted by popularity, deviating only into lines the read-through taught; off-book → gentle correct-and-retry with a "show the move" reveal hatch. (3) `lib/openings/eco.ts`/`explorer.ts` were **not needed** — matching is against our own curated trees, not arbitrary openings (in-game opening awareness was split out to `ideas.md`). (4) `SiteHeader` became a client component so the nav highlights the active route. Verification: **33 new vitest tests** (81 total) covering every line's legality across all 4 openings, the read-through/FEN consistency, and the drill logic (in-book match tolerance, weighted bot selection, off-book rejection); browser-verified read-through + recall drill on both a White opening (Italian) and a Black one (Sicilian, where the bot opens automatically and the board flips), desktop + mobile, zero console errors.

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
