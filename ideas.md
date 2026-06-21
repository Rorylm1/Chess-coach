# Ideas & Backlog

A parking lot for fun features we might build later. Nothing here is committed scope — see `spec.md` for the actual milestones.

---

## Two-player "generative board" mode

**The idea:** A side tab where two people can play a game against each other on our site (local hot-seat, or later online). The signature twist is *design*: hit **Create** and the app procedurally generates a genuinely unique chess board — colors, materials, textures, piece styling, lighting — so every game feels like a fresh, one-off experience.

**Why it's fun / on-brand:**
- Leans straight into our distinctive, hand-crafted design DNA (`DESIGN.md`) instead of generic chessboard skins.
- Gives every match its own identity — a board you'll never see again. Memorable, screenshot-worthy.
- Low-stakes, playful, social — a natural "show a friend" moment.

**Rough shape (when we get to it):**
- A seeded generator for board themes (palette + surface + piece treatment), so a board could be reproducible/shareable via its seed.
- "Create" rerolls the seed → new board. Maybe let players lock a board they love.
- Reuse our existing custom board component; this is a theming/skin layer on top, plus a 2-player turn flow.
- Keep it permissive — no GPL board libs (per the licensing guardrail).

**Open questions:** local hot-seat first vs. online? How wild should generation get (subtle variation vs. fully experimental)? Should generated boards be saveable/shareable?

_Status: idea only — not scheduled, not started._

---

## Post-game review (formerly M4)

**The idea:** A dedicated "what did I learn" review view, composing the M2 grounding spine + the M3 coach. Finish a game, open review, and step through the story of the game with grounded plain-English coaching.

**Why deferred:** Pulled out of the V1 milestone arc to post-release. Much of its substance already ships live in-game on `/play` — the eval graph, win% swing, color-coded move list, per-move classification, and on-demand Claude coaching are all there from M2 + M3. A separate review surface is polish, not a gate, so it waits until after release.

**Rough shape (when we get to it):**
- Full review view: eval graph, color-coded move list, **"key moments"** (largest eval swings), per-move classification, on-tap Claude explanations.
- Use the deeper review-depth engine budget (depth 18, already defined in `lib/engine/analysis.ts`) — accuracy over latency, since review is offline.
- Avoid the documented chess.com pain points: keep the eval graph visible during review; don't cram the move list; sensible classification in already-winning positions (win-probability based, which M2 already does).
- **Reuses:** `lib/classify.ts` + `lib/coach/`. Likely lands as `app/review/` + `components/GameReview/`.
- Natural pairing with M6 (Remember): review a *saved* game, not just the one just played.

**Open questions:** standalone `/review` route vs. an expanded panel on `/play`? Auto-open review at game end, or strictly on-demand? How many "key moments" to surface before it feels like a wall of text?

_Status: deferred to post-release — was M4, now parked here._

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
