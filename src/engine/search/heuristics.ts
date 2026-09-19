import { manhattanPacked } from "@/utils/coordinates";
import type { Board, SokobanState } from "@/engine/sokoban/types";
import type { Heuristic, HeuristicBreakdown } from "@/engine/search/types";

const INF = 10_000;

function bitCount(mask: number): number {
  let n = mask;
  let count = 0;
  while (n) {
    n &= n - 1;
    count += 1;
  }
  return count;
}

export function minCostAssignment(cost: number[][]): {
  cost: number;
  assignment: number[];
} {
  const n = cost.length;
  if (n === 0) return { cost: 0, assignment: [] };

  const size = 1 << n;
  const dp = new Array<number>(size).fill(INF);
  const parent = new Array<number>(size).fill(-1);
  const chosen = new Array<number>(size).fill(-1);
  dp[0] = 0;

  for (let mask = 0; mask < size; mask += 1) {
    const box = bitCount(mask);
    if (box >= n) continue;
    const current = dp[mask]!;
    if (current >= INF) continue;
    for (let goal = 0; goal < n; goal += 1) {
      if (mask & (1 << goal)) continue;
      const next = mask | (1 << goal);
      const value = current + cost[box]![goal]!;
      if (value < dp[next]!) {
        dp[next] = value;
        parent[next] = mask;
        chosen[next] = goal;
      }
    }
  }

  const assignment = new Array<number>(n).fill(-1);
  let mask = size - 1;
  for (let box = n - 1; box >= 0; box -= 1) {
    assignment[box] = chosen[mask]!;
    mask = parent[mask]!;
  }

  return { cost: dp[size - 1]!, assignment };
}

export function matchingDistance(
  state: SokobanState,
  board: Board,
): HeuristicBreakdown {
  const boxes = [...state.boxes];
  const goals = [...board.goals];
  const n = Math.max(boxes.length, goals.length);
  if (n === 0) return { value: 0, pairs: [] };

  if (n > 8) {
    const pairs: HeuristicBreakdown["pairs"] = [];
    let value = 0;
    for (const box of boxes) {
      let best = INF;
      let bestGoal = goals[0] ?? box;
      for (const goal of goals) {
        const dist = manhattanPacked(box, goal);
        if (dist < best) {
          best = dist;
          bestGoal = goal;
        }
      }
      value += best;
      pairs.push({ box, goal: bestGoal, dist: best });
    }
    return { value, pairs };
  }

  const cost: number[][] = [];
  for (let i = 0; i < n; i += 1) {
    const row: number[] = [];
    for (let j = 0; j < n; j += 1) {
      if (i >= boxes.length || j >= goals.length) row.push(INF);
      else row.push(manhattanPacked(boxes[i]!, goals[j]!));
    }
    cost.push(row);
  }

  const result = minCostAssignment(cost);
  const pairs: HeuristicBreakdown["pairs"] = [];
  for (let i = 0; i < boxes.length; i += 1) {
    const goalIndex = result.assignment[i]!;
    if (goalIndex < 0 || goalIndex >= goals.length) continue;
    pairs.push({
      box: boxes[i]!,
      goal: goals[goalIndex]!,
      dist: manhattanPacked(boxes[i]!, goals[goalIndex]!),
    });
  }
  return { value: result.cost >= INF ? INF : result.cost, pairs };
}

export const manhattanMatching: Heuristic = {
  id: "manhattan-matching",
  name: "Minimum box–goal matching",
  estimate(state, board) {
    return matchingDistance(state, board).value;
  },
  explain(state, board) {
    return matchingDistance(state, board);
  },
};

export const HEURISTICS: Record<string, Heuristic> = {
  "manhattan-matching": manhattanMatching,
};

export function getHeuristic(id?: string): Heuristic {
  return HEURISTICS[id ?? "manhattan-matching"] ?? manhattanMatching;
}
