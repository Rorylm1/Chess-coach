# Chess Coach

A personal web-based chess coach that turns engine truth into human teaching. After every meaningful chess moment it answers one question: **"What is the useful lesson here?"** — in plain language, grounded in the engine, delivered by a warm playful-mentor coach.

See `spec.md` for the full spec and milestones, `objective.md` for product vision, `deep-research-chess-coach.md` for architecture, `distinctive_design.md` for the design strategy.

## Repo & deployment
- **GitHub:** https://github.com/Rorylm1/Chess-coach
- **Push frequently — at minimum at the end of every milestone** (M0–M7). Each milestone is independently demoable, so it should land as committed, pushed work.
- **Deploys on Vercel** (prod from `main`, preview deploy per PR). Live URL: _forthcoming_.

## Core principle
**Separation of calculation from teaching.** Stockfish is the source of truth for chess facts; Claude only *narrates* those facts. The LLM never computes chess and never invents moves, evals, or ratings — every move it names is validated against `chess.js` and the engine PV before it's shown.

## Product principles
- **Play first** — learning starts from real games and positions, not lectures.
- **Coach, don't just evaluate** — explain the *idea*, not just the engine score.
- **On-demand, non-intrusive** — help is available, never interrupting.
- **Openings as ideas, not memorization** — plans, structures, traps, transitions.
- **Personal over generic** — learn Rory's recurring mistakes and weak spots.
- **Small loops beat grand systems** — each session leaves one or two memorable ideas.
- **Fun but not gimmicky** — playful tone, real learning.

## Design principles (first-class from day one)
- Distinctive, hand-crafted UI — **not** generic AI aesthetics. Obey the banned-defaults list in `DESIGN.md`: no Inter/Roboto/system fonts, no purple-indigo gradients, no glassmorphism, no three-identical-card grids, no gradient text on metrics, no uniform border-radius, no bounce easing.
- Aesthetic: a *warm editorial study* — knowledgeable, encouraging mentor, not a cold engine dashboard.
- Restraint plus one or two signature motion moments. Motion for React by default; always ship `prefers-reduced-motion` fallbacks.
- Accessibility is not optional: focus states, contrast, alt text baked in.

## Tech stack
Next.js (App Router) on Vercel · react-chessboard (MIT) + chess.js (BSD-2-Clause) · Stockfish WASM (`nmrugg`, GPLv3) in a Web Worker, isolated behind the UCI message boundary · Claude (Anthropic) for the server-side coaching route · IndexedDB (local-first).

**Licensing guardrail:** keep our code permissive. Stockfish WASM stays an isolated static asset; **never** add GPL JS libraries (`chessground`, `chessops`).
