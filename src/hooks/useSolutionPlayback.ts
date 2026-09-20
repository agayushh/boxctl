import { useEffect, useMemo, useRef, useState } from "react";
import type { SokobanState } from "@/engine/sokoban/types";
import type { SearchProgress, SolutionStep, SolverResult } from "@/engine/search/types";

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

/** Milliseconds between pushes. Floored so 8x still stays readable. */
export function storyBeat(speed: number, pace: PlaybackPace = "story"): number {
  const capped = Math.max(0.25, speed);
  if (pace === "fast") return Math.max(280, 720 / capped);
  return Math.max(550, 1300 / capped);
}

export function useSolutionPlayback(
  start: SokobanState,
  steps: SolutionStep[] | undefined,
  enabled: boolean,
  pace: PlaybackPace = "story",
) {
  const route = steps ?? EMPTY_STEPS;
  const routeKey =
    route.length === 0
      ? "empty"
      : `${route.length}:${route[0]!.action}:${route[0]!.pushedFrom}:${route[route.length - 1]!.pushedTo}`;
  const frames = useMemo(() => replaySteps(start, route), [start, routeKey]);
  const last = frames.length - 1;
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  useEffect(() => {
    setIndex(0);
    setPlaying(enabled && route.length > 0);
  }, [enabled, routeKey, route.length]);

  useEffect(() => {
    if (!playing || last <= 0) return;
    const beat = storyBeat(speed, pace);
    if (index >= last) {
      setPlaying(false);
      return;
    }
    const id = window.setTimeout(() => {
      setIndex((value) => Math.min(last, value + 1));
    }, beat);
    return () => window.clearTimeout(id);
  }, [playing, index, speed, last, pace]);

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

export function useWatchPlayback(
  start: SokobanState,
  solutionSteps: SolutionStep[] | undefined,
  live: SearchProgress | null,
  searching: boolean,
  enabled: boolean,
  resetKey: string,
) {
  const solution = useSolutionPlayback(start, solutionSteps, enabled && !searching);
  const [follow, setFollow] = useState(true);
  const [shown, setShown] = useState<SearchProgress | null>(null);
  const [speed, setSpeed] = useState(1);
  const latest = useRef(live);
  const lastPaint = useRef(0);
  latest.current = live;

  useEffect(() => {
    setFollow(true);
    setShown(null);
    lastPaint.current = 0;
  }, [resetKey]);

  useEffect(() => {
    if (!searching || !follow) return;
    const paint = () => {
      const snapshot = latest.current;
      if (!snapshot) return;
      lastPaint.current = performance.now();
      setShown(snapshot);
    };
    if (!shown) {
      paint();
      return;
    }
    const wait = Math.max(0, storyBeat(speed) - (performance.now() - lastPaint.current));
    const id = window.setTimeout(paint, wait);
    return () => window.clearTimeout(id);
  }, [searching, follow, live, speed, shown]);

  if (!searching) {
    return {
      index: solution.index,
      frames: solution.frames,
      steps: solution.steps,
      state: solution.state,
      playing: solution.playing,
      speed: solution.speed,
      setSpeed: solution.setSpeed,
      setCursor: solution.setCursor,
      highlight: solution.highlight,
      trail: solution.trail,
      total: solution.total,
      action: solution.action,
      eventCount: solution.frames.length,
      restart: solution.restart,
      next: solution.next,
      prev: solution.prev,
      toggle: solution.toggle,
    };
  }

  const current = shown?.state ?? start;
  const lastStep = shown?.steps?.[Math.max(0, (shown.steps.length ?? 1) - 1)];
  return {
    index: 0,
    frames: [current],
    steps: EMPTY_STEPS,
    state: current,
    playing: follow,
    speed,
    setSpeed,
    setCursor: () => setFollow(false),
    highlight: lastStep ? [lastStep.pushedFrom, lastStep.pushedTo] : [],
    trail: lastStep ? [{ from: lastStep.pushedFrom, to: lastStep.pushedTo }] : [],
    total: 0,
    action: lastStep?.action ?? shown?.action,
    eventCount: 1,
    restart: () => setFollow(true),
    next: () => setFollow(false),
    prev: () => setFollow(false),
    toggle: () => setFollow((value) => !value),
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
    const beat = storyBeat(speed, "fast");
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
