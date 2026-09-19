import { ACTIONS, inBoundsPacked, pack, stepPacked } from "@/utils/coordinates";
import type { Board, SokobanState, ValidationIssue, ValidationResult } from "@/engine/sokoban/types";
import { detectDeadlock } from "@/engine/sokoban/deadlocks";
import { isSolved } from "@/engine/sokoban/goals";

function flood(start: number, board: Board, extraBlocked?: ReadonlySet<number>): Set<number> {
  const seen = new Set<number>([start]);
  const queue = [start];
  for (let i = 0; i < queue.length; i += 1) {
    const current = queue[i]!;
    for (const action of ACTIONS) {
      const next = stepPacked(current, action);
      if (seen.has(next)) continue;
      if (!inBoundsPacked(next, board.width, board.height)) continue;
      if (board.walls.has(next) || !board.floors.has(next)) continue;
      if (extraBlocked?.has(next)) continue;
      seen.add(next);
      queue.push(next);
    }
  }
  return seen;
}

export function validateLevel(board: Board, state: SokobanState): ValidationResult {
  const issues: ValidationIssue[] = [];

  if (!board.floors.has(state.player) || board.walls.has(state.player)) {
    issues.push({ code: "player", message: "The player must stand on a floor or goal." });
  }

  if (state.boxes.has(state.player)) {
    issues.push({ code: "player", message: "The player cannot occupy the same square as a box." });
  }

  if (board.goals.size === 0) {
    issues.push({ code: "goals", message: "Add at least one goal." });
  }

  if (state.boxes.size === 0) {
    issues.push({ code: "boxes", message: "Add at least one box." });
  }

  if (state.boxes.size !== board.goals.size) {
    issues.push({
      code: "count",
      message: `Boxes (${state.boxes.size}) must equal goals (${board.goals.size}).`,
    });
  }

  for (const box of state.boxes) {
    if (board.walls.has(box) || !board.floors.has(box)) {
      issues.push({ code: "boxes", message: "A box is placed on a wall or outside the floor." });
      break;
    }
  }

  const room = flood(state.player, board);
  for (const goal of board.goals) {
    if (!room.has(goal)) {
      issues.push({
        code: "connectivity",
        message: "A goal is not reachable from the player (walls isolate it).",
      });
      break;
    }
  }
  for (const box of state.boxes) {
    if (!room.has(box)) {
      issues.push({
        code: "connectivity",
        message: "A box is not reachable from the player (walls isolate it).",
      });
      break;
    }
  }

  if (issues.length === 0 && !isSolved(state, board)) {
    const deadlock = detectDeadlock(state, board);
    if (deadlock.detected) {
      issues.push({
        code: "deadlock",
        message: deadlock.explanation ?? "The starting position is already a deadlock.",
      });
    }
  }

  return { ok: issues.length === 0, issues };
}

export function emptyGrid(width: number, height: number): {
  walls: Set<number>;
  floors: Set<number>;
} {
  const walls = new Set<number>();
  const floors = new Set<number>();
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const cell = pack(x, y);
      if (x === 0 || y === 0 || x === width - 1 || y === height - 1) walls.add(cell);
      else floors.add(cell);
    }
  }
  return { walls, floors };
}
