import type { Board, SokobanState } from "@/engine/sokoban/types";
import type { Heuristic, SearchNode, SearchProgress, SolverResult } from "@/engine/search/types";
import { MinHeap } from "@/engine/search/priorityQueue";
import { SearchRecorder } from "@/engine/search/recorder";
import {
  expand,
  lowestFReason,
  makeNode,
  makeProgressClock,
  peekAlternatives,
  reconstruct,
  solved,
} from "@/engine/search/common";

function compareAStar(a: SearchNode, b: SearchNode): number {
  if (a.f !== b.f) return a.f - b.f;
  if (a.h !== b.h) return a.h - b.h;
  return a.discoveryIndex - b.discoveryIndex;
}

export function astar(
  board: Board,
  start: SokobanState,
  heuristic: Heuristic,
  maxNodes: number,
  onProgress?: (progress: SearchProgress) => void,
  maxEvents = 12_000,
): SolverResult {
  const recorder = new SearchRecorder("astar", heuristic.name, maxEvents);
  const t0 = performance.now();
  const root = makeNode(recorder, { state: start, board, heuristic, g: 0 });
  recorder.discovered(root);
  root.status = "frontier";

  const open = new MinHeap<SearchNode>(compareAStar);
  open.push(root);
  const bestG = new Map<string, number>([[root.id, 0]]);
  recorder.noteFrontier(open.size);
  const tick = makeProgressClock(onProgress);
  tick(recorder, root, t0, true);
  let visits = 0;

  while (open.size > 0) {
    if (++visits > maxNodes * 40) break;
    const node = open.pop()!;
    const known = bestG.get(node.id);
    if (known !== undefined && node.g > known) continue;

    recorder.evaluated(
      node,
      lowestFReason("astar"),
      recorder.accepting ? peekAlternatives(open.peekSlice(6)) : [],
    );
    tick(recorder, node, t0);
    if (solved(node, board)) {
      recorder.markSolution(reconstruct(recorder, node.id));
      recorder.complete(performance.now() - t0);
      return recorder.snapshot();
    }
    if (recorder.stats.statesExpanded >= maxNodes) break;
    recorder.expanded(node);

    for (const child of expand(recorder, board, heuristic, node)) {
      const prev = bestG.get(child.id);
      if (prev !== undefined && child.g >= prev) {
        recorder.discovered(child, false);
        recorder.pruned(child, "A cheaper path to this same state already exists.", false);
        continue;
      }
      bestG.set(child.id, child.g);
      child.status = "frontier";
      recorder.discovered(child);
      open.push(child);
    }
    recorder.noteFrontier(open.size);
  }

  recorder.complete(performance.now() - t0);
  return recorder.snapshot("No solution found before the search limit.");
}
