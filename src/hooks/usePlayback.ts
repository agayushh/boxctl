import { useEffect, useMemo, useState } from "react";
import type { SearchEvent, SolverResult } from "@/engine/search/types";
import { applyEvents, emptyFrame } from "@/visualization/search/SearchState";
import type { SearchStats } from "@/engine/search/types";

const EMPTY_STATS: SearchStats = {
  algorithm: "astar",
  heuristic: "",
  statesGenerated: 0,
  statesExpanded: 0,
  statesPruned: 0,
  deadlocksDetected: 0,
  peakFrontier: 0,
  solutionPushes: null,
  playerMoves: null,
  elapsedMs: 0,
};

export const SPEEDS = [0.25, 0.5, 1, 2, 4, 8] as const;
export const WATCH_SPEEDS = [0.5, 1, 2] as const;

const KEYFRAME: Set<SearchEvent["type"]> = new Set([
  "STATE_EVALUATED",
  "DEADLOCK",
  "SOLUTION",
  "SEARCH_COMPLETE",
  "BOUND",
]);

function keyframeIndices(events: SearchEvent[], max = 90): number[] {
  const hits = events
    .map((event, index) => (KEYFRAME.has(event.type) ? index : -1))
    .filter((index) => index >= 0);
  const source = hits.length > 0 ? hits : events.map((_, index) => index);
  if (source.length <= max) return source;
  const picked: number[] = [];
  const step = (source.length - 1) / (max - 1);
  for (let i = 0; i < max; i += 1) picked.push(source[Math.round(i * step)]!);
  const last = source[source.length - 1]!;
  if (picked[picked.length - 1] !== last) picked.push(last);
  return [...new Set(picked)];
}

export function usePlayback(result: SolverResult | null, autoplay = true) {
  const frames = useMemo(
    () => (result ? keyframeIndices(result.events) : []),
    [result],
  );
  const [cursor, setCursor] = useState(0);
  const [playing, setPlaying] = useState(autoplay);
  const [speed, setSpeed] = useState(1);
  const eventCount = frames.length;

  useEffect(() => {
    setCursor(0);
    setPlaying(autoplay && frames.length > 0);
  }, [result, autoplay, frames.length]);

  useEffect(() => {
    if (!playing || !result || eventCount === 0) return;
    if (cursor >= eventCount - 1) {
      setPlaying(false);
      return;
    }
    const delay = Math.max(70, 200 / speed);
    const id = window.setTimeout(() => {
      setCursor((value) => Math.min(eventCount - 1, value + 1));
    }, delay);
    return () => window.clearTimeout(id);
  }, [playing, cursor, speed, result, eventCount]);

  const frame = useMemo(() => {
    if (!result) return emptyFrame(EMPTY_STATS);
    const eventIndex = frames[cursor] ?? 0;
    return applyEvents(result.events, result.nodes, result.stats, result.solution, eventIndex);
  }, [result, cursor, frames]);

  const seek = (value: number) => {
    setPlaying(false);
    setCursor(Math.max(0, Math.min(Math.max(0, eventCount - 1), value)));
  };

  const restart = () => {
    setCursor(0);
    setPlaying(true);
  };

  const next = () => {
    setPlaying(false);
    setCursor((value) => Math.min(Math.max(eventCount - 1, 0), value + 1));
  };

  const prev = () => {
    setPlaying(false);
    setCursor((value) => Math.max(0, value - 1));
  };

  const toggle = () => {
    if (cursor >= eventCount - 1) {
      restart();
      return;
    }
    setPlaying((value) => !value);
  };

  return {
    cursor,
    setCursor: seek,
    playing,
    setPlaying,
    speed,
    setSpeed,
    frame,
    eventCount,
    restart,
    next,
    prev,
    toggle,
  };
}
