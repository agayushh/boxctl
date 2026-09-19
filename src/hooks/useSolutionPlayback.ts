import { useEffect, useMemo, useState } from "react";
import type { SokobanState } from "@/engine/sokoban/types";
import type { SolutionStep, SolverResult } from "@/engine/search/types";

export function replaySteps(start: SokobanState, steps: SolutionStep[]): SokobanState[] {
  const frames: SokobanState[] = [start];
  let current = start;
  for (const step of steps) {
    const boxes = new Set(current.boxes);
    boxes.delete(step.pushedFrom);
    boxes.add(step.pushedTo);
    current = { player: step.pushedFrom, boxes };
    frames.push(current);
  }
  return frames;
}

export function replaySolution(
  start: SokobanState,
  result: SolverResult | null,
): SokobanState[] {
  return replaySteps(start, result?.solution?.steps ?? []);
}

export function trailFromSteps(steps: SolutionStep[]) {
  return steps.map((step) => ({ from: step.pushedFrom, to: step.pushedTo }));
}

const EMPTY_STEPS: SolutionStep[] = [];

type PlaybackPace = "story" | "fast";

export function useSolutionPlayback(
  start: SokobanState,
  steps: SolutionStep[] | undefined,
  enabled: boolean,
  pace: PlaybackPace = "story",
  loop = false,
) {
  const route = steps ?? EMPTY_STEPS;
  const frames = useMemo(() => replaySteps(start, route), [start, route]);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  useEffect(() => {
    setIndex(0);
    setPlaying(enabled && route.length > 0);
  }, [enabled, route]);

  useEffect(() => {
    if (!playing || frames.length <= 1) return;
    const beat = pace === "story" ? Math.max(280, 1100 / speed) : Math.max(90, 420 / speed);
    if (index >= frames.length - 1) {
      if (loop) {
        const id = window.setTimeout(() => setIndex(0), beat);
        return () => window.clearTimeout(id);
      }
      setPlaying(false);
      return;
    }
    const id = window.setTimeout(() => {
      setIndex((value) => Math.min(frames.length - 1, value + 1));
    }, beat);
    return () => window.clearTimeout(id);
  }, [playing, index, speed, frames.length, pace, loop]);

  const step = route[Math.max(0, index - 1)];
  const highlight = step ? [step.pushedFrom, step.pushedTo] : [];

  return {
    index,
    frames,
    steps: route,
    state: frames[index] ?? start,
    playing,
    speed,
    setSpeed,
    setCursor: setIndex,
    highlight,
    trail: trailFromSteps(route),
    total: Math.max(0, frames.length - 1),
    action: step?.action,
    restart: () => {
      setIndex(0);
      setPlaying(route.length > 0);
    },
    next: () => {
      setPlaying(false);
      setIndex((value) => Math.min(frames.length - 1, value + 1));
    },
    prev: () => {
      setPlaying(false);
      setIndex((value) => Math.max(0, value - 1));
    },
    toggle: () => {
      if (index >= frames.length - 1) {
        setIndex(0);
        setPlaying(true);
        return;
      }
      setPlaying((value) => !value);
    },
  };
}

export function useSharedClock(
  length: number,
  enabled: boolean,
  resetKey: string,
  settled = true,
) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const max = Math.max(0, length - 1);
  const ready = length > 1;

  useEffect(() => {
    setIndex(0);
    setPlaying(enabled && ready);
  }, [resetKey, enabled, ready]);

  useEffect(() => {
    if (!playing || length <= 1) return;
    if (index >= max) {
      if (settled) setPlaying(false);
      return;
    }
    const id = window.setTimeout(() => {
      setIndex((value) => Math.min(max, value + 1));
    }, Math.max(90, 420 / speed));
    return () => window.clearTimeout(id);
  }, [playing, index, speed, length, max, settled]);

  return {
    index,
    playing,
    speed,
    setSpeed,
    setCursor: setIndex,
    restart: () => {
      setIndex(0);
      setPlaying(length > 1);
    },
    next: () => {
      setPlaying(false);
      setIndex((value) => Math.min(max, value + 1));
    },
    prev: () => {
      setPlaying(false);
      setIndex((value) => Math.max(0, value - 1));
    },
    toggle: () => {
      if (index >= max) {
        setIndex(0);
        setPlaying(true);
        return;
      }
      setPlaying((value) => !value);
    },
  };
}
