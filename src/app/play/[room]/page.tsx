import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OnlinePlayClient } from "@/components/OnlinePlay/OnlinePlayClient";
import { ROOM_ID } from "@/lib/realtime/protocol";

export const metadata: Metadata = {
  title: "Play a friend — Chess Coach",
  description: "You've been invited to a game. Two devices, one shared chessboard.",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function OnlinePage({ params }: { params: Promise<{ room: string }> }) {
  const { room } = await params;
  if (!ROOM_ID.test(room)) notFound();
  return <OnlinePlayClient key={room} roomId={room} />;
}
