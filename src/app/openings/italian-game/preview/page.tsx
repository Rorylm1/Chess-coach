import type { Metadata } from "next";
import { OpeningLessons } from "@/components/OpeningLessons/OpeningLessons";
import { getOpening } from "@/content/openings";
import { getCourse } from "@/content/opening-lessons";
export const metadata: Metadata = {
  title: "Italian Game · Lesson preview — Chess Playground",
  robots: { index: false, follow: false },
};
export default function PreviewPage() {
  return (
    <OpeningLessons
      opening={getOpening("italian-game")!}
      course={getCourse("italian-game")!}
      preview
    />
  );
}
