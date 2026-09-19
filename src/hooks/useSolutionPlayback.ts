import { useEffect, useMemo, useState } from "react";
import type { SokobanState } from "@/engine/sokoban/types";
import type { SolverResult } from "@/engine/search/types";

export function replaySolution(
  start: SokobanState,
  result: SolverResult | null,
): SokobanState[] {
  if (!result?.solution) return [start];
  const frames: SokobanState[] = [start];
  let current = start;
  for (const step of result.solution.steps) {
    const boxes = new Set(current.boxes);
    boxes.delete(step.pushedFrom);
    boxes.add(step.pushedTo);
    current = { player: step.pushedFrom, boxes };
    frames.push(current);
  }
  return frames;
}

export function useSolutionPlayback(
  start: SokobanState,
  result: SolverResult | null,
  enabled: boolean,
) {
  const frames = useMemo(() => replaySolution(start, result), [start, result]);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  useEffect(() => {
    setIndex(0);
    setPlaying(enabled && Boolean(result?.solution));
  }, [result, enabled]);

  useEffect(() => {
    if (!playing || frames.length <= 1) return;
    if (index >= frames.length - 1) {
      setPlaying(false);
      return;
    }
    const id = window.setTimeout(() => {
      setIndex((value) => Math.min(frames.length - 1, value + 1));
    }, Math.max(90, 480 / speed));
    return () => window.clearTimeout(id);
  }, [playing, index, speed, frames.length]);

  const step = result?.solution?.steps[Math.max(0, index - 1)];
  const highlight = step ? [step.pushedFrom, step.pushedTo] : [];

  return {
    index,
    frames,
    state: frames[index] ?? start,
    playing,
    speed,
    setSpeed,
    highlight,
    total: Math.max(0, frames.length - 1),
    action: step?.action,
    restart: () => {
      setIndex(0);
      setPlaying(Boolean(result?.solution));
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
