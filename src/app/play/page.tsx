import type { Metadata } from "next";
import { PlayClient } from "@/components/Play/PlayClient";

export const metadata: Metadata = {
  title: "Play — Chess Coach",
  description: "Play a full game against an adjustable Stockfish bot, on board the analysis deck.",
};

export default function PlayPage() {
  return <PlayClient />;
}
