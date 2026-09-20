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

/** Keep one walkable route. Prefer a finished solution; otherwise freeze the first useful live path. */
export function pickWatchSteps(
  solution: SolutionStep[] | undefined,
  frozen: SolutionStep[] | undefined,
  live: SolutionStep[] | undefined,
  liveElapsedMs = 0,
): SolutionStep[] | undefined {
  if (solution && solution.length > 0) return solution;
  if (frozen && frozen.length > 0) return frozen;
  if (!live || live.length === 0) return undefined;
  if (live.length >= 8 || liveElapsedMs >= 1200) return live;
  return undefined;
}

export function useWatchPlayback(
  start: SokobanState,
  solutionSteps: SolutionStep[] | undefined,
  live: SearchProgress | null | undefined,
  enabled: boolean,
  resetKey: string,
) {
  const [frozen, setFrozen] = useState<SolutionStep[] | undefined>();
  const keyRef = useRef(resetKey);
  const liveSteps = live?.steps;
  const liveElapsed = live?.elapsedMs ?? 0;

  useEffect(() => {
    const reset = keyRef.current !== resetKey;
    keyRef.current = resetKey;
    setFrozen((prev) => {
      const next = pickWatchSteps(solutionSteps, reset ? undefined : prev, liveSteps, liveElapsed);
      if (next === prev) return prev;
      if (
        prev &&
        next &&
        prev.length === next.length &&
        prev[0]?.pushedFrom === next[0]?.pushedFrom &&
        prev[prev.length - 1]?.pushedTo === next[next.length - 1]?.pushedTo
      ) {
        return prev;
      }
      return next;
    });
  }, [resetKey, solutionSteps, liveSteps, liveElapsed]);

  return useSolutionPlayback(start, frozen, enabled && (frozen?.length ?? 0) > 0);
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
  }, [enabled, routeKey]);

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
