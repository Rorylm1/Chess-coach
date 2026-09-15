/** Build a standalone, offline gallery from the exact SVGs and piece CSS used by Play. */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../..");
const cache = new Map();
// This small graph contains only local piece data; type-only circular imports disappear.
function loadData(file) {
  if (cache.has(file)) return cache.get(file).exports;
  const compiledModule = { exports: {} };
  cache.set(file, compiledModule);
  const code = ts.transpileModule(readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const localRequire = (name) => {
    if (!name.startsWith("./")) throw new Error(`Unexpected import in piece data: ${name}`);
    return loadData(resolve(dirname(file), `${name}.ts`));
  };
  new Function("require", "module", "exports", code)(localRequire, compiledModule, compiledModule.exports);
  return compiledModule.exports;
}
const { PIECE_SETS } = loadData(resolve(root, "src/lib/table/pieceSets.ts"));
const sheet = readFileSync(resolve(root, "src/app/globals.css"), "utf8");
const pieceCss = sheet.slice(sheet.indexOf(".piece svg {"), sheet.indexOf("/* a dealt table"));
const additions = [
  { id: "clockwork", name: "Clockwork", category: "Original · drawn for Chess Coach", note: "Wind-up royalty, mechanical horses and little tin soldiers.", source: null },
  { id: "tidal", name: "Tidal", category: "Original · drawn for Chess Coach", note: "A flowing court of sea creatures, coral and curling seahorses.", source: null },
  { id: "maurimo-fantasy", name: "Fantasy", category: "Maurizio Monge · MIT", note: "An illustrated, sculptural take on the familiar chess court.", source: "https://github.com/maurimo/chess-art" },
  { id: "kiwen-suwi", name: "Kiwen-suwi", category: "neverRare · CC BY 4.0", note: "A heart-shaped king, looped bishop and wide-eyed knight in bold toy-like shapes.", source: "https://github.com/neverRare/kiwen-suwi" },
  { id: "rhosgfx", name: "RhosGFX", category: "RhosGFX · CC0", note: "Plump, playful silhouettes with a bold illustrated outline.", source: "https://rhosgfx.itch.io/vector-chess-pieces" },
];
const roles = { K: "King", Q: "Queen", R: "Rook", B: "Bishop", N: "Knight", P: "Pawn" };
const cards = additions.map(({ id, name, category, note, source }) => {
  const set = PIECE_SETS[id];
  if (!set) throw new Error(`Missing piece family: ${id}`);
  const armies = ["w", "b"].map((side) => `<div class="army" aria-label="${side === "w" ? "White" : "Black"} pieces">${Object.entries(roles).map(([type, label], i) => `<div class="square ${i % 2 ? "dark" : "light"}"><span class="piece ${side}"><svg viewBox="${set.vb}" role="img" aria-label="${side === "w" ? "White" : "Black"} ${label}">${set.inner[type]}</svg></span></div>`).join("")}</div>`).join("");
  return `<article data-pieceset="${id}" data-pieces="filled"><header><span class="category">${category}</span><h2>${name}</h2><p>${note}</p></header><div class="pieces">${armies}<div class="labels">${Object.values(roles).map((name) => `<span>${name}</span>`).join("")}</div></div>${source ? `<a class="credit" href="${source}">Artist & original artwork ↗</a>` : '<span class="credit">Original recolorable SVG artwork</span>'}</article>`;
}).join("");
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Five new chess families · Chess Coach</title><style>
*{box-sizing:border-box}body{margin:0;background:#f2eee5;color:#252922;font:15px/1.5 ui-sans-serif,sans-serif;--size:62px;--sq-light:#e7ebce;--sq-dark:#778867;--piece-white:#fff8e9;--piece-white-rim:#493724;--piece-black:#352b45;--piece-black-rim:#ede0fa;--board-accent-glow:#9685ad}
body[data-palette="candy"]{--sq-light:#ffe6c8;--sq-dark:#cb8054;--piece-white:#fffaea;--piece-white-rim:#71351f;--piece-black:#512477;--piece-black-rim:#f3d3ff}
body[data-palette="midnight"]{--sq-light:#496575;--sq-dark:#162d37;--piece-white:#eaffeb;--piece-white-rim:#163b30;--piece-black:#331544;--piece-black-rim:#f6badc}
main{max-width:1120px;margin:auto;padding:48px 24px}.eyebrow,.category{font:11px ui-monospace,monospace;text-transform:uppercase;letter-spacing:.12em;color:#59614f}.eyebrow{color:#687950}h1{font:clamp(36px,5vw,58px)/1.06 Georgia,serif;margin:14px 0}h1 em{color:#637746;font-weight:normal}h1+p{max-width:670px;color:#56604e;margin:0 0 24px}.toolbar{display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin:28px 0 30px}.toolbar span{font-size:12px;color:#59614f}.toolbar button{background:#faf8f2;border:1px solid #c7cbbd;padding:10px 15px;border-radius:24px;color:#303a28;cursor:pointer;font:inherit;font-size:12px}.toolbar button[aria-pressed="true"]{background:#344a2a;color:white;border-color:#344a2a}.toolbar button:focus-visible{outline:2px solid #637746;outline-offset:3px}.gap{flex:1}.gallery{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}article{padding:25px;background:#faf8f2;border:1px solid #d9decd;border-radius:18px;overflow:hidden}article:nth-child(-n+2){background:#fffdf5;border-color:#bcc7ab}h2{font:32px Georgia,serif;margin:9px 0 6px}article p{font-size:13px;color:#5f6857;margin:0 0 23px;max-width:360px}.pieces{max-width:calc(var(--size)*6);margin:0 auto}.army,.labels{display:grid;grid-template-columns:repeat(6,minmax(0,1fr))}.square{aspect-ratio:1;display:grid;place-items:center;--c:var(--size)}.light{background:var(--sq-light)}.dark{background:var(--sq-dark)}body[data-swap="true"] .light{background:var(--sq-dark)}body[data-swap="true"] .dark{background:var(--sq-light)}.labels{font:10px ui-monospace,monospace;text-align:center;color:#606b53;gap:2px;margin:10px 0 19px}.credit{font-size:11px;color:#667450;text-decoration:underline;text-underline-offset:3px}span.credit{text-decoration:none}.foot{font-size:12px;color:#68715f;margin:24px 0 0}.foot a{color:inherit}svg{max-width:90%;height:auto!important}.piece{display:grid;place-items:center;max-width:100%}.piece svg{width:calc(var(--size)*.86);height:calc(var(--size)*.86)}
${pieceCss}
@media(max-width:720px){main{padding:30px 18px}.gallery{grid-template-columns:1fr}article{padding:20px}.gap{display:none}.square{--c:min(var(--size),calc((100vw - 80px)/6))}.labels{font-size:9px}}
</style></head><body data-palette="candy"><main><span class="eyebrow">Chess Coach · Piece collection</span><h1>Five more ways<br>to <em>play a little differently.</em></h1><p>Two original families and three guest artists. All six roles, both armies, and the same recoloring used by the board randomizer.</p><div class="toolbar"><span>Try a palette</span><button data-palette="classic" aria-pressed="false">Garden</button><button data-palette="candy" aria-pressed="true">Candy shop</button><button data-palette="midnight" aria-pressed="false">Midnight</button><span class="gap"></span><button id="small" aria-pressed="false">Phone size</button><button id="swap" aria-pressed="false">Swap squares</button></div><section class="gallery">${cards}</section><p class="foot">${Object.keys(PIECE_SETS).length} silhouette families now available in the randomizer. Guest artwork has been adapted for recoloring. <a href="http://localhost:3001/licenses/chess-pieces/NOTICE.txt">Full piece credits</a>.</p></main><script>
for(const button of document.querySelectorAll('button[data-palette]'))button.onclick=()=>{document.body.dataset.palette=button.dataset.palette;for(const b of document.querySelectorAll('button[data-palette]'))b.setAttribute('aria-pressed',String(b===button));};
document.querySelector('#small').onclick=function(){const on=this.getAttribute('aria-pressed')!=='true';this.setAttribute('aria-pressed',String(on));document.body.style.setProperty('--size',on?'40px':'62px');};
document.querySelector('#swap').onclick=function(){const on=this.getAttribute('aria-pressed')!=='true';this.setAttribute('aria-pressed',String(on));document.body.dataset.swap=String(on);};
</script></body></html>`;
const output = resolve(here, "piece-families.html");
writeFileSync(output, html);
console.log(`Wrote ${output}`);
