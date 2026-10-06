/** Offline authoring check; runtime lessons never download or run an engine.
 * Run: node scripts/verify-lesson-challenges.mjs [depth, default 16]
 */
import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { Chess } from 'chess.js';
const depth = Number(process.argv[2] || 16);
const engine = spawn(process.execPath, ['node_modules/stockfish/bin/stockfish-18-lite-single.js']);
const lines = createInterface({ input: engine.stdout });
let receive;
lines.on('line', line => receive?.(line));
engine.stderr.on('data', data => process.stderr.write(data));
function command(commands, end) {
  return new Promise((resolve, reject) => {
    const output = []; const timeout = setTimeout(() => reject(new Error('Engine timeout')), 60000);
    receive = line => { output.push(line); if (line.startsWith(end)) { clearTimeout(timeout); receive = null; resolve(output); } };
    engine.stdin.write(commands.join('\n') + '\n');
  });
}
function score(output) {
  const info = output.filter(line => line.startsWith('info depth') && line.includes(' score ')).at(-1);
  const match = info?.match(/score (cp|mate) (-?\d+)/);
  if (!match) throw new Error('Missing engine score');
  return { type: match[1], value: Number(match[2]), bestmove: output.at(-1).split(' ')[1] };
}
const results = [];
try {
 await command(['uci'], 'uciok');
 await command(['setoption name Threads value 1','setoption name Hash value 32','isready'],'readyok');
 for (const file of readdirSync('src/content/opening-lessons').filter(file=>file.endsWith('.json') && !['histories.json','games.json','challenge-checks.json'].includes(file))) {
  for (const lesson of JSON.parse(readFileSync('src/content/opening-lessons/'+file))) {
   const game = new Chess(); lesson.moves.forEach(san => game.move(san));
   const baseline = score(await command([`position fen ${game.fen()}`, `go depth ${depth}`], 'bestmove'));
   const answers = [];
   for (const san of lesson.challenge.answers) {
    const m = new Chess(game.fen()).move(san); const uci = m.from+m.to+(m.promotion||'');
    const result = score(await command([`position fen ${game.fen()}`, `go depth ${depth} searchmoves ${uci}`], 'bestmove'));
    const lossCp = baseline.type === 'cp' && result.type === 'cp' ? Math.max(0, baseline.value-result.value) : null;
    answers.push({san,...result,lossCp});
   }
   const result = {slug:file.replace('.json',''),line:lesson.id,moves:lesson.moves,fen:game.fen(),baseline,answers};
   results.push(result); console.log(result.slug,lesson.id,baseline.value,answers.map(a=>`${a.san}: ${a.value} (loss ${a.lossCp})`).join(', '));
  }
 }
 writeFileSync('src/content/opening-lessons/challenge-checks.json',JSON.stringify({engine:'Stockfish 18 lite single',depth,date:new Date().toISOString(),results},null,2)+'\n');
} finally { engine.stdin.write('quit\n'); engine.kill(); }
