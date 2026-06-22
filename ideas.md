# Ideas & Backlog

A parking lot for fun features we might build later. Nothing here is committed scope — see `spec.md` for the actual milestones.

---

## Two-player "generative board" mode → PROMOTED to M6/M7

**Promoted into the milestone plan** (post-M5 pivot — see `spec.md`; design locked via grilling, generation spine in `research/randomizer-color-system.md`). The core of this idea is now real scope:
- **M6** — a per-game **seeded randomized 2D board** (the "fresh board every game" magic; classic board stays the default; built *first*), plus **local hot-seat** 2-player.
- **M7** — **online shareable-link** play; the board seed travels in the link so both players see the same board.

**Residual ideas still parked here (not in M6/M7 scope):**
- **Manual board customizer/editor** — let players hand-build a board (pick palette / materials / piece treatment) and save it, rather than only rerolling a random seed. M6 is a *randomizer*, deliberately not an editor.
- **Alternate piece sets** — M6 recolors the unicode glyphs + adds CSS material treatment only. Varying piece *shape* needs SVG/font piece sets, which is a **GPL minefield** (most famous sets, incl. Lichess's, are GPL) — only ever with permissive or self-made sets.
- **Lock / save / gallery of favorite boards** — keep a board you love, build a little collection, reshare by seed.
- **Wilder generation** — M6 keeps the generator inside vetted, tasteful, legible ranges; a "fully experimental" mode (bolder materials/lighting, a low-weight dark/neon family tier) could come later behind an opt-in.

_Status: core shipped/scheduled (M6–M7); the above extras remain ideas only._

---

## 3D board UI

**The idea:** An optional **3D** rendering of the board (perspective, depth, lighting, materials) as an add-on to the 2D randomized board — a more tactile, screenshot-worthy presentation.

**Why deferred:** M6 deliberately scopes to **2D only** to keep the randomizer, hot-seat flow, and `DESIGN.md`/a11y bar tractable. 3D adds real rendering, performance, mobile, and accessibility cost (and a likely new dependency to vet against the permissive-code guardrail) — worth it only once 2D play is solid.

**Rough shape (when we get to it):** a 3D presentation layer over the same `chess.js`-driven game state and the same seeded theme model; must keep a 2D fallback, respect `prefers-reduced-motion`, and stay permissive.

_Status: idea only — add-on to the M6 randomized board, not scheduled._

---

## Hot-seat niceties (deferred out of M6)

Small touches deliberately left out of M6's hot-seat to keep it lean (M6 ships static-orientation, label-only pass-and-play):
- **Auto-flip orientation** — rotate the board each turn so the side-to-move is at the bottom (natural for passing a phone face-to-face), as an opt-in setting, with `prefers-reduced-motion` → instant flip. M6 stays static (White bottom) + manual Flip.
- **Player name entry** — let the two humans enter names instead of "White" / "Black" on the player strips.
- **Clocks** — optional time controls for hot-seat (and later online) games.

_Status: idea only — not scheduled._

---

## Remember — local persistence & recurring-weakness tracking (formerly M6)

**The idea:** Local-first persistence (IndexedDB / `idb`): saved games + PGNs, a **recurring-weakness tally** across games ("you keep giving away dark-square control"), and a simple **progress dashboard** — feeding weaknesses back into the opening journeys (the M5 personalization seam) and post-game review framing. Private by default, no DB cost.

**Why deferred:** This *was* M6 and is the heart of the original "personal coach that remembers you" concept. The post-M5 pivot reprioritized **Play** (fun + social) ahead of it; this arc still stands as the long game, it's just no longer the next build. (`objective.md` keeps it under Long-Term Direction; the "Personal over generic" principle points here.)

**Rough shape (when we get to it):**
- `lib/storage/db.ts` + `lib/storage/games.ts` (idb), `lib/weakness/tally.ts`, `app/dashboard/`, `components/WeaknessDashboard/`.
- Pairs naturally with the deferred post-game review (review a *saved* game) and could surface a "your mistakes in this opening" slot the M5 journeys already left room for.

**Open questions:** how many games before a "theme" is real? How to phrase a weakness without it feeling like nagging? Does this want a 4th tab (Progress), or live inside Coach?

_Status: deferred — was M6, parked here in the post-M5 pivot._

---

## Post-game review (formerly M4) → now scheduled as M8 (the Coach tab)

**The idea:** A dedicated "what did I learn" review view, composing the M2 grounding spine + the M3 coach. Finish a game, open review, and step through the story of the game with grounded plain-English coaching.

**Now scheduled:** the post-M5 pivot gives this a home — it *is* the **Coach** tab, the third top-level tab, built as **M8** (`spec.md`). The notes below carry forward as its design brief.

**Rough shape (when we get to it):**
- Full review view: eval graph, color-coded move list, **"key moments"** (largest eval swings), per-move classification, on-tap Claude explanations.
- Use the deeper review-depth engine budget (depth 18, already defined in `lib/engine/analysis.ts`) — accuracy over latency, since review is offline.
- Avoid the documented chess.com pain points: keep the eval graph visible during review; don't cram the move list; sensible classification in already-winning positions (win-probability based, which M2 already does).
- **Reuses:** `lib/classify.ts` + `lib/coach/`. Likely lands as `app/review/` + `components/GameReview/`.
- Natural pairing with M6 (Remember): review a *saved* game, not just the one just played.

**Open questions:** auto-open review at game end, or strictly on-demand from the Coach tab? How many "key moments" to surface before it feels like a wall of text? Does it review only the most-recent game, or (later, with the deferred "Remember" persistence) any saved game?

_Status: scheduled as **M8 — the Coach tab** (was M4)._

---

## In-game opening awareness (split out of M5)

**The idea:** During a normal game vs the bot on `/play`, the coach recognizes when the game has entered a known opening and quotes it by name with a plan-level note — "you're in an Italian; fight for the center and keep an eye on f7" — instead of only move-by-move analysis. The "what kind of position is this?" moment, surfaced live.

**Why split out:** M5 ships the guided opening *journeys* (read-through + recall drill) for a curated set. Recognizing arbitrary openings in a live game is a separate concern: at minimum it wants a move-prefix match against our curated openings; done fully it wants a bundled ECO name dataset (Lichess ships a CC0 one) and grounded plan notes for openings we haven't authored. Kept out of M5 to keep that milestone to journeys + drill.

**Rough shape (when we get to it):**
- **Cheap first cut:** match the game's move prefix against the 3–5 curated openings from M5; when it hits, show a one-time, non-intrusive "you're in the X" card in the existing coach panel, pulling the plan straight from the M5 content. No new LLM call, no dataset.
- **Fuller version:** bundle the CC0 ECO/opening dataset (`lib/openings/eco.ts`) to name *any* opening, with a grounded plan note. Reuses `lib/coach/`.
- Fire once (when the opening is identified / when leaving book), never nagging — obeys the on-demand, non-intrusive principle.

**Open questions:** trigger on entering the opening, or on leaving book? Auto-show the card or gate it behind a tap? How to ground a plan note for an opening we *haven't* curated without the LLM inventing the plan?

_Status: idea only — split out of M5, not scheduled._
