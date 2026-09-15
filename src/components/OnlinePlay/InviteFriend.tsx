"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createOnlineRoom } from "@/lib/realtime/client";
import type { TableSpec } from "@/lib/table/spec";

export function InviteFriend({ table, disabled = false }: { table: TableSpec | null; disabled?: boolean }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const busy = useRef(false);
  const create = async () => {
    if (busy.current) return;
    busy.current = true;
    setCreating(true);
    setError(null);
    try {
      const roomId = await createOnlineRoom(table);
      router.push(`/play/${roomId}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Couldn't create an invite. Please try again.");
      setCreating(false);
      busy.current = false;
    }
  };
  return (
    <section className="card online-invite" aria-label="Play a friend online">
      <div className="card-head"><h2>Play a friend</h2><span className="tag">Online</span></div>
      <div className="online-body">
        <p>Two devices. One board. Send a private link and play together.</p>
        <button className="btn btn-primary" disabled={disabled || creating} onClick={() => void create()}>
          {creating ? "Creating your invite…" : "Create invite link"}
        </button>
        <p className="online-note">You’ll play White. Your friend plays Black. Your current board design comes along.</p>
        {error ? <p role="alert" className="dealer-error">{error}</p> : null}
      </div>
    </section>
  );
}
