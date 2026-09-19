import type { Board, SokobanState } from "@/engine/sokoban/types";
import type { Heuristic, SearchProgress, SolverResult } from "@/engine/search/types";
import { SearchRecorder } from "@/engine/search/recorder";
import {
  expand,
  lowestFReason,
  makeNode,
  peekAlternatives,
  reconstruct,
  solved,
} from "@/engine/search/common";

export function bfs(
  board: Board,
  start: SokobanState,
  heuristic: Heuristic,
  maxNodes: number,
  onProgress?: (progress: SearchProgress) => void,
  maxEvents = 12_000,
): SolverResult {
  const recorder = new SearchRecorder("bfs", heuristic.name, maxEvents);
  const t0 = performance.now();
  const root = makeNode(recorder, { state: start, board, heuristic, g: 0 });
  recorder.discovered(root);
  root.status = "frontier";

  const queue: string[] = [root.id];
  let head = 0;
  const seen = new Set<string>([root.id]);
  recorder.noteFrontier(1);

  while (head < queue.length) {
    const id = queue[head]!;
    head += 1;
    const node = recorder.get(id);
    if (!node) continue;
    const waiting: typeof node[] = [];
    for (let i = head; i < Math.min(queue.length, head + 4); i += 1) {
      const queuedNode = recorder.get(queue[i]!);
      if (queuedNode) waiting.push(queuedNode);
    }
    recorder.evaluated(node, lowestFReason("bfs"), peekAlternatives(waiting));
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
        recorder.pruned(child, "This arrangement of boxes and player was already visited.", false);
        continue;
      }
      seen.add(child.id);
      child.status = "frontier";
      recorder.discovered(child);
      queue.push(child.id);
    }
    recorder.noteFrontier(queue.length - head);
  }

  recorder.complete(performance.now() - t0);
  return recorder.snapshot("No solution found before the search limit.");
}
