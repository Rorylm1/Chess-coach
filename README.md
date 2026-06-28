# Chess Coach

A personal web-based chess coach that turns engine truth into human teaching. After every
meaningful chess moment it answers one question: **"What is the useful lesson here?"** — in plain
language, grounded in the engine, delivered by a warm playful-mentor coach.

> **Separation of calculation from teaching.** Stockfish is the source of truth for chess facts;
> Claude only *narrates* those facts. The LLM never computes chess and never invents moves, evals,
> or ratings — every move it names is validated against `chess.js` and the engine PV before it's shown.

## Status

- **M0 — Foundation & Design System ✅** — Next.js app scaffolded, design system locked
  ("Deep-Space Analysis Deck"), responsive shell.
- **M1 — Play vs an adjustable bot ✅** — a full legal game on `/play` against a strength-adjustable
  Stockfish bot (Learner→Master), with a custom tactile board, move log, captured material,
  flip / takeback / resign, and end-state detection. Desktop + mobile.
- **M2 — Engine analysis & the grounding spine ✅** — a dedicated full-strength engine evaluates each
  position live: an eval bar, an Analysis card (eval + best line in SAN + a win% swing graph) and a
  classification-coloured move list (blunder / mistake / inaccuracy / best). Classification is
  **win-probability based** (computed in code, never the LLM). Ships the `MoveFact` grounding payload
  (the single source of chess facts) and a move validator that rejects illegal / non-PV moves — the
  defenses M3's coach is built on. Analysis is on-demand (toggleable).
- **M3 — The Coach (Claude) ✅** — `POST /api/coach` turns the engine-fact payload into one warm,
  plain-language lesson, streamed in. Grounding is **structural first** (the prompt only lets Claude
  quote a closed move vocabulary) and **validated second** (every named move is checked against
  `chess.js` + the PV; a miss regenerates once, then falls back to a deterministic engine-only
  explanation) — so the UI can never show a move the engine didn't offer. On-demand hints + a coach panel.
- **M5 — Opening learning ✅** — four guided journeys (Italian, Queen's Gambit, Sicilian, French) at
  `/openings`: a board-illustrated read-through (one coach note per move, thematic panels) then a recall
  drill against a scripted book bot that varies only into taught lines. Evals are **100% engine-sourced**
  and baked in at build time; runtime is fully static (no network/LLM calls).
- **Now — Play, reframed (M6).** A post-M5 pivot toward a **three-tab** app (Play · Openings · Coach)
  with Play made fun and social. **M6** ships the Play + Openings tabs, a per-game **randomized board**
  (built first — a seeded, OKLCH-based theme generator that's unique every game yet always legible; spec
  in `research/randomizer-color-system.md`), and **local hot-seat** 2-player. The randomizer has since grown
  into the **Generative Table** — on Play, *Deal a table* makes a live Claude call that **invents a whole
  fresh UI for that game** (surfaces, type, accents, board palette _and_ recolorable SVG pieces), rendered
  safely from a validated spec and guaranteed legible by a backstop; Play-tab only and ephemeral (classic
  Deep-Space is always the default). Then **M7** = a **shareable live link** for online play, **M8** = the
  **Coach** tab (post-game review), **M9** = release. _In progress._

See `spec.md` for the full milestone plan (M0–M9) and `DESIGN.md` for the design system.

## Tech stack

- **Next.js 16 (App Router)** on Vercel — prod from `main`, preview deploy per PR
- **TypeScript · Tailwind v4** with semantic CSS-variable tokens
- **Motion for React** for the signature motion moment (`prefers-reduced-motion` aware)
- **`chess.js`** (BSD-2-Clause) for rules / legal moves / PGN / FEN, driving a **custom hand-built
  board** — the locked sci-fi board is ported verbatim as our own permissive component (no
  `react-chessboard`; see `spec.md` M1 for the rationale)
- **Stockfish 18 WASM** (`nmrugg`, GPLv3) — single-threaded "lite" build, served as an isolated
  static asset from `public/stockfish/`, reached only over the UCI text protocol in a Web Worker.
  Two instances run independently: a strength-limited one drives the bot, a full-strength one drives
  analysis
- **Claude (Anthropic)** via a server-side coaching route (`/api/coach`) — engine-grounded, validated, streamed
- **Vitest** for the pure grounding logic (classification + move validation + coach guard) — `npm test`
- Coming next (M6–M7): a tabbed shell · a seeded **randomized-board** theming layer over the custom board ·
  local hot-seat 2-player · then a realtime relay for **online shareable-link play** (the one step beyond local-first)

**Licensing guardrail:** our code stays permissive. Stockfish WASM (GPLv3) is an isolated static
asset behind the UCI message boundary (single-threaded, so no COOP/COEP headers needed); never add
GPL JS libraries (`chessground`, `chessops`).

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
```

```bash
npm run build    # production build (type-checks + lints)
npm run start    # serve the production build
npm run lint     # eslint
npm test         # vitest — classification + move-validation unit tests
```

Copy `.env.example` to `.env.local` and fill in `ANTHROPIC_API_KEY` (used from M3).

## Project layout

```
src/app/              App Router routes — landing, /play, /openings + /openings/[slug], api/coach, api/table, layout, globals.css
src/components/Board/  Custom interactive chessboard (chess.js-driven; click-to-move + drag)
src/components/Play/   Play screen (PlayClient) + hooks: game loop (useChessGame), analysis (useAnalysis)
src/components/EvalBar/ EvalGraph/ MoveList/   M2 analysis UI (eval bar, swing graph, coded move list)
src/components/Coaching/ HintButton/   M3 coach UI (CoachPanel + on-demand tiered hints)
src/components/OpeningJourney/   M5 opening journeys (read-through + recall drill)
src/components/        Shell + landing components (SiteHeader, DecorativeBoard, Reveal, …)
src/lib/engine/        Stockfish UCI wrapper (engine.ts: play + analyse) + analysis math + difficulty
src/lib/classify.ts    Win-probability move classification (blunder/mistake/inaccuracy) — pure, tested
src/lib/grounding/     The chess-fact payload (payload.ts) + move validator (validate-move.ts) — tested
src/lib/coach/         M3 coach: payload, prompt, provider (Anthropic + fallback), guard — tested
src/lib/table/         M6.5 generative table: spec + :root-token mapping, legibility backstop, server Claude generator + entropy brief, recolorable piece SVG sets
src/lib/openings/      M5 book-tree model + read-through / drill logic (tree.ts)
src/lib/chess/         Chess helpers (piece glyphs + names)
content/openings/      Curated opening data (one file per opening) + engine-sourced evals.generated.json
public/stockfish/      Vendored Stockfish WASM (GPLv3) + license / corresponding-source notice
DESIGN.md              Design system: tokens, aesthetic, banned-defaults, a11y, motion
research/designs/      Throwaway design-exploration mockups (the chosen direction is D — sci-fi)
screenshots/           Rendered references for design self-review
spec.md                Milestones M0–M9 and acceptance criteria
ideas.md               Parked / deferred ideas (weakness tracking, 3D board, piece sets, …)
research/randomizer-color-system.md   Build-reference spec for the M6 randomized-board colour system
```

## Design

Distinctive, hand-crafted UI — not generic AI aesthetics. The system is documented in `DESIGN.md`,
including the banned-defaults list. Design exploration lives in `research/designs/`; the locked
direction is **D — "Deep-Space Analysis Deck"** (obsidian + holographic cyan/amber HUD).

## Credits

Generative-table chess piece silhouettes use the **chessnut** set by Lex Luengas
([github.com/LexLuengas/chessnut-pieces](https://github.com/LexLuengas/chessnut-pieces)), Apache-2.0,
recolored at runtime. Per the licensing guardrail, only permissive piece sets are used (no GPL or
non-commercial assets).
