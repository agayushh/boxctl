import { useEffect, useMemo, useState } from "react";
import type { SolverResult } from "@/engine/search/types";
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

export function usePlayback(result: SolverResult | null, autoplay = true) {
  const [cursor, setCursor] = useState(0);
  const [playing, setPlaying] = useState(autoplay);
  const [speed, setSpeed] = useState(1);
  const eventCount = result?.events.length ?? 0;

  useEffect(() => {
    setCursor(0);
    setPlaying(autoplay && (result?.events.length ?? 0) > 0);
  }, [result, autoplay]);

  useEffect(() => {
    if (!playing || !result || eventCount === 0) return;
    if (cursor >= eventCount - 1) {
      setPlaying(false);
      return;
    }
    const delay = Math.max(16, 140 / speed);
    const id = window.setTimeout(() => {
      setCursor((value) => Math.min(eventCount - 1, value + 1));
    }, delay);
    return () => window.clearTimeout(id);
  }, [playing, cursor, speed, result, eventCount]);

  const frame = useMemo(() => {
    if (!result) return emptyFrame(EMPTY_STATS);
    return applyEvents(result.events, result.nodes, result.stats, result.solution, cursor);
  }, [result, cursor]);

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
    setCursor,
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
