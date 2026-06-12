# Chess Coach

A personal web-based chess coach that turns engine truth into human teaching. After every
meaningful chess moment it answers one question: **"What is the useful lesson here?"** — in plain
language, grounded in the engine, delivered by a warm playful-mentor coach.

> **Separation of calculation from teaching.** Stockfish is the source of truth for chess facts;
> Claude only *narrates* those facts. The LLM never computes chess and never invents moves, evals,
> or ratings — every move it names is validated against `chess.js` and the engine PV before it's shown.

## Status

**M0 — Foundation & Design System ✅** — Next.js app scaffolded, design system locked
("Deep-Space Analysis Deck"), responsive shell deployed. See `spec.md` for the full milestone plan
(M0–M7) and `DESIGN.md` for the design system.

## Tech stack

- **Next.js 16 (App Router)** on Vercel — prod from `main`, preview deploy per PR
- **TypeScript · Tailwind v4** with semantic CSS-variable tokens
- **Motion for React** for the signature motion moment (`prefers-reduced-motion` aware)
- Coming next: `react-chessboard` (MIT) + `chess.js` (BSD-2-Clause) · Stockfish WASM in a Web
  Worker · Claude via a server-side coaching route · IndexedDB (local-first)

**Licensing guardrail:** our code stays permissive. Stockfish WASM (GPLv3) will be an isolated
static asset behind the UCI message boundary; never add GPL JS libraries (`chessground`, `chessops`).

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
```

```bash
npm run build    # production build (type-checks + lints)
npm run start    # serve the production build
npm run lint     # eslint
```

Copy `.env.example` to `.env.local` and fill in `ANTHROPIC_API_KEY` (used from M3).

## Project layout

```
src/app/         App Router routes, layout, globals.css (design tokens)
src/components/   Shell + UI components (SiteHeader, DecorativeBoard, Reveal, …)
DESIGN.md         Design system: tokens, aesthetic, banned-defaults, a11y, motion
research/designs/ Throwaway design-exploration mockups (the chosen direction is D — sci-fi)
screenshots/      Rendered references for design self-review
spec.md           Milestones M0–M7 and acceptance criteria
```

## Design

Distinctive, hand-crafted UI — not generic AI aesthetics. The system is documented in `DESIGN.md`,
including the banned-defaults list. Design exploration lives in `research/designs/`; the locked
direction is **D — "Deep-Space Analysis Deck"** (obsidian + holographic cyan/amber HUD).
