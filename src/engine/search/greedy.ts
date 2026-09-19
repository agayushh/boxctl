import type { Board, SokobanState } from "@/engine/sokoban/types";
import type { Heuristic, SearchNode, SolverResult } from "@/engine/search/types";
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
    recorder.evaluated(node, lowestFReason("greedy"), peekAlternatives(open.toArray().slice(0, 6)));
    if (solved(node, board)) {
      recorder.markSolution(reconstruct(recorder, node.id));
      recorder.complete(performance.now() - t0);
      return recorder.snapshot();
    }
    if (recorder.stats.statesExpanded >= maxNodes) break;
    recorder.expanded(node);
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
