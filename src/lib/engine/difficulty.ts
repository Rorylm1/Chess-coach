/**
 * Bot strength presets.
 *
 * Strength is driven primarily by Stockfish's `Skill Level` (0–20), which introduces
 * deliberate, human-like imperfection at lower values — far more natural for a beatable
 * opponent than just throttling depth. We pair it with a per-move time budget so weak
 * levels also think briefly (snappy, and extra-fallible) while strong levels get more
 * room. The single-threaded lite engine is still superhuman at level 20, so the ceiling
 * is plenty.
 *
 * UCI_Elo is intentionally not used here: its floor is ~1320, which can't express the
 * genuinely-beginner play Skill Level 0–4 gives. We may surface an Elo mode later.
 */
export type DifficultyId = "learner" | "casual" | "club" | "sharp" | "master";

export interface Difficulty {
  id: DifficultyId;
  /** Short display name (Chakra Petch). */
  label: string;
  /** One-line character note shown under the selector. */
  blurb: string;
  /** Stockfish Skill Level, 0–20. */
  skill: number;
  /** Per-move think time in ms. */
  movetime: number;
  /** Optional hard depth cap (keeps the very weak levels fast + fallible). */
  depth?: number;
  /** Rough human-facing strength label for the opponent strip. */
  elo: string;
}

export const DIFFICULTIES: Difficulty[] = [
  {
    id: "learner",
    label: "Learner",
    blurb: "Makes plenty of mistakes. A gentle place to start.",
    skill: 0,
    movetime: 200,
    depth: 5,
    elo: "~800",
  },
  {
    id: "casual",
    label: "Casual",
    blurb: "Plays sensibly but will let you punish loose moves.",
    skill: 4,
    movetime: 350,
    depth: 8,
    elo: "~1100",
  },
  {
    id: "club",
    label: "Club",
    blurb: "Solid club strength. Tactical slips get punished.",
    skill: 9,
    movetime: 600,
    elo: "~1500",
  },
  {
    id: "sharp",
    label: "Sharp",
    blurb: "Strong and alert. You'll need real ideas.",
    skill: 15,
    movetime: 900,
    elo: "~1900",
  },
  {
    id: "master",
    label: "Master",
    blurb: "Full strength. Good luck.",
    skill: 20,
    movetime: 1200,
    elo: "2400+",
  },
];

export const DEFAULT_DIFFICULTY: DifficultyId = "casual";

export function getDifficulty(id: DifficultyId): Difficulty {
  return DIFFICULTIES.find((d) => d.id === id) ?? DIFFICULTIES[1];
}
