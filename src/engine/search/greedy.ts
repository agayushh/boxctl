import type { Board, SokobanState } from "@/engine/sokoban/types";
import type { Heuristic, SearchNode, SearchProgress, SolverResult } from "@/engine/search/types";
import { MinHeap } from "@/engine/search/priorityQueue";
import { SearchRecorder } from "@/engine/search/recorder";
import {
  expand,
  lowestFReason,
  makeNode,
  peekAlternatives,
  reconstruct,
  solved,
} from "@/engine/search/common";

function compareGreedy(a: SearchNode, b: SearchNode): number {
  if (a.h !== b.h) return a.h - b.h;
  return a.discoveryIndex - b.discoveryIndex;
}

export function greedy(
  board: Board,
  start: SokobanState,
  heuristic: Heuristic,
  maxNodes: number,
  onProgress?: (progress: SearchProgress) => void,
): SolverResult {
  const recorder = new SearchRecorder("greedy", heuristic.name);
  const t0 = performance.now();
  const root = makeNode(recorder, { state: start, board, heuristic, g: 0 });
  recorder.discovered(root);
  root.status = "frontier";

  const open = new MinHeap<SearchNode>(compareGreedy);
  open.push(root);
  const seen = new Set<string>([root.id]);
  recorder.noteFrontier(open.size);

  while (open.size > 0) {
    const node = open.pop()!;
    recorder.evaluated(
      node,
      lowestFReason("greedy"),
      recorder.accepting ? peekAlternatives(open.peekSlice(6)) : [],
    );
    if (solved(node, board)) {
      recorder.markSolution(reconstruct(recorder, node.id));
      recorder.complete(performance.now() - t0);
      return recorder.snapshot();
    }
    if (recorder.stats.statesExpanded >= maxNodes) break;
    recorder.expanded(node);
    if (onProgress && recorder.stats.statesExpanded % 250 === 0) {
      onProgress({
        statesGenerated: recorder.stats.statesGenerated,
        statesExpanded: recorder.stats.statesExpanded,
        deadlocksDetected: recorder.stats.deadlocksDetected,
        peakFrontier: recorder.stats.peakFrontier,
      });
    }
    for (const child of expand(recorder, board, heuristic, node)) {
      if (seen.has(child.id)) {
        recorder.discovered(child, false);
        recorder.pruned(child, "Greedy already visited this state.", false);
        continue;
      }
      seen.add(child.id);
      child.status = "frontier";
      recorder.discovered(child);
      open.push(child);
    }
    recorder.noteFrontier(open.size);
  }

  recorder.complete(performance.now() - t0);
  return recorder.snapshot("No solution found before the search limit.");
}
