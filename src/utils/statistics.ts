import type { SearchStats } from "@/engine/search/types";

export function formatInt(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatMs(value: number): string {
  if (value < 1) return "<1 ms";
  if (value < 1000) return `${Math.round(value)} ms`;
  return `${(value / 1000).toFixed(2)} s`;
}

export function compareStats(a: SearchStats, b: SearchStats) {
  return {
    generated: [a.statesGenerated, b.statesGenerated],
    expanded: [a.statesExpanded, b.statesExpanded],
    pruned: [a.statesPruned, b.statesPruned],
    deadlocks: [a.deadlocksDetected, b.deadlocksDetected],
    pushes: [a.solutionPushes, b.solutionPushes],
    time: [a.elapsedMs, b.elapsedMs],
  } as const;
}
