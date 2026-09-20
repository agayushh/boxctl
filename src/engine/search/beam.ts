import type { Board, SokobanState } from "@/engine/sokoban/types";
import type { Heuristic, SearchNode, SearchProgress, SolverResult } from "@/engine/search/types";
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

export function beam(
  board: Board,
  start: SokobanState,
  heuristic: Heuristic,
  maxNodes: number,
  beamWidth: number,
  onProgress?: (progress: SearchProgress) => void,
): SolverResult {
  const recorder = new SearchRecorder("beam", heuristic.name);
  const t0 = performance.now();
  const root = makeNode(recorder, { state: start, board, heuristic, g: 0 });
  recorder.discovered(root);
  root.status = "frontier";

  let beamNodes: SearchNode[] = [root];
  const seen = new Set<string>([root.id]);
  recorder.noteFrontier(beamNodes.length);
  const tick = makeProgressClock(onProgress);
  tick(recorder, root, t0, true);

  while (beamNodes.length > 0) {
    const next: SearchNode[] = [];
    for (const node of beamNodes) {
      recorder.evaluated(node, lowestFReason("beam"), peekAlternatives(beamNodes.filter((n) => n.id !== node.id)));
      tick(recorder, node, t0);
      if (solved(node, board)) {
        recorder.markSolution(reconstruct(recorder, node.id));
        recorder.complete(performance.now() - t0);
        return recorder.snapshot();
      }
      if (recorder.stats.statesExpanded >= maxNodes) {
        recorder.complete(performance.now() - t0);
        return recorder.snapshot("No solution found before the search limit.");
      }
      recorder.expanded(node);
      for (const child of expand(recorder, board, heuristic, node)) {
        if (seen.has(child.id)) {
          recorder.discovered(child, false);
          recorder.pruned(child, "Beam search already generated this state.", false);
          continue;
        }
        seen.add(child.id);
        child.status = "frontier";
        recorder.discovered(child);
        next.push(child);
      }
    }
    next.sort((a, b) => a.f - b.f || a.h - b.h);
    const kept = next.slice(0, beamWidth);
    for (const dropped of next.slice(beamWidth)) {
      recorder.pruned(dropped, `Outside the beam (kept the best ${beamWidth} states).`);
    }
    beamNodes = kept;
    recorder.noteFrontier(beamNodes.length);
  }

  recorder.complete(performance.now() - t0);
  return recorder.snapshot("The beam emptied before a solution was found.");
}
