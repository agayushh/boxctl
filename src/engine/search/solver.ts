import type { AlgorithmId, SolverRequest, SolverResult } from "@/engine/search/types";
import { getHeuristic } from "@/engine/search/heuristics";
import { astar } from "@/engine/search/astar";
import { bfs } from "@/engine/search/bfs";
import { greedy } from "@/engine/search/greedy";

export const DEFAULT_MAX_NODES = 400_000;
export const DEFAULT_BEAM_WIDTH = 24;

export function nodesFor(algorithm: AlgorithmId, boxes: number): number {
  if (algorithm === "bfs") {
    return Math.min(250_000, Math.max(80_000, boxes * 12_000));
  }
  return Math.min(1_000_000, Math.max(150_000, 80_000 + boxes * 30_000));
}

export function solve(request: SolverRequest): SolverResult {
  const heuristic = getHeuristic(request.heuristicId);
  const maxNodes = request.maxNodes ?? nodesFor(request.algorithm, request.state.boxes.size);
  const maxEvents = request.mode === "instant" ? 0 : 12_000;

  switch (request.algorithm) {
    case "bfs":
      return bfs(request.board, request.state, heuristic, maxNodes, request.onProgress, maxEvents);
    case "greedy":
      return greedy(request.board, request.state, heuristic, maxNodes, request.onProgress, maxEvents);
    case "idastar":
    case "beam":
    case "astar":
    default:
      return astar(request.board, request.state, heuristic, maxNodes, request.onProgress, maxEvents);
  }
}

export const ALGORITHMS = [
  {
    id: "astar" as const,
    name: "A*",
    summary: "Priority queue. Always expands the smallest f = g + h. Best default.",
  },
  {
    id: "bfs" as const,
    name: "BFS",
    summary: "A queue: oldest state first. No heuristic. Optimal, often slower.",
  },
  {
    id: "greedy" as const,
    name: "Greedy",
    summary: "Always follows the smallest leftover guess h. Fast, not always shortest.",
  },
];
