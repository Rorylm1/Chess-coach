# Chess Coach

A personal web-based chess coach that turns engine truth into human teaching. After every meaningful chess moment it answers one question: **"What is the useful lesson here?"** — in plain language, grounded in the engine, delivered by a warm playful-mentor coach.

See `spec.md` for the full spec and milestones, `objective.md` for product vision, `deep-research-chess-coach.md` for architecture, `distinctive_design.md` for the design strategy.

## Repo & deployment
- **GitHub:** https://github.com/Rorylm1/Chess-coach
- **Push frequently — at minimum at the end of every milestone** (M0–M7). Each milestone is independently demoable, so it should land as committed, pushed work.
- **Deploys on Vercel** (prod from `main`, preview deploy per PR). Live URL: _forthcoming_.

## Core principle
**Separation of calculation from teaching.** Stockfish is the source of truth for chess facts; Claude only *narrates* those facts. The LLM never computes chess and never invents moves, evals, or ratings — every move it names is validated against `chess.js` and the engine PV before it's shown.

## App structure (post-M5 pivot)
Three top-level tabs in the long-term vision: **Play** (vs the bot or a human) · **Openings** (the M5 journeys) · **Coach** (post-game review / grounded teaching). They land across milestones — **M6** = Play + Openings tabs · **M7** = online play · **M8** = the Coach tab · **M9** = release. Within Play, a `Bot · Multiplayer` mode switch drives one generalized loop; **coach + analysis are bot-mode only** (a hot-seat game is just play — no engine assist). **M6 shipped** — Play + Openings tabs, a per-game **randomized 2D board** (the "Dealer's roll" randomizer: seeded + OKLCH, unique every game yet always legible, classic board the default; `lib/board/` + `components/BoardRandomizer/`; built **exploration-first** per `distinctive_design.md` via `research/designs/board-randomizer.html`, engineering spine in `research/randomizer-color-system.md`), and local **hot-seat** 2-player. Current focus is **M7** — a **shareable live link** (the one deliberate step beyond local-first). The original weakness-tracking arc (old M6 "Remember") is **deferred** to `ideas.md`.

## Product principles
- **Play first** — learning starts from real games and positions, not lectures.
- **Coach, don't just evaluate** — explain the *idea*, not just the engine score.
- **On-demand, non-intrusive** — help is available, never interrupting.
- **Openings as ideas, not memorization** — plans, structures, traps, transitions.
- **Playful and shareable** — playing is fun in its own right; a unique board every game and playing a friend are first-class. Chess is social.
- **Personal over generic** — learn Rory's recurring mistakes and weak spots _(longer-term; the dedicated build is deferred)_.
- **Small loops beat grand systems** — each session leaves one or two memorable ideas.
- **Fun but not gimmicky** — playful tone, real learning.

## Design principles (first-class from day one)
- Distinctive, hand-crafted UI — **not** generic AI aesthetics. Obey the banned-defaults list in `DESIGN.md`: no Inter/Roboto/system fonts, no purple-indigo gradients, no glassmorphism, no three-identical-card grids, no gradient text on metrics, no uniform border-radius, no bounce easing.
- Aesthetic: a *warm editorial study* — knowledgeable, encouraging mentor, not a cold engine dashboard.
- Restraint plus one or two signature motion moments. Motion for React by default; always ship `prefers-reduced-motion` fallbacks.
- Accessibility is not optional: focus states, contrast, alt text baked in.

## Tech stack
Next.js (App Router) on Vercel · chess.js (BSD-2-Clause) for rules, driving a **custom hand-built board** (we ported the locked sci-fi board verbatim as our own permissive component instead of `react-chessboard` — see `spec.md` M1) · Stockfish 18 WASM (`nmrugg`, GPLv3, single-threaded lite build) in a Web Worker, isolated behind the UCI message boundary · Claude (Anthropic) for the server-side coaching route · IndexedDB (local-first).

**Licensing guardrail:** keep our code permissive. Stockfish WASM stays an isolated static asset; **never** add GPL JS libraries (`chessground`, `chessops`).
