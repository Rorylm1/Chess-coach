import type { OpeningLesson } from "./lessons";
export interface LineProgress {
  studied: boolean;
  assisted: number;
  clean: number;
  attempts: number;
}
export type CourseProgress = Record<string, LineProgress>;
export const EMPTY_PROGRESS = {
  studied: false,
  assisted: 0,
  clean: 0,
  attempts: 0,
};
export const progressId = (line: OpeningLesson) => `${line.id}@${line.version}`;
export function parseProgress(raw: string): CourseProgress {
  try {
    const value = JSON.parse(raw);
    const output: CourseProgress = {};
    if (!value || typeof value !== "object" || Array.isArray(value))
      return output;
    for (const [key, entry] of Object.entries(value)) {
      if (!entry || typeof entry !== "object") continue;
      const p = entry as LineProgress;
      if (
        typeof p.studied !== "boolean" ||
        ![p.assisted, p.clean, p.attempts].every(
          (n) => Number.isSafeInteger(n) && n >= 0,
        )
      )
        continue;
      output[key] = p;
    }
    return output;
  } catch {
    return {};
  }
}
/** Lowest coverage first; only studied lessons are eligible. */
export function pickMixedLine(
  lines: OpeningLesson[],
  progress: CourseProgress,
  current: string,
  random = Math.random,
) {
  const eligible = lines.filter((line) => progress[progressId(line)]?.studied);
  if (eligible.length < 2) return null;
  const candidates = eligible.filter((line) => line.id !== current);
  const minimum = Math.min(
    ...candidates.map((line) => progress[progressId(line)].attempts),
  );
  const pool = candidates.filter(
    (line) => progress[progressId(line)].attempts === minimum,
  );
  return pool[Math.min(pool.length - 1, Math.floor(random() * pool.length))];
}
