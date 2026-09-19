import {
  ACTIONS,
  manhattanPacked,
  oppositeAction,
  stepPacked,
} from "@/utils/coordinates";
import type { Board, SokobanState } from "@/engine/sokoban/types";
import type { Heuristic, HeuristicBreakdown } from "@/engine/search/types";

const INF = 10_000;

type GoalTable = {
  goals: number[];
  dist: Map<number, number[]>;
};

const TABLES = new WeakMap<Board, GoalTable>();

function isOpen(board: Board, cell: number): boolean {
  return board.floors.has(cell) && !board.walls.has(cell);
}

/**
 * Minimum pushes to move a box from each floor cell onto each goal,
 * ignoring other boxes. Reverse-BFS from goals so a push is only counted
 * when the player square behind the box is open.
 */
function buildGoalTable(board: Board): GoalTable {
  const goals = [...board.goals];
  const dist = new Map<number, number[]>();

  for (let g = 0; g < goals.length; g += 1) {
    const goal = goals[g]!;
    const seen = new Map<number, number>([[goal, 0]]);
    const queue = [goal];
    for (let i = 0; i < queue.length; i += 1) {
      const to = queue[i]!;
      const cost = seen.get(to)!;
      for (const dir of ACTIONS) {
        const from = stepPacked(to, oppositeAction(dir));
        const stand = stepPacked(from, oppositeAction(dir));
        if (seen.has(from) || !isOpen(board, from) || !isOpen(board, stand)) continue;
        seen.set(from, cost + 1);
        queue.push(from);
      }
    }
    for (const [cell, value] of seen) {
      let row = dist.get(cell);
      if (!row) {
        row = new Array<number>(goals.length).fill(INF);
        dist.set(cell, row);
      }
      row[g] = value;
    }
  }

  return { goals, dist };
}

function goalTable(board: Board): GoalTable {
  const hit = TABLES.get(board);
  if (hit) return hit;
  const built = buildGoalTable(board);
  TABLES.set(board, built);
  return built;
}

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

function pairCost(box: number, goalIndex: number, table: GoalTable): number {
  return table.dist.get(box)?.[goalIndex] ?? INF;
}

export function matchingDistance(
  state: SokobanState,
  board: Board,
): HeuristicBreakdown {
  const table = goalTable(board);
  const boxes = [...state.boxes];
  const goals = table.goals;
  const n = Math.max(boxes.length, goals.length);
  if (n === 0) return { value: 0, pairs: [] };

  if (n > 8) {
    const pairs: HeuristicBreakdown["pairs"] = [];
    let value = 0;
    for (const box of boxes) {
      const row = table.dist.get(box);
      let best = INF;
      let bestGoal = goals[0] ?? box;
      if (row) {
        for (let g = 0; g < goals.length; g += 1) {
          const dist = row[g]!;
          if (dist < best) {
            best = dist;
            bestGoal = goals[g]!;
          }
        }
      }
      value += best;
      pairs.push({ box, goal: bestGoal, dist: best >= INF ? manhattanPacked(box, bestGoal) : best });
    }
    return { value, pairs };
  }

  const cost: number[][] = [];
  for (let i = 0; i < n; i += 1) {
    const row: number[] = [];
    for (let j = 0; j < n; j += 1) {
      if (i >= boxes.length || j >= goals.length) row.push(INF);
      else row.push(pairCost(boxes[i]!, j, table));
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
      dist: pairCost(boxes[i]!, goalIndex, table),
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
