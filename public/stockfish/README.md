# Stockfish.js — isolated engine asset

These files are **Stockfish.js 18** (the WASM build of the Stockfish chess engine),
vendored here as static assets and used only as a separate program communicated with
over the UCI text protocol via Web Worker messages. They are **not** linked into the
application's own (permissive) source.

- `stockfish-18-lite-single.js` / `.wasm` — single-threaded "lite" build. Single-threaded
  so the app needs no COOP/COEP cross-origin-isolation headers on Vercel.
- License: **GPLv3** (see `Copying.txt`).

**Corresponding Source** (GPLv3 §6): the complete machine-readable source for this engine,
including build scripts, is published by Chess.com / Nathan Rugg at
<https://github.com/nmrugg/stockfish.js> (this is the `stockfish` npm package, currently v18).
A formal §6(d) notice is finalized in M7 (release readiness).
