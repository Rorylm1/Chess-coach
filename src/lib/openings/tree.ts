/**
 * The opening book tree — the single source for *both* journey phases (M5).
 *
 * An `Opening` is a curated, human-reviewed knowledge object: the conceptual ideas
 * (plans, piece placement, traps, the middlegame it becomes) plus a shallow tree of
 * taught lines (~8 plies). The tree is the keystone of the "narrow & taught" design:
 *
 *  - the **read-through** walks the *main line* (one `note` per move) and surfaces the
 *    sibling deviations as *asides* ("if the bot plays this instead…");
 *  - the **recall drill** replays the same tree — at a learner-turn node the player's
 *    move must match one of the node's children (else: correct-and-retry); at a bot-turn
 *    node a scripted book bot picks a child weighted by explorer popularity, so it
 *    "tries different things" but only ever inside the lines the read-through taught.
 *
 * Chess facts stay grounded: moves are plain SAN replayed through `chess.js` (legality
 * is verified in tests + the build step), and per-move evals are White-POV centipawns
 * filled by the build step (Lichess cloud eval). This file never computes chess beyond
 * replaying SAN to derive FENs — it has no engine dependency, so it imports anywhere.
 */

import { Chess } from "chess.js";
import GENERATED_EVALS from "@/content/openings/evals.generated.json";

export type Side = "w" | "b";

/** FEN → White-POV centipawns, sourced from the engine (Lichess cloud eval) at build time
 *  by `scripts/refresh-opening-evals.mjs`. This is the *authoritative* eval source — the
 *  read-through never shows a hand-typed number. Keyed by FEN, so transpositions share one
 *  eval. Re-run the script after changing any main line. */
const EVALS: Record<string, number> = GENERATED_EVALS;

/** One move in the book tree, with the teaching attached to it. */
export interface BookMove {
  /** The move in SAN, e.g. "Nf3", "exd5", "O-O". */
  san: string;
  /** Read-through coach note for this move (present on main-line moves). */
  note?: string;
  /** Deviation footnote — shown as an aside when this is an *alternative* bot reply
   *  ("If instead the bot plays …d6, you meet it with …"). */
  aside?: string;
  /** Drill nudge for a learner move: the *idea* without naming the move, shown on a
   *  first wrong attempt before the move itself is revealed. */
  hint?: string;
  /** Marks the main-line continuation at this node (exactly one child should set it). */
  main?: boolean;
  /** Relative weight for the drill bot's reply selection (explorer popularity).
   *  Defaults to 1; the main line is given more weight in content so it shows up most. */
  weight?: number;
  /** Optional offline fallback for White-POV centipawns after this move. The authoritative
   *  eval comes from the engine-sourced {@link EVALS} map (keyed by FEN); this is only used
   *  if that map lacks the position (e.g. a freshly-edited line not yet re-fetched). */
  evalCp?: number;
  /** Replies to this move (the next ply of the tree). */
  children?: BookMove[];
}

/** The four compact teaching panels shown after the read-through. */
export interface ThematicPanels {
  /** What both sides are trying to achieve. */
  plans: string;
  /** Where the pieces belong (and why). */
  pieces: string;
  /** The signature trap/tactic of the opening. */
  trap: { name: string; text: string };
  /** The middlegame the opening transitions into. */
  middlegame: string;
}

/** A curated opening — ideas + the taught book tree. One per `content/openings/*.ts`. */
export interface Opening {
  /** URL slug, e.g. "italian-game". */
  slug: string;
  /** Display name, e.g. "Italian Game". */
  name: string;
  /** ECO code(s), e.g. "C50–C54". */
  eco: string;
  /** The side the learner plays (and the journey is written from). */
  learnerSide: Side;
  /** One-line hook for the index card. */
  blurb: string;
  /** The opening's main purpose — the read-through intro paragraph. */
  idea: string;
  /** First move(s) from the start position (the root ply of the tree). */
  root: BookMove[];
  /** The thematic teaching panels. */
  panels: ThematicPanels;
}

/** Side to move at a 0-indexed ply (White opens, so even = White, odd = Black). */
export function moverAt(ply: number): Side {
  return ply % 2 === 0 ? "w" : "b";
}

/** Whether the learner is the one to move at this ply. */
export function isLearnerTurn(opening: Opening, ply: number): boolean {
  return moverAt(ply) === opening.learnerSide;
}

/** Pick the main child at a node (the one flagged `main`, else the first). */
export function mainChild(children: BookMove[] | undefined): BookMove | null {
  if (!children || children.length === 0) return null;
  return children.find((c) => c.main) ?? children[0];
}

/** One resolved step of the read-through main line. */
export interface ReadStep {
  /** 0-indexed ply. */
  ply: number;
  /** Full-move number (1, 1, 2, 2, …). */
  moveNumber: number;
  /** Side that makes this move. */
  mover: Side;
  /** True when the learner makes this move. */
  learner: boolean;
  /** The main-line move played at this step. */
  move: BookMove;
  /** FEN before the move (the position shown until the move animates in). */
  fenBefore: string;
  /** FEN after the move (the position the board rests on for this step). */
  fenAfter: string;
  /** The move's origin/target squares, for the board's last-move highlight. */
  from: string;
  to: string;
  /** White-POV eval after the move (from content; undefined until build-verified). */
  evalCp?: number;
  /** Alternative bot replies branching from this node, with their asides (deviations). */
  deviations: BookMove[];
}

/**
 * Walk the main line into an ordered list of read-through steps. Each step carries the
 * move, the before/after FEN (derived by replaying SAN), and any sibling deviations so
 * the read-through can show them as asides at the branch point.
 */
export function readSteps(opening: Opening): ReadStep[] {
  const steps: ReadStep[] = [];
  const game = new Chess();
  let nodes: BookMove[] | undefined = opening.root;
  let ply = 0;

  while (nodes && nodes.length > 0) {
    const move = mainChild(nodes);
    if (!move) break;
    const fenBefore = game.fen();
    let applied;
    try {
      applied = game.move(move.san);
    } catch {
      break; // content bug — caught by tests; never throw at runtime
    }
    const fenAfter = game.fen();
    steps.push({
      ply,
      moveNumber: Math.floor(ply / 2) + 1,
      mover: moverAt(ply),
      learner: isLearnerTurn(opening, ply),
      move,
      fenBefore,
      fenAfter,
      from: applied.from,
      to: applied.to,
      // Engine eval (build-baked) is authoritative; inline evalCp is only an offline fallback.
      evalCp: EVALS[fenAfter] ?? move.evalCp,
      deviations: nodes.filter((n) => n !== move && n.aside),
    });
    nodes = move.children;
    ply++;
  }
  return steps;
}

/** The starting FEN, before any move. */
export const START_FEN = new Chess().fen();

/** Weighted random pick among book moves (the drill bot's "different things").
 *  `rng` is injectable so tests can make it deterministic. */
export function pickWeighted(moves: BookMove[], rng: () => number = Math.random): BookMove {
  const total = moves.reduce((sum, m) => sum + (m.weight ?? 1), 0);
  let r = rng() * total;
  for (const m of moves) {
    r -= m.weight ?? 1;
    if (r < 0) return m;
  }
  return moves[moves.length - 1];
}

/**
 * Resolve a learner's attempted SAN against the children of the current node.
 * Returns the matched child (advance the drill) or null (off-book → correct-and-retry).
 * Match is tolerant of check/mate/annotation suffixes so "Bb4" matches "Bb4+".
 */
export function matchLearnerMove(children: BookMove[] | undefined, san: string): BookMove | null {
  if (!children) return null;
  const norm = (s: string) => s.replace(/[+#!?]/g, "");
  const target = norm(san);
  return children.find((c) => norm(c.san) === target) ?? null;
}

/** Every root-to-leaf line in the tree as SAN sequences — for legality tests + the build step. */
export function allLines(opening: Opening): string[][] {
  const lines: string[][] = [];
  const walk = (nodes: BookMove[] | undefined, prefix: string[]) => {
    if (!nodes || nodes.length === 0) {
      if (prefix.length > 0) lines.push(prefix);
      return;
    }
    for (const node of nodes) walk(node.children, [...prefix, node.san]);
  };
  walk(opening.root, []);
  return lines;
}
