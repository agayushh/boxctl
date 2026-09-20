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
  const last = frames.length - 1;
  const routeKey =
    route.length === 0
      ? "empty"
      : `${route.length}:${route[0]!.action}:${route[0]!.pushedFrom}:${route[route.length - 1]!.pushedTo}`;
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  useEffect(() => {
    setIndex(0);
    setPlaying(enabled && route.length > 0);
  }, [enabled, routeKey, route.length]);

  useEffect(() => {
    if (!playing || last <= 0) return;
    const beat = pace === "story" ? Math.max(280, 1100 / speed) : Math.max(90, 420 / speed);
    if (index >= last) {
      if (loop) {
        const id = window.setTimeout(() => setIndex(0), beat);
        return () => window.clearTimeout(id);
      }
      setPlaying(false);
      return;
    }
    const id = window.setTimeout(() => {
      setIndex((value) => Math.min(last, value + 1));
    }, beat);
    return () => window.clearTimeout(id);
  }, [playing, index, speed, last, pace, loop]);

  const step = route[Math.max(0, index - 1)];
  const highlight = step ? [step.pushedFrom, step.pushedTo] : [];
  const seek = (value: number) => {
    setPlaying(false);
    setIndex(Math.max(0, Math.min(Math.max(0, last), value)));
  };

  return {
    index,
    frames,
    steps: route,
    state: frames[index] ?? start,
    playing,
    speed,
    setSpeed,
    setCursor: seek,
    highlight,
    trail: trailFromSteps(route),
    total: Math.max(0, last),
    action: step?.action,
    restart: () => {
      setIndex(0);
      setPlaying(route.length > 0);
    },
    next: () => {
      setPlaying(false);
      setIndex((value) => Math.min(Math.max(0, last), value + 1));
    },
    prev: () => {
      setPlaying(false);
      setIndex((value) => Math.max(0, value - 1));
    },
    toggle: () => {
      if (index >= last && last > 0) {
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
  loop = false,
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
    const beat = Math.max(90, 420 / speed);
    if (index >= max) {
      if (loop) {
        const id = window.setTimeout(() => setIndex(0), beat);
        return () => window.clearTimeout(id);
      }
      setPlaying(false);
      return;
    }
    const id = window.setTimeout(() => {
      setIndex((value) => Math.min(max, value + 1));
    }, beat);
    return () => window.clearTimeout(id);
  }, [playing, index, speed, length, max, loop]);

  const seek = (value: number) => {
    setPlaying(false);
    setIndex(Math.max(0, Math.min(max, value)));
  };

  return {
    index,
    playing,
    speed,
    setSpeed,
    setCursor: seek,
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
      if (index >= max && max > 0) {
        setIndex(0);
        setPlaying(true);
        return;
      }
      setPlaying((value) => !value);
    },
  };
}
