import type {
  OpeningCourse,
  OpeningHistory,
  OpeningGame,
  OpeningLesson,
} from "@/lib/openings/lessons";
import histories from "./histories.json";
import games from "./games.json";
import lesson0 from "./italian-game.json";
import lesson1 from "./sicilian-defense.json";
import lesson2 from "./scandinavian-defense.json";
import lesson3 from "./kings-indian-defense.json";
import lesson4 from "./french-defense.json";
import lesson5 from "./vienna-game.json";
import lesson6 from "./ruy-lopez.json";
import lesson7 from "./queens-gambit.json";
import lesson8 from "./scotch-game.json";
import lesson9 from "./petrov-defense.json";
import lesson10 from "./slav-defense.json";
import lesson11 from "./english-opening.json";
import lesson12 from "./caro-kann-defense.json";
import lesson13 from "./london-system.json";
import lesson14 from "./nimzo-indian-defense.json";

const lessons: Record<string, OpeningLesson[]> = {
  "italian-game": lesson0,
  "sicilian-defense": lesson1,
  "scandinavian-defense": lesson2,
  "kings-indian-defense": lesson3,
  "french-defense": lesson4,
  "vienna-game": lesson5,
  "ruy-lopez": lesson6,
  "queens-gambit": lesson7,
  "scotch-game": lesson8,
  "petrov-defense": lesson9,
  "slav-defense": lesson10,
  "english-opening": lesson11,
  "caro-kann-defense": lesson12,
  "london-system": lesson13,
  "nimzo-indian-defense": lesson14,
};
const historyBySlug: Record<string, OpeningHistory> = histories;
const gameBySlug: Record<string, OpeningGame> = games;
export function getCourse(slug: string): OpeningCourse | undefined {
  if (!lessons[slug] || !historyBySlug[slug] || !gameBySlug[slug])
    return undefined;
  return {
    lessons: lessons[slug],
    history: historyBySlug[slug],
    game: gameBySlug[slug],
    source: historyBySlug[slug].source,
  };
}
