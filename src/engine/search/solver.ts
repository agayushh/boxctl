import type { SolverRequest, SolverResult } from "@/engine/search/types";
import { getHeuristic } from "@/engine/search/heuristics";
import { astar } from "@/engine/search/astar";
import { bfs } from "@/engine/search/bfs";
import { greedy } from "@/engine/search/greedy";
import { idastar } from "@/engine/search/idastar";
import { beam } from "@/engine/search/beam";

export const DEFAULT_MAX_NODES = 150_000;
export const DEFAULT_BEAM_WIDTH = 24;

export function solve(request: SolverRequest): SolverResult {
  const heuristic = getHeuristic(request.heuristicId);
  const maxNodes = request.maxNodes ?? DEFAULT_MAX_NODES;
  const beamWidth = request.beamWidth ?? DEFAULT_BEAM_WIDTH;

  switch (request.algorithm) {
    case "bfs":
      return bfs(request.board, request.state, heuristic, maxNodes, request.onProgress);
    case "greedy":
      return greedy(request.board, request.state, heuristic, maxNodes, request.onProgress);
    case "idastar":
      return idastar(request.board, request.state, heuristic, maxNodes, request.onProgress);
    case "beam":
      return beam(request.board, request.state, heuristic, maxNodes, beamWidth, request.onProgress);
    case "astar":
    default:
      return astar(request.board, request.state, heuristic, maxNodes, request.onProgress);
  }
}

export const ALGORITHMS = [
  { id: "astar" as const, name: "A*", summary: "Expands the state with the lowest f(n) = g(n) + h(n)." },
  { id: "bfs" as const, name: "BFS", summary: "Expands states in discovery order. Complete, but ignores the heuristic." },
  { id: "greedy" as const, name: "Greedy Best-First", summary: "Always follows the lowest heuristic. Fast, not always optimal." },
  { id: "idastar" as const, name: "IDA*", summary: "Depth-first A* with a rising f-bound. Uses very little memory." },
  { id: "beam" as const, name: "Beam Search", summary: "Keeps only the best-ranked states at each layer." },
];
