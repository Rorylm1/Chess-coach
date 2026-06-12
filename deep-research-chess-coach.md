# Building a Personal Web-Based Chess Coach: Architecture & Build Plan (June 2026)

## TL;DR
- Build a **Next.js (App Router) app on Vercel** with a **client-side chessboard + chess.js** for play/validation, **browser Stockfish (WASM, in a Web Worker)** for analysis, and a **server-side LLM route** that turns engine output into coaching - keeping the chess calculation and the teaching strictly separated.
- **Licensing is the single biggest design constraint:** Stockfish, chessground, and chessops are GPLv3, and shipping them to a browser counts as "conveying" object code, which triggers GPL source-disclosure obligations. For a project that may go commercial, build v1 on the **permissive stack (react-chessboard MIT + chess.js BSD-2-Clause)** and treat the GPL Stockfish WASM as a deliberate, contained choice.
- Keep v1 lean: **play vs an adjustable bot, on-demand hints, post-game review with mistake tagging, and local-first storage (IndexedDB)**. Defer accounts, databases, opening trainers, and imported-game review to later phases.

## Key Findings

### 1. Recommended v1 architecture
A Next.js App Router application deployed on Vercel, with three cleanly separated layers:
- **Play & board layer (client):** react-chessboard (UI) + chess.js (rules/legal moves/PGN/FEN). All move validation is local and instant.
- **Analysis layer (client, in a Web Worker):** Stockfish compiled to WebAssembly, running off the main thread. It produces eval (centipawns / mate), best move, and principal variation (PV) lines. This is the "what is strong" engine.
- **Coaching layer (server, Vercel Function):** A Next.js route handler receives structured engine output (FEN, eval delta, best move, PV, the move actually played) and calls an LLM to explain "why it matters" in human terms. The LLM API key stays in a server-side Vercel environment variable.

The key architectural principle, matching the product direction, is **separation of calculation from teaching**: the engine is the source of truth for chess facts; the LLM is constrained to narrate those facts, never to invent them.

### 2. Chessboard UI libraries and licensing
- **react-chessboard** - MIT licensed (confirmed in its package.json: `"license": "MIT"`, "MIT (c) Ryan Gregory"). The most popular React board component, listed at **28,710 weekly downloads on npm**, latest **v5.10.0** published in early 2026, actively maintained and Next.js-friendly (requires the `"use client"` directive). **Recommended for v1.**
- **chessground** - Lichess's board, but **GPL-3.0-or-later** (package.json: `"license": "GPL-3.0-or-later"`). Its own README states: "When you use Chessground for your website, your combined work may be distributed only under the GPL. You must release your source code to the users of your website." Powerful (SVG arrows, premoves) but copyleft.
- **cm-chessboard** (shaack) - MIT code, but bundled SVG pieces are CC BY-SA 3.0 (attribution required). A clean permissive alternative.
- **chessboard.js / chessboardjs-react** - MIT, but older / less React-idiomatic.

**Verdict:** Use react-chessboard for v1. Avoid chessground unless you accept GPL.

### 3. Move validation, PGN/FEN, board state
- **chess.js** - BSD-2-Clause (permissive; package.json: `"license": "BSD-2-Clause"`). Handles move generation/validation, check/checkmate/stalemate/draw detection, PGN and FEN. Headless and battle-tested (198+ dependent projects on npm). **Recommended.**
- **chessops** (niklasf) - More powerful (bitboards, variants, streaming PGN, used by Lichess) but **GPL-3.0-or-later** (README: "chessops is licensed under the GNU General Public License 3 or any later version at your choice"). Overkill for v1 and copyleft.

**Verdict:** chess.js for v1; it pairs naturally with react-chessboard and imposes no copyleft.

### 4. Stockfish in the browser (WASM/Workers) vs backend/API
Browser WASM Stockfish is the right default for a personal coach:
- **stockfish.js / stockfish.wasm** (nmrugg, the Chess.com-used port, now Stockfish 18) ships in several "flavors": a large multi-threaded build (>100MB, needs cross-origin isolation headers), a single-threaded large build (runs without special headers, no multithreading), and ~7MB "lite" builds (single- and multi-threaded). All are **GPLv3** ("Stockfish.js (c) 2026, Chess.com, LLC GPLv3").
- **lila-stockfish-web / lichess-org/stockfish-web** are Lichess's WASM builds (SF 16.1 with 70MB NNUE, SF 17.1, etc.), optimized for Lichess and described as "not straight-forward to load and use" in their own README - they explicitly recommend nmrugg/stockfish.js for simpler integration.
- **Multithreading requires SharedArrayBuffer**, which requires **cross-origin isolation** via `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp`. Browser support is broad (Chrome 74+, Firefox 79+, Safari 14.1+ macOS / 14.5+ iOS, Edge 79+), with global usage near 95%.
- Run the engine in a **Web Worker** so search never blocks the UI.

**Backend Stockfish on Vercel is a poor fit:** serverless functions are billed on duration, have memory/duration limits, and a 4.5MB request/response payload cap; sustained deep CPU search on the server is exactly what you do not want in a function. Browser-side WASM is free, private, and scales per user.

### 5. Engines/APIs: local Stockfish vs hosted vs Lichess vs Maia vs hybrid
- **Local browser Stockfish (WASM):** best for analysis, hints, and post-game review. Free, private, no rate limits.
- **Hosted Stockfish APIs** (chess-api.com - Stockfish 18 NNUE, REST + WebSocket, depth <=18, free tier; stockfish.online; others): useful as a fallback or for heavier batch analysis, but introduce a dependency, latency, and rate limits.
- **Lichess cloud eval API** (`/api/cloud-eval`): per the Lichess API docs, it returns "the cached evaluation of a position, if available. Opening positions have more chances of being available. There are about 7 million positions in the database. Up to 5 variations may be available." Great as a near-instant cache hit for common positions, but **not** a general analysis endpoint (cache miss = no result), and it is rate-limited - the docs state: "If you receive an HTTP response with a 429 status... In most cases, waiting one minute before retrying will be sufficient, but some limits may require longer," and "only make one request at a time."
- **Maia** (CSSLab) - a human-like neural network engine, per its Lichess bot page "trained by learning from over 10 million Lichess games between 1100s," targeting rating levels 600-2600, **GPL-licensed**. Maia plays *human-like* moves rather than optimal ones, which is ideal for a fun, beatable, instructive opponent. Important calibration note: Maia's lead developer states "the models do tend to be stronger than their target rating, i.e. Maia 1100 is 1500 in Blitz... due to the models making fewer mistakes than the players at the targeted rating." Running Maia in-browser is non-trivial (it is a Leela/lc0-based net); the simplest path is to defer it and use Stockfish's strength-limiting for v1.
- **Adjustable bot strength with Stockfish:** use `Skill Level` (0-20) and/or `UCI_LimitStrength` + `UCI_Elo`. Stockfish 16.1's UCI output reports `option name UCI_Elo type spin default 1320 min 1320 max 3190` - i.e., a **floor of 1320** (per the official Stockfish docs, this Elo is calibrated at a fixed short time control and anchored to CCRL 40/4). Below that floor you must use Skill Level 0 or reduce threads/time/depth. For a ~1600 user, this range is workable and well-suited.

**Verdict:** Hybrid - local WASM Stockfish as the workhorse; optionally use Lichess cloud eval as an opening-position fast cache; defer Maia to a later phase as the "human-like sparring partner."

### 6. LLM coaching layer - grounding & anti-hallucination
LLMs are demonstrably unreliable at raw chess: benchmark work (e.g., the LLM Chess project and chess_gpt_eval) shows models hallucinate illegal moves, and even strong models lose on forced illegal-move resignations. The fix is to **never let the LLM compute chess** - only narrate engine facts. Concrete patterns:
- **Strict grounding:** pass the LLM a structured payload - FEN, side to move, the move played, engine eval before/after (centipawn or mate), eval delta, best move(s) and PV in SAN, and a categorical label (e.g., blunder/mistake/inaccuracy) computed in code, not by the LLM.
- **Validate every move the LLM names** against chess.js legal moves and against the engine's PV before showing it. Reject/regenerate if it cites a move not in the engine lines.
- **Annotate notation:** research on grounded chess explanation (Grounded Chess Reasoning via Master Distillation, arXiv 2026) recommends bridging notation with natural language ("Qxh7+ - queen takes h7 with check") and grounding in explicit coordinates ("the knight on f3"), because LLMs have limited exposure to chess notation during pretraining.
- **Forbid the LLM from inventing evals or rating numbers**; it may only restate provided numbers. Apply the "high specificity + low attribution = hallucination" heuristic: if the model is being specific about something not in the payload, that is a red flag for a fabricated claim.
- **Move classification stays deterministic:** compute blunder/mistake/inaccuracy from eval deltas (the chess.com approach uses win-probability swings, which is why a hung queen in an already-winning position can be classified "only" a mistake) - this avoids the LLM guessing severity.

### 7. UX patterns worth borrowing
- **chess.com game review:** evaluation graph, move list with color-coded mistakes/blunders, per-move classifications, "key moments," and a coach that explains in plain English. Known pain points to avoid (documented in chess.com's own forums): hiding the eval graph during move review, cramped horizontal move lists that require scrolling to find blunders, and confusing/over-lenient classifications in already-winning positions.
- **Lichess:** clean analysis board, arrows, instant local engine.
- **DecodeChess:** "decode this position" deep natural-language explanations and "learn from my mistakes" flows.
- **Aimchess:** recurring-weakness analytics across many games.
- **Coach personas:** a single warm, encouraging "playful mentor" persona, with notation bridged to plain language and praise for good moves (not just criticism).

Good hint UX: tiered hints (nudge -> concept -> candidate move -> full line), on-demand and non-intrusive, never auto-revealing.

### 8. v1 vs deferred
**Build in v1:** play vs adjustable Stockfish bot; on-demand hints/coaching during the game; post-game review with deterministic mistake tagging + LLM explanations; recurring-weakness tally; local-first IndexedDB storage; polished single-persona coach.
**Defer:** accounts/auth, server database, opening trainer/repertoire, imported-game review (PGN upload / Lichess-Chess.com import), targeted lessons/puzzles, personalized training plans, Maia human-like opponent, multi-device sync.

### 9. Privacy, cost, latency, maintainability
- **Storage:** local-first (IndexedDB for games/PGNs, which can comfortably exceed localStorage's ~5MB limit). Private by default, zero DB cost. Defer a database until accounts/sync are needed.
- **LLM cost:** the only real per-use cost. Coaching calls are on-demand and short; keep prompts compact (structured payload, not whole PGNs), cache explanations per position, and stream responses. Vercel Fluid Compute bills active CPU separately from I/O wait ("Active CPU billing applies while your code is executing, and pauses while your function is waiting on I/O"), so LLM-waiting time is cheap.
- **Latency:** local WASM engine analysis is instant-to-seconds depending on depth; LLM calls are typically a few seconds (stream them). Use shallow depth for in-game hints, deeper for post-game review.
- **Maintainability:** fewer dependencies, permissive licenses, deterministic classification logic, and a thin LLM layer with validation are all easier to maintain.

### 10. Vercel-specific concerns
- **Cross-origin isolation for multithreaded WASM:** set COOP `same-origin` + COEP `require-corp`. On Next.js, configure via `headers()` in `next.config` or a root `vercel.json`. **Critical gotcha:** developers report that on Vercel these headers may not apply to worker scripts / `/_next/static/` assets unless set at the CDN level via `vercel.json`, causing `ERR_BLOCKED_BY_RESPONSE`. COEP also breaks third-party embeds (Stripe, some analytics) - a strong reason to use single-threaded Stockfish in v1 and avoid COOP/COEP entirely until needed.
- **Large WASM binaries:** serve as **static assets** from `public/` (CDN-served), never bundle into a serverless function. The function bundle limit is 250MB uncompressed (~50MB compressed); request/response payloads cap at 4.5MB (error 413 above that).
- **Functions:** default/max durations depend on plan; Fluid Compute (default for new projects) allows up to 800s on Pro/Enterprise and bills active CPU vs provisioned memory separately. Keep secrets in env vars (64KB total per deployment; max 1000 vars per environment).
- **Deployment flow:** GitHub as source of truth; production deploys from `main`; preview deployments per PR. This is Vercel's default and matches the requirement. (Note: Vercel Hobby teams cannot connect repos owned by a Git *organization* - use a personal repo or a Pro team.)

### 11. GPL/licensing - the central legal issue
This determines whether the project can later become a closed/commercial product.
- **Permissive (safe to keep closed):** chess.js (BSD-2-Clause), react-chessboard (MIT), cm-chessboard (MIT, with CC BY-SA 3.0 attribution on piece SVGs).
- **Strong copyleft (GPLv3):** Stockfish (all WASM builds), chessground, chessops, Maia (maia-chess). None of these are AGPL.
- **Does serving WASM/JS to a browser trigger GPL?** Yes. GPLv3 section 0 states: "Mere interaction with a user through a computer network, with no transfer of a copy, is not conveying." But sending JS/WASM to a browser **is** a transfer of a copy, hence it *is* conveying. GPLv3 section 6 ("Conveying Non-Source Forms") then requires you to make "the machine-readable Corresponding Source" available to recipients. The FSF "JavaScript Trap" page confirms GPL JS must be distributed with source under a free license, and even provides a section 7 additional-permission notice for serving minified JS with a URL to the Corresponding Source. chessground's README states the obligation plainly: "You must release your source code to the users of your website."
- **Implication:** If you ship GPL Stockfish WASM to the browser, the standard compliance path is GPLv3 section 6(d): host the corresponding source (including build scripts and any modifications) on a network server with "clear directions next to the object code saying where to find the Corresponding Source." The engine WASM is a separate, unmodified program you call via the UCI text protocol - keeping it at arm's length (loaded as a static asset, communicated with via messages) is the cleanest way to argue your application code is not a derivative work. By contrast, combining GPL JS *libraries* (chessground/chessops) directly into your bundle is a much stronger copyleft trigger for your own code.
- **Server-side-only GPL use is NOT conveying:** if you ran Stockfish only on a server and never sent it to the browser, plain GPLv3 would not force disclosure of your code (the so-called "SaaS loophole," which only AGPL closes). But server-side Stockfish is a poor fit on Vercel anyway.

**Verdict:** For a possible future commercial product, keep YOUR code on a permissive foundation (react-chessboard + chess.js). Treat the GPLv3 Stockfish WASM as a deliberately isolated component (static asset, UCI message boundary) and be prepared to publish the engine's corresponding source with a notice. Avoid GPL JS *libraries* (chessground, chessops) so your own application code is never pulled into copyleft. If you ever want a fully closed product, consider a hosted engine API (GPL stays on their server, not conveyed by you) or budget for the GPL obligations.

## Recommended v1 Architecture (deliverable)
- **Framework:** Next.js (App Router) on Vercel; GitHub source of truth; preview deploys per PR; prod from `main`.
- **Board/UI:** react-chessboard (MIT).
- **Rules/PGN/FEN:** chess.js (BSD-2-Clause).
- **Engine:** Stockfish WASM (nmrugg/stockfish.js, GPLv3) in a Web Worker. **Start with the single-threaded lite build** to avoid COOP/COEP complexity; upgrade to multithreaded later with proper cross-origin isolation headers.
- **Coaching:** Next.js route handler -> LLM, with strict engine-grounded structured prompts and chess.js/PV move validation. API key in Vercel env var.
- **Storage:** IndexedDB, local-first (games, mistakes, weakness tallies).
- **Classification:** deterministic eval-delta logic in code.

## Dependency shortlist (deliverable)
| Purpose | Library | License | Notes |
|---|---|---|---|
| Board UI | react-chessboard | MIT | v1 choice; 28,710 weekly npm downloads, v5.10.0 |
| Rules/PGN/FEN | chess.js | BSD-2-Clause | v1 choice; headless, widely used |
| Engine (analysis + bot) | stockfish.js / .wasm (nmrugg) | GPLv3 | WASM in Worker; static asset; start single-threaded lite |
| LLM SDK | provider SDK (server-side) | varies | key in Vercel env var |
| Local storage | idb (IndexedDB wrapper) | MIT | local-first |
| Optional opening cache | Lichess cloud eval API | service (rate-limited) | opening positions only |
| Deferred: human-like bot | Maia | GPL | later phase |
| Avoid (copyleft on your code) | chessground, chessops | GPL-3.0-or-later | only if you accept GPL |

## Major risks
- **GPL contamination of your own code** if you adopt chessground/chessops - mitigate by using permissive libs and isolating Stockfish WASM behind the UCI message boundary.
- **COOP/COEP misconfiguration on Vercel** breaking workers/static assets or third-party scripts - mitigate by starting single-threaded.
- **LLM hallucination of chess content** - mitigate by strict engine grounding + move validation + deterministic classification.
- **WASM bundle size / load time** - mitigate with lite builds and CDN/`public/` serving.
- **LLM cost creep** - mitigate by on-demand calls, compact prompts, caching, streaming.
- **Lichess API rate limits** if over-relied upon - mitigate by treating cloud eval as optional opening cache only.
- **Mobile/Safari WASM performance** - test early; throttle depth; note some engine builds (e.g., SF16 on Brave) have had browser-specific crash issues, so include a fallback engine build.

## 4-week build plan
- **Week 1 - Play:** Next.js App Router scaffold on Vercel + GitHub with preview/prod flow; react-chessboard + chess.js; full legal-move play; then wire Stockfish WASM in a Worker and play vs bot with adjustable strength (Skill Level / UCI_Elo).
- **Week 2 - Analyze:** Engine eval/PV plumbing; deterministic move classification (blunder/mistake/inaccuracy from eval deltas); eval graph + color-coded move list; on-demand tiered hint button using shallow-depth engine output.
- **Week 3 - Coach:** Server LLM route with strict engine-grounded structured prompts; move validation against chess.js + PV; streaming responses; single playful-mentor persona; post-game review explanations.
- **Week 4 - Remember & polish:** IndexedDB persistence of games/mistakes; recurring-weakness tally and simple dashboard; UX polish (animations, sound, responsive layout); error handling, engine fallbacks, and GPL source/notice for the Stockfish WASM.

## Future feature roadmap
1. **Imported game review** - PGN upload + Lichess/Chess.com import for batch analysis.
2. **Opening trainer/repertoire** with the Lichess opening explorer.
3. **Maia human-like opponent** at selectable rating bands.
4. **Targeted lessons & puzzles** generated from the user's own recurring weaknesses.
5. **Personalized training plans** that adapt over time (Aimchess-style analytics).
6. **Accounts + cloud sync** (introduce a database; consider auth) and multi-device.
7. **Multi-threaded Stockfish** with full cross-origin isolation for deeper analysis.

## Caveats
- "Approximate" engine strengths (Maia's effective rating, Stockfish's `UCI_Elo` calibration) are calibrated under specific time controls and differ from online rating pools; treat them as guidance, not exact Elo. Maia notably plays above its nominal rating (Maia-1100 ~= 1500 blitz).
- Vercel limits and billing models (Fluid Compute) change over time; verify current numbers before launch.
- The GPL analysis here is informed by primary license text (GPLv3 section 0/section 6) and FSF statements but is **not legal advice**; consult a lawyer before commercializing a product that ships GPL code.
- Lichess cloud eval coverage is skewed to openings and popular positions; do not depend on it for arbitrary midgame positions.
