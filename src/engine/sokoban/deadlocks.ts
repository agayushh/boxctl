import {
  ACTIONS,
  inBoundsPacked,
  stepPacked,
} from "@/utils/coordinates";
import type { Board, DeadlockInfo, SokobanState } from "@/engine/sokoban/types";
import { isSolved } from "@/engine/sokoban/goals";

function isWallAt(board: Board, cell: number): boolean {
  return (
    !inBoundsPacked(cell, board.width, board.height) || board.walls.has(cell)
  );
}

export function computeSimpleDeadSquares(board: Board): Set<number> {
  const reachable = new Set<number>(board.goals);
  const queue = [...board.goals];

  for (let i = 0; i < queue.length; i += 1) {
    const dest = queue[i]!;
    for (const action of ACTIONS) {
      const from = stepPacked(dest, action);
      const player = stepPacked(from, action);
      if (reachable.has(from)) continue;
      if (!board.floors.has(from) || board.walls.has(from)) continue;
      if (isWallAt(board, player)) continue;
      reachable.add(from);
      queue.push(from);
    }
  }

  const dead = new Set<number>();
  for (const cell of board.floors) {
    if (board.goals.has(cell)) continue;
    if (!reachable.has(cell)) dead.add(cell);
  }
  return dead;
}

export function isCorner(board: Board, cell: number): boolean {
  const up = isWallAt(board, stepPacked(cell, "UP"));
  const down = isWallAt(board, stepPacked(cell, "DOWN"));
  const left = isWallAt(board, stepPacked(cell, "LEFT"));
  const right = isWallAt(board, stepPacked(cell, "RIGHT"));
  return (up || down) && (left || right);
}

export function detectCornerDeadlock(
  state: SokobanState,
  board: Board,
): DeadlockInfo {
  const affected: number[] = [];
  for (const box of state.boxes) {
    if (board.goals.has(box)) continue;
    if (isCorner(board, box)) affected.push(box);
  }
  if (affected.length === 0) return { detected: false };
  return {
    detected: true,
    type: "corner",
    affectedBoxes: affected,
    explanation:
      affected.length === 1
        ? "A box is stuck in a corner that is not a goal. Boxes cannot be pulled, so this position can never be solved."
        : "Boxes are stuck in non-goal corners. Those boxes can never be moved again.",
  };
}

function isDeadAlongWall(
  state: SokobanState,
  board: Board,
  box: number,
  axis: "h" | "v",
): boolean {
  const pinned =
    axis === "h"
      ? isWallAt(board, stepPacked(box, "UP")) ||
        isWallAt(board, stepPacked(box, "DOWN"))
      : isWallAt(board, stepPacked(box, "LEFT")) ||
        isWallAt(board, stepPacked(box, "RIGHT"));
  if (!pinned) return false;

  const along: Array<"LEFT" | "RIGHT" | "UP" | "DOWN"> =
    axis === "h" ? ["LEFT", "RIGHT"] : ["UP", "DOWN"];
  let hasGoal = board.goals.has(box);
  let visited = 0;

  for (const dir of along) {
    let cursor = box;
    for (;;) {
      const next = stepPacked(cursor, dir);
      if (isWallAt(board, next)) break;
      const stillPinned =
        axis === "h"
          ? isWallAt(board, stepPacked(next, "UP")) ||
            isWallAt(board, stepPacked(next, "DOWN"))
          : isWallAt(board, stepPacked(next, "LEFT")) ||
            isWallAt(board, stepPacked(next, "RIGHT"));
      if (!stillPinned) return false;
      if (board.goals.has(next) || (state.boxes.has(next) && board.goals.has(next))) {
        hasGoal = true;
      }
      if (board.goals.has(next)) hasGoal = true;
      cursor = next;
      visited += 1;
      if (visited > board.width * board.height) break;
    }
  }

  return !hasGoal;
}

export function detectWallDeadlock(
  state: SokobanState,
  board: Board,
): DeadlockInfo {
  const affected: number[] = [];
  for (const box of state.boxes) {
    if (board.goals.has(box)) continue;
    if (isDeadAlongWall(state, board, box, "h") || isDeadAlongWall(state, board, box, "v")) {
      affected.push(box);
    }
  }
  if (affected.length === 0) return { detected: false };
  return {
    detected: true,
    type: "wall",
    affectedBoxes: affected,
    explanation:
      "A box is trapped against a wall with no goal on that stretch. It can slide, but never reach a goal.",
  };
}

export function detectFreezeDeadlock(
  state: SokobanState,
  board: Board,
): DeadlockInfo {
  const frozen = new Set<number>();
  const visiting = new Set<number>();

  const blocked = (cell: number): boolean => {
    if (isWallAt(board, cell)) return true;
    if (!state.boxes.has(cell)) return false;
    return isBoxFrozen(cell);
  };

  function isBoxFrozen(box: number): boolean {
    if (frozen.has(box)) return true;
    if (visiting.has(box)) return true;
    visiting.add(box);
    const horizontal =
      blocked(stepPacked(box, "LEFT")) && blocked(stepPacked(box, "RIGHT"));
    const vertical =
      blocked(stepPacked(box, "UP")) && blocked(stepPacked(box, "DOWN"));
    visiting.delete(box);
    const stuck = horizontal && vertical;
    if (stuck) frozen.add(box);
    return stuck;
  }

  const affected: number[] = [];
  for (const box of state.boxes) {
    if (isBoxFrozen(box) && !board.goals.has(box)) affected.push(box);
  }
  if (affected.length === 0) return { detected: false };
  return {
    detected: true,
    type: "freeze",
    affectedBoxes: affected,
    explanation:
      "Several boxes are wedged against each other and the walls. None of the stuck boxes can be pushed.",
  };
}

function boxCanReachGoal(board: Board, box: number, goal: number): boolean {
  if (box === goal) return true;
  const seen = new Set<number>([box]);
  const queue = [box];
  for (let i = 0; i < queue.length; i += 1) {
    const current = queue[i]!;
    for (const action of ACTIONS) {
      const next = stepPacked(current, action);
      if (seen.has(next) || isWallAt(board, next)) continue;
      if (board.deadSquares.has(next) && next !== goal) continue;
      if (next === goal) return true;
      seen.add(next);
      queue.push(next);
    }
  }
  return false;
}

function hasPerfectMatching(reachable: boolean[][]): boolean {
  const n = reachable.length;
  const match = new Array<number>(n).fill(-1);

  const visit = (box: number, seen: boolean[]): boolean => {
    for (let goal = 0; goal < n; goal += 1) {
      if (!reachable[box]![goal] || seen[goal]) continue;
      seen[goal] = true;
      if (match[goal] === -1 || visit(match[goal]!, seen)) {
        match[goal] = box;
        return true;
      }
    }
    return false;
  };

  for (let box = 0; box < n; box += 1) {
    const seen = new Array<boolean>(n).fill(false);
    if (!visit(box, seen)) return false;
  }
  return true;
}

export function detectUnsolvableAssignment(
  state: SokobanState,
  board: Board,
): DeadlockInfo {
  const boxes = [...state.boxes];
  const goals = [...board.goals];
  if (boxes.length !== goals.length) {
    return {
      detected: true,
      type: "assignment",
      explanation: "The number of boxes no longer matches the number of goals.",
    };
  }
  const n = boxes.length;
  if (n === 0) return { detected: false };

  const reachable = boxes.map((box) =>
    goals.map((goal) => boxCanReachGoal(board, box, goal)),
  );
  if (hasPerfectMatching(reachable)) return { detected: false };

  return {
    detected: true,
    type: "assignment",
    affectedBoxes: boxes,
    explanation:
      "There is no way to assign every box to a unique reachable goal from this position.",
  };
}

const DETECTORS = [
  detectCornerDeadlock,
  detectWallDeadlock,
  detectFreezeDeadlock,
  detectUnsolvableAssignment,
];

export function detectDeadlock(
  state: SokobanState,
  board: Board,
): DeadlockInfo {
  if (isSolved(state, board)) return { detected: false };

  for (const box of state.boxes) {
    if (!board.goals.has(box) && board.deadSquares.has(box)) {
      return {
        detected: true,
        type: "dead-square",
        affectedBoxes: [box],
        explanation:
          "A box was pushed onto a square from which no goal can ever be reached.",
      };
    }
  }

  for (const detector of DETECTORS) {
    const result = detector(state, board);
    if (result.detected) return result;
  }
  return { detected: false };
}
