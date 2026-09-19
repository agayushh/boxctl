import type { Board, SokobanState } from "@/engine/sokoban/types";
import type { Heuristic, SearchProgress, SolverResult } from "@/engine/search/types";
import { SearchRecorder } from "@/engine/search/recorder";
import {
  expand,
  lowestFReason,
  makeNode,
  reconstruct,
  solved,
} from "@/engine/search/common";

const FOUND = -1;

export function idastar(
  board: Board,
  start: SokobanState,
  heuristic: Heuristic,
  maxNodes: number,
  onProgress?: (progress: SearchProgress) => void,
): SolverResult {
  const recorder = new SearchRecorder("idastar", heuristic.name);
  const t0 = performance.now();
  const root = makeNode(recorder, { state: start, board, heuristic, g: 0 });
  recorder.discovered(root);

  let bound = Math.max(root.f, 0);
  let iteration = 1;
  let goalId: string | null = null;
  recorder.bound(bound, iteration);

  const search = (nodeId: string, path: Set<string>): number => {
    const node = recorder.get(nodeId);
    if (!node) return Number.POSITIVE_INFINITY;
    if (recorder.stats.statesExpanded >= maxNodes) return Number.POSITIVE_INFINITY;

    recorder.evaluated(node, lowestFReason("idastar"), []);
    if (node.f > bound) return node.f;
    if (solved(node, board)) {
      goalId = node.id;
      return FOUND;
    }
    recorder.expanded(node);
    if (onProgress && recorder.stats.statesExpanded % 250 === 0) {
      onProgress({
        statesGenerated: recorder.stats.statesGenerated,
        statesExpanded: recorder.stats.statesExpanded,
        deadlocksDetected: recorder.stats.deadlocksDetected,
        peakFrontier: recorder.stats.peakFrontier,
      });
    }

    let nextBound = Number.POSITIVE_INFINITY;
    const children = expand(recorder, board, heuristic, node).sort((a, b) => a.f - b.f);
    for (const child of children) {
      if (path.has(child.id)) {
        recorder.discovered(child, false);
        recorder.pruned(child, "This state already appears on the current IDA* path.", false);
        continue;
      }
      if (!recorder.get(child.id)) recorder.discovered(child);
      else recorder.discovered(child);
      path.add(child.id);
      const t = search(child.id, path);
      path.delete(child.id);
      if (t === FOUND) return FOUND;
      if (t < nextBound) nextBound = t;
    }
    return nextBound;
  };

  for (;;) {
    const path = new Set<string>([root.id]);
    const t = search(root.id, path);
    if (t === FOUND && goalId) {
      recorder.markSolution(reconstruct(recorder, goalId));
      recorder.complete(performance.now() - t0);
      return recorder.snapshot();
    }
    if (!Number.isFinite(t) || recorder.stats.statesExpanded >= maxNodes) {
      recorder.complete(performance.now() - t0);
      return recorder.snapshot("No solution found before the search limit.");
    }
    bound = t;
    iteration += 1;
    recorder.bound(bound, iteration);
    if (iteration > 400) {
      recorder.complete(performance.now() - t0);
      return recorder.snapshot("IDA* exceeded the iteration limit.");
    }
  }
}
