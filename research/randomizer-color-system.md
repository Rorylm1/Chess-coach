# Randomizer Colour System — build reference (M6, Feature 1)

The engineering spine for the per-game **randomized board** (`spec.md` M6). It is the *technical* half;
the *taste* half is the `research/designs/` exploration done first (per `distinctive_design.md` — explore,
render, screenshot-review, then "port the decisions, not the code"). This doc is researched + sourced;
treat thresholds as defaults to build from, tune against real rolls in the mockups.

OKLCH throughout: **L** = 0–1 (perceptual lightness), **C** = chroma (0 → ~0.37 in sRGB), **H** = 0–360°.

## Core architecture — "constrain first, vary second"

Every serious generative artist (Tyler Hobbs / Fidenza, Matt DesLauriers / canvas-sketch) converges on
the same principle, and it *is* our decided approach: **do not randomize freely.** Fix most dimensions,
jitter one axis within tight, perceptually-calibrated bands. Variety comes from *which curated family* is
chosen and *how much* it's perturbed — never from raw colour randomness. Risky generators get weighted
lower ("rarity tiers") so an ugly roll is rare by construction.

For the board: **fix the lightness scaffold as constants** (light-square L, dark-square L, piece L
extremes, accent L are the same across all seeds); let the **seed pick only hue + small chroma jitter**
within the family's clamps. The board's *structure* is constant; only its *colour family* varies. This is
the single most important takeaway.

## 1. Harmony rule

For our shape — two-tone board + two-tone pieces + one accent:
- **Board = monochromatic.** Light + dark square share one hue H, differing mainly in **L** (a big
  lightness gap). Two analogous-but-different hues read "dirty"; two shades of one hue read as an
  intentional board (walnut+maple, green+ivory). Allow ≤ ±15° hue drift between squares.
- **Pieces = near-neutral, pushed to L extremes.** White piece near-white, black piece near-black, very
  low chroma (optionally tinted toward H). This is what lets each piece clear contrast on *both* squares.
- **Accent = split-complementary, high chroma.** `H + 150` or `H + 210` (split-comp is safer than pure
  `+180` — less vibration, more forgiving across random seeds). Small elements only (last-move / check /
  selection ring).

Hue offsets from base H (apply directly to OKLCH hue): complementary `+180`; analogous `±30`;
split-comp `+150/+210`; triadic `+120/+240`; tetradic-rectangle `+60/+180/+240`; square `+90/+180/+270`.
**Never derive a hue by averaging two hues** — that produces mud.

## 2. Colour space + library

**OKLCH, full stop.** HSL's `L` is a math artifact, not perceived brightness (HSL "50% L, 100% S"
measures CIELAB L* 88.6 for yellow vs 50.6 for green — green is perceptually half as bright at the same
number). OKLCH gives three independent axes; equal L = equal perceived brightness across hues, which is
what makes the contrast floors actually hold.

**Library: `culori`, imported from `culori/fn`** (MIT — clean against the permissive guardrail).
Most complete single dependency; tree-shaken to our function set ≈ 3–6 KB.

```js
import { useMode, modeOklch, modeRgb, converter, formatCss,
         clampChroma, wcagContrast, wcagLuminance, inGamut } from 'culori/fn';
useMode(modeRgb);
const oklch = useMode(modeOklch);
```
Use: `oklch()` / `converter('oklch')`, `formatCss` (emits `oklch(...)` CSS), `clampChroma(c,'oklch')`
(hue-preserving gamut clamp — the default), `inGamut`, `wcagContrast`, `wcagLuminance`.
**Gotcha:** the default `from 'culori'` is *not* tree-shakeable — use `culori/fn` + register modes. Types
via `@types/culori` (devDep). Only gap: **no APCA** — WCAG via culori is sufficient here. If APCA ever
becomes a hard requirement, escalate to `colorjs.io` (`contrastAPCA()`, ~25 KB); **avoid the standalone
`apca-w3` package** (non-permissive "W3 License" — conflicts with the guardrail).

## 3. Seeding (deterministic, shareable)

Genart skeleton: **hash string seed → seed PRNG → draw one ordered stream of floats → drive every
decision from that stream.** Use **`xmur3`** (string → 32-bit seed) + **`mulberry32`** (int → float);
both ~5 lines, public-domain, smallest/fastest at this scale (~a dozen draws per theme).

```js
function xmur3(str){ for(var i=0,h=1779033703^str.length;i<str.length;i++)
  h=Math.imul(h^str.charCodeAt(i),3432918353),h=h<<13|h>>>19;
  return function(){h=Math.imul(h^h>>>16,2246822507);h=Math.imul(h^h>>>13,3266489909);
  return (h^=h>>>16)>>>0;}}
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;
  var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;
  return ((t^t>>>14)>>>0)/4294967296;}}

const rand = mulberry32(xmur3(seedString)());
```
Draw in **fixed order**: (1) pick family (weighted — safe common, bold rare); (2) bounded draws jitter
hue/chroma within the family clamps; (3) derive accent via the fixed split-comp offset. Same seed → same
sequence → same palette. **Shareability is free:** the seed string in the URL (`?b=walnut-42`) *is* the
palette — nothing to persist server-side (the M7 share-link reuses this). Optionally discard the first 1–2
`rand()` draws as warm-up to avoid low-seed correlation.

## 4. Contrast + lightness backstop (exact thresholds)

Two independent floors, enforced after generation:
- **Piece vs square: WCAG ≥ 3:1.** A piece is a graphical object on a background → WCAG 1.4.11 Non-text
  Contrast mandates **3:1** (the 4.5:1 *text* figure does not apply). **Each piece must clear 3:1 against
  BOTH squares** — the binding constraint. Don't round (2.999 fails). Optional perceptual check: APCA
  Lc ≥ 30.
- **Square vs square lightness gap: ΔL_oklch ≥ 0.28** (≈ CIELAB ΔL* 30; 0.35+ is comfortable). Squares
  don't need a *ratio* against each other — the perceptual L gap is the right metric.

**Backstop algorithm** (binary-search or fixed-step on the monotonic L axis):
1. **Square gap first:** if `L_light − L_dark < 0.28`, push light L up / dark L down by the deficit
   (hold C, H).
2. **Piece contrast loop:** per piece, step L by 0.02 (or binary-search) toward its extreme until
   `wcagContrast(piece, square) ≥ 3` against the *harder* of its two squares.
3. **Gamut clamp after every L nudge:** `clampChroma` (or binary-search C holding L,H) to stay in sRGB.
4. **Re-assert** all four piece-square pairs ≥ 3:1 and square ΔL ≥ 0.28; on a pathological seed, fall
   back to known-good anchors (piece L 0.95 / 0.20).

## 5. Anti-slop guardrails (encode as hard clamps)

- **Mud-zone ban (most important single rule):** no colour at **`0.40 ≤ L ≤ 0.60` AND
  `0.05 ≤ C ≤ 0.12`** simultaneously. Force it out — raise C above ~0.13 (commit to colour) or drop below
  ~0.04 (commit to neutral).
- **Large fills must be low-chroma:** board squares fill ~half the screen. **Square C ≤ 0.08** (coloured)
  or **≤ 0.04** (premium near-neutral). Never exceed 0.10.
- **One accent only breaks the muted band:** accent **C 0.12–0.20**, small elements only. Total key hues
  ≤ 3 (1 dominant + 1–2 accents).
- **Anti-vibration:** never place two `C > 0.05` colours within **ΔL < 0.15** when they share an edge.
- **Always include a true neutral anchor** (`C ≤ 0.02`, optionally hue-tinted) for frame / coordinates /
  chrome. No-neutral palettes are a top AI-slop tell — alongside default purple/indigo (avoid H ≈ 270–290
  as primary), neon-on-dark, and gradient-as-interest.
- **Temperature consistency:** keep key hues within ~±60° of one warm or cool centre.
- **Proportion 60-30-10** (dominant base / secondary / accent) — accent's 10% is the only high-chroma area.

## 6. Family archetypes (6 recommended)

Each stores constant L anchors + a seed-jittered hue/chroma within clamps. Ranges already satisfy every
backstop above. Weight safe families higher; `jewel` is a low-weight rarity tier.

| Family | Square hue H | Light sq | Dark sq | Pieces (white / black) | Accent | Weight |
|---|---|---|---|---|---|---|
| **Warm wood** (walnut/maple) | 30–55° (±8) | L .84 C .045 | L .50 C .065 | L .95 C .015 / L .22 C .025 | H+155, L .60 C .15 | high |
| **Cool slate/stone** | 230–260° | L .82 C .03 | L .48 C .05 | L .96 C .008 / L .24 C .02 | H+150, L .58 C .14 | high |
| **Ink & parchment** (mono) | 70–90° (barely) | L .90 C .02 | L .42 C .03 | L .97 C .006 / L .18 C .015 | H+180, L .55 C .13 | high |
| **Sage / olive** | 120–150° | L .83 C .055 | L .50 C .07 | L .95 C .012 / L .23 C .02 | H+155, L .60 C .16 | medium |
| **Marble** (cool near-neutral) | 250–290° (very low C) | L .88 C .015 | L .58 C .025 | L .97 C .005 / L .26 C .015 | H+150, L .58 C .15 | medium |
| **Jewel tones** (bold, rare) | seed any, C pushed | L .80 C .07 | L .45 C .09 | L .96 C .01 / L .20 C .02 | H+210, L .55 C .19 | low (rarity) |

Dark squares stay above L 0.42; a dark-mode-native / high-contrast-neon variant could go lower as another
low-weight tier if wanted. All keep square ΔL ≥ 0.30, square C ≤ 0.09, pieces near-neutral at L extremes,
accent at split-comp/comp high chroma — every roll passes the backstop with margin; jitter only moves
things within the safe envelope.

## The build, in one line

seed string → `xmur3`+`mulberry32` → weighted family pick → jitter hue + small chroma within the family's
OKLCH clamps → derive monochromatic squares + near-neutral pieces + split-complementary accent → run the
contrast / ΔL / mud-zone backstop in `culori` → emit `oklch()` CSS variables on the Board. Varied,
reproducible, shareable by seed, ugly-by-construction-impossible.

## Strongest reference sources

1. **Tyler Hobbs — *Working with Color in Generative Art*** + **Fidenza** — probabilistic/weighted
   palettes, randomize one axis within a range, rarity tiers.
   https://www.tylerxhobbs.com/words/working-with-color-in-generative-art ·
   https://www.tylerxhobbs.com/words/fidenza
2. **Evil Martians — *OKLCH in CSS*** — the canonical why-OKLCH-beats-HSL explainer, with the
   perceptual-lightness proof. https://evilmartians.com/chronicles/oklch-in-css-why-quit-rgb-hsl
3. **bryc/code PRNGs** — verbatim `xmur3` / `mulberry32` / `sfc32` with quality notes.
   https://github.com/bryc/code/blob/master/jshash/PRNGs.md
4. **`nice-color-palettes` (MIT)** — vendorable curated pool (top ColourLovers palettes) if we want to
   seed family base colours from real hand-made palettes. https://www.npmjs.com/package/nice-color-palettes
5. **culori docs** + **WCAG 1.4.11 Non-text Contrast** (the 3:1 graphical floor).
   https://culorijs.org/api/ · https://www.w3.org/WAI/WCAG21/Understanding/non-text-contrast.html
