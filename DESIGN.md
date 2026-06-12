# Chess Coach — Design System

> Loaded every session. This is the source of truth for how Chess Coach looks and moves.
> When building UI, obey the tokens and the **Banned defaults** list. Distinctive, hand-crafted,
> never generic-AI. See `research/designs/` for the locked mockups and `screenshots/` for renders.

## Named aesthetic: "Deep-Space Analysis Deck"

A calm, luminous, high-tech command deck for studying chess — the holographic analysis console
of a starship. Precise instrument-like layout, obsidian depth, neon accents that *carry meaning*
(not decoration). The coach is a knowledgeable mentor speaking over a clean HUD.

**We are NOT:** a flat dark dashboard, neo-brutalist, generic SaaS, glassmorphic, or "engine UI
with a friendly label." Cinematic but legible; bold but never a gimmick.

The board itself is the hero. It must read as a real, tactile, instantly-legible chessboard
(strong square contrast, crisp pieces, clear affordances) — ported from the "Modern Mentor"
board craft into this aesthetic.

## Type

- **Display / wordmark / headings:** `Chakra Petch` (futurist), letter-spacing ~0.06em; uppercase
  for the wordmark (~0.14em). Use weight + size extremes for hierarchy.
- **Body / UI / the human coach voice:** `Sora` (300–600).
- **Engine voice (monospace):** `JetBrains Mono` — evals, SAN notation, clocks, coordinates,
  depth, HUD ticks. This mono-vs-Sora split *is* the product's "engine truth vs human teaching"
  separation made visible. Use `font-variant-numeric: tabular-nums` for all numbers.

Loaded via `next/font/google` in `src/app/layout.tsx` and exposed as CSS variables.

## Color tokens (CSS variables — see `globals.css`)

```
/* Deep-space surfaces */
--void:       #070A0F;   --bg:        #0A0E14;   --panel:   #10161F;
--panel-2:    #0D131B;   --surface:   #161E2A;   --slate:   #1E2835;
/* Luminous accents — meaning-bearing */
--cyan:       #46E0D0;   /* primary: selection, hints, live state, focus, CTA */
--cyan-dim:   #2A8E84;   --cyan-glow: rgba(70,224,208,0.45);
--amber:      #FFB454;   /* contrast: evals, last-move, the "you" player */
--amber-dim:  #B97E33;
/* Text on dark */
--ink:        #E8F0F2;   --ink-soft:  #9DB0BC;   --ink-faint: #607080;
--hairline:   rgba(70,224,208,0.16);   --hairline-2: rgba(157,176,188,0.12);
/* Board squares — clear light vs dark, on-theme cool slate */
--sq-light:   #5C7382;   --sq-dark:   #1B2733;
```

**Accent discipline:** cyan = *interactive / your action / system-live*. amber = *evaluation /
last move / you-the-player*. Never swap their meanings; never use both as generic decoration.

## Surfaces, depth, radii

- Background = layered radial depth glows (cyan top-right, amber bottom-left) over `--void`,
  plus a faint masked grid overlay. **Never flat black.**
- Depth via crisp neon strokes + soft outer `box-shadow` glow — **not** frosted/blurred glass.
- Panels: `linear-gradient(180deg, var(--panel), var(--panel-2))`, 1px `--hairline-2` border,
  optional cyan **corner brackets** (the signature HUD frame).
- **Radii are intentionally varied** — sharp/clipped HUD corners (`clip-path` polygons) on
  buttons/avatars, small radii on cards. Never one uniform radius everywhere.

## Motion (Motion for React; CSS for simple cases)

- Signature moment: a staggered **"boot-up" reveal** on load — elements fade/translate in with
  per-element delay. Easing `cubic-bezier(0.2,0.7,0.3,1)` (ease-out). One-shot board **scan
  sweep** is allowed. A slow pulse on the live status dot.
- Tactile hover: CTA/buttons lift 1–2px + cyan glow, 200ms ease-out. **No bounce/elastic easing.**
- **Always** ship a `@media (prefers-reduced-motion: reduce)` fallback that disables all
  animation/transition and hides decorative motion (scan, pulse).

## Board spec (the hero — port verbatim from `direction-d-scifi-play.html`)

- 8×8 CSS grid, square size `--c: min(9.6vw, 70px)`; 1px cyan border + outer cyan glow.
- Light squares `--sq-light`, dark `--sq-dark` — contrast must make the grid obvious at a glance.
- White pieces: `#F5FBFB` bright glyphs w/ soft glow. Black pieces: `#0B1118` filled glyphs with
  a subtle cyan rim so colour reads on both square tones. Pieces `clamp(30px,7.4vw,52px)`.
- Affordances: **last-move** = amber inset ring + 22% amber fill; **selected** = cyan inset ring
  + glow; **legal-move hint** = small cyan dot (26%); **capture hint** = cyan ring (78%).
- Coordinates: `JetBrains Mono`, a–h bottom-right of file squares, 1–8 top-left of rank squares.

## Accessibility (not optional — bake in from day one)

- WCAG **AA** contrast everywhere — special care for pieces, coordinates, and `--ink-soft` text
  on the dark background.
- `:focus-visible` = `2px solid var(--cyan)`, `outline-offset: 3px`. Never remove focus rings.
- Real `alt`/`aria-label` on the board and every meaningful glyph/icon (the board mockup carries
  a full natural-language position description — keep that pattern).
- Respect `prefers-reduced-motion`. Hit targets ≥ 40px on touch.

## Banned defaults (hard constraints — do not ship any of these)

- ❌ Inter, Roboto, Arial, system-ui (or Space Grotesk) fonts
- ❌ purple/indigo gradients (or any generic "AI hero" gradient)
- ❌ glassmorphism / frosted translucent blurred panels
- ❌ three identical cards in a row
- ❌ gradient text on numbers/metrics
- ❌ uniform border-radius on everything
- ❌ bounce / elastic easing
- ❌ flat pure-black backgrounds; generic AI-slop look
</content>
