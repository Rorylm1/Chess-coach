/**
 * Build-time eval verification for opening journeys (M5, task #7).
 *
 * The opening *ideas* are human-curated, but the eval numbers shown in the read-through
 * must be the engine's, not ours. This script replays each opening's main line through
 * chess.js, asks the Lichess cloud-eval API for each resulting position, and prints the
 * White-POV centipawns to bake into `content/openings/*.ts` (`evalCp` on each main move).
 *
 * Lichess cloud-eval returns cached evals (opening positions have high coverage) with cp
 * already from White's perspective. We honor the API etiquette: one request at a time,
 * a pause between calls, and a back-off on 429. Run: `node scripts/refresh-opening-evals.mjs`.
 */

import { Chess } from "chess.js";
import { writeFileSync } from "fs";

const OUT = "src/content/openings/evals.generated.json";

const MAIN_LINES = {
  "italian-game": ["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5", "c3", "Nf6", "d3"],
  "queens-gambit": ["d4", "d5", "c4", "e6", "Nc3", "Nf6", "Bg5", "Be7", "Nf3"],
  "sicilian-defense": ["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3"],
  "french-defense": ["e4", "e6", "d4", "d5", "e5", "c5", "c3", "Nc6", "Nf3"],
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function cloudEval(fen) {
  const url = `https://lichess.org/api/cloud-eval?fen=${encodeURIComponent(fen)}&multiPv=1`;
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (res.status === 429) {
      console.error("  429 — backing off 60s…");
      await sleep(60_000);
      continue;
    }
    if (res.status === 404) return { miss: true };
    if (!res.ok) return { error: res.status };
    const data = await res.json();
    const pv = data.pvs?.[0];
    if (!pv) return { miss: true };
    if (pv.mate != null) return { mate: pv.mate };
    return { cp: pv.cp };
  }
  return { error: "retries-exhausted" };
}

// FEN -> White-POV centipawns, the authoritative eval source baked into the build.
const fenToCp = {};

for (const [slug, sans] of Object.entries(MAIN_LINES)) {
  console.log(`\n## ${slug}`);
  const game = new Chess();
  for (const san of sans) {
    game.move(san);
    const fen = game.fen();
    const r = await cloudEval(fen);
    const val =
      r.cp != null
        ? r.cp
        : r.mate != null
          ? `M${r.mate}`
          : r.miss
            ? "MISS"
            : `ERR(${r.error})`;
    if (r.cp != null) fenToCp[fen] = r.cp;
    console.log(`  ${san.padEnd(5)} -> ${val}`);
    await sleep(1200); // one request at a time, be polite
  }
}

writeFileSync(OUT, JSON.stringify(fenToCp, null, 2) + "\n");
console.log(`\nWrote ${Object.keys(fenToCp).length} evals -> ${OUT}`);
