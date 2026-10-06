"use client";
import { useMemo, useSyncExternalStore } from "react";
import {
  EMPTY_PROGRESS,
  parseProgress,
  progressId,
  type LineProgress,
} from "@/lib/openings/lesson-progress";
import type { OpeningLesson } from "@/lib/openings/lessons";
const EVENT = "chess-lesson-progress";
const memory = new Map<string, string>();
function read(key: string) {
  try {
    return memory.get(key) ?? localStorage.getItem(key) ?? "{}";
  } catch {
    return memory.get(key) ?? "{}";
  }
}
function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(EVENT, callback);
  };
}
function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
    memory.delete(key);
  } catch {
    memory.set(key, value);
  }
  window.dispatchEvent(new Event(EVENT));
}
export function useProgress(slug: string) {
  const key = `chess-playground:lessons:v1:${slug}`;
  const raw = useSyncExternalStore(
    subscribe,
    () => read(key),
    () => "{}",
  );
  const progress = useMemo(() => parseProgress(raw), [raw]);
  function update(
    line: OpeningLesson,
    change: (previous: LineProgress) => LineProgress,
  ) {
    const latest = parseProgress(read(key));
    const id = progressId(line);
    write(
      key,
      JSON.stringify({ ...latest, [id]: change(latest[id] ?? EMPTY_PROGRESS) }),
    );
  }
  return {
    progress,
    study: (line: OpeningLesson) =>
      update(line, (p) => ({ ...p, studied: true })),
    start: (line: OpeningLesson) =>
      update(line, (p) => ({ ...p, attempts: p.attempts + 1 })),
    complete: (line: OpeningLesson, assisted: boolean) =>
      update(line, (p) => ({
        ...p,
        [assisted ? "assisted" : "clean"]:
          p[assisted ? "assisted" : "clean"] + 1,
      })),
    reset: () => write(key, "{}"),
  };
}
