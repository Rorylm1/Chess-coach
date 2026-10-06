import { OpeningLessons } from "@/components/OpeningLessons/OpeningLessons";
import type { Opening } from "@/lib/openings/tree";
import type { OpeningCourse } from "@/lib/openings/lessons";

export function OpeningJourney({
  opening,
  course,
}: {
  opening: Opening;
  course: OpeningCourse;
}) {
  return <OpeningLessons opening={opening} course={course} />;
}
