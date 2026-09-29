import type { Metadata } from "next";
import { PlayClient } from "@/components/Play/PlayClient";

export const metadata: Metadata = {
  title: "Play & randomize — Chess Playground",
  description: "Randomize your chessboard, create a multiplayer invite link, or play an adjustable bot. New pieces, colours and atmosphere for every game.",
};

export default function PlayPage() {
  return <PlayClient />;
}
