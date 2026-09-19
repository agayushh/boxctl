import type { Action } from "@/utils/coordinates";
import {
  ACTIONS,
  inBoundsPacked,
  oppositeAction,
  stepPacked,
} from "@/utils/coordinates";
import type {
  Board,
  MoveResult,
  PushSuccessor,
  SokobanState,
} from "@/engine/sokoban/types";
import { isSolved } from "@/engine/sokoban/goals";

export function tryMove(
  state: SokobanState,
  board: Board,
  action: Action,
): MoveResult {
  const dest = stepPacked(state.player, action);
  if (!inBoundsPacked(dest, board.width, board.height) || board.walls.has(dest)) {
    return { valid: false, action, reason: "Blocked by a wall." };
  }

  if (state.boxes.has(dest)) {
    const beyond = stepPacked(dest, action);
    if (
      !inBoundsPacked(beyond, board.width, board.height) ||
      board.walls.has(beyond) ||
      state.boxes.has(beyond)
    ) {
      return {
        valid: false,
        action,
        reason: "Cannot push the box — the square behind it is blocked.",
      };
    }
    const boxes = new Set(state.boxes);
    boxes.delete(dest);
    boxes.add(beyond);
    return {
      valid: true,
      action,
      pushedBox: dest,
      pushedTo: beyond,
      state: { player: dest, boxes },
    };
  }

  return {
    valid: true,
    action,
    state: { player: dest, boxes: state.boxes },
  };
}

export function reachablePlayerCells(
  state: SokobanState,
  board: Board,
): Set<number> {
  const reached = new Set<number>([state.player]);
  const queue = [state.player];

  for (let i = 0; i < queue.length; i += 1) {
    const current = queue[i]!;
    for (const action of ACTIONS) {
      const next = stepPacked(current, action);
      if (reached.has(next)) continue;
      if (!inBoundsPacked(next, board.width, board.height)) continue;
      if (board.walls.has(next) || state.boxes.has(next)) continue;
      reached.add(next);
      queue.push(next);
    }
  }

  return reached;
}

export function playerWalkLength(
  state: SokobanState,
  board: Board,
  target: number,
): number {
  if (state.player === target) return 0;
  const dist = new Map<number, number>([[state.player, 0]]);
  const queue = [state.player];

  for (let i = 0; i < queue.length; i += 1) {
    const current = queue[i]!;
    const currentDist = dist.get(current)!;
    for (const action of ACTIONS) {
      const next = stepPacked(current, action);
      if (dist.has(next)) continue;
      if (!inBoundsPacked(next, board.width, board.height)) continue;
      if (board.walls.has(next) || state.boxes.has(next)) continue;
      if (next === target) return currentDist + 1;
      dist.set(next, currentDist + 1);
      queue.push(next);
    }
  }

  return Number.POSITIVE_INFINITY;
}

export function generatePushes(
  state: SokobanState,
  board: Board,
): PushSuccessor[] {
  const reach = reachablePlayerCells(state, board);
  const successors: PushSuccessor[] = [];

  for (const box of state.boxes) {
    for (const action of ACTIONS) {
      const dest = stepPacked(box, action);
      const stand = stepPacked(box, oppositeAction(action));
      if (!reach.has(stand)) continue;
      if (!inBoundsPacked(dest, board.width, board.height)) continue;
      if (board.walls.has(dest) || state.boxes.has(dest)) continue;

      const boxes = new Set(state.boxes);
      boxes.delete(box);
      boxes.add(dest);
      const walks = playerWalkLength({ ...state, player: state.player }, board, stand);
      successors.push({
        state: { player: box, boxes },
        action,
        pushedFrom: box,
        pushedTo: dest,
        playerWalks: Number.isFinite(walks) ? walks : 0,
      });
    }
  }

  return successors;
}

export function applyActions(
  state: SokobanState,
  board: Board,
  actions: Action[],
): SokobanState | null {
  let current = state;
  for (const action of actions) {
    const result = tryMove(current, board, action);
    if (!result.valid || !result.state) return null;
    current = result.state;
  }
  return current;
}

export function applyPushSteps(
  state: SokobanState,
  board: Board,
  steps: Array<{ action: Action; pushedFrom: number }>,
): SokobanState | null {
  let current = state;
  for (const step of steps) {
    const match = generatePushes(current, board).find(
      (successor) =>
        successor.action === step.action && successor.pushedFrom === step.pushedFrom,
    );
    if (!match) return null;
    current = match.state;
  }
  return current;
}

export function pathSolves(
  state: SokobanState,
  board: Board,
  actions: Action[],
): boolean {
  const end = applyActions(state, board, actions);
  return end !== null && isSolved(end, board);
}

export function pushPathSolves(
  state: SokobanState,
  board: Board,
  steps: Array<{ action: Action; pushedFrom: number }>,
): boolean {
  const end = applyPushSteps(state, board, steps);
  return end !== null && isSolved(end, board);
}

export function expandPushesToWalks(
  state: SokobanState,
  board: Board,
  steps: Array<{ action: Action; pushedFrom: number }>,
): Action[] | null {
  const moves: Action[] = [];
  let current = state;
  for (const step of steps) {
    const stand = stepPacked(step.pushedFrom, oppositeAction(step.action));
    const walk = walkActions(current, board, stand);
    if (!walk) return null;
    moves.push(...walk, step.action);
    const next = tryMove(
      walk.reduce((s, action) => tryMove(s, board, action).state ?? s, current),
      board,
      step.action,
    );
    if (!next.valid || !next.state) return null;
    current = next.state;
  }
  return moves;
}

function walkActions(
  state: SokobanState,
  board: Board,
  target: number,
): Action[] | null {
  if (state.player === target) return [];
  const parent = new Map<number, { from: number; action: Action }>();
  const queue = [state.player];
  const seen = new Set<number>([state.player]);
  for (let i = 0; i < queue.length; i += 1) {
    const current = queue[i]!;
    for (const action of ACTIONS) {
      const next = stepPacked(current, action);
      if (seen.has(next)) continue;
      if (!inBoundsPacked(next, board.width, board.height)) continue;
      if (board.walls.has(next) || state.boxes.has(next)) continue;
      parent.set(next, { from: current, action });
      if (next === target) {
        const path: Action[] = [];
        let cursor: number | undefined = next;
        while (cursor !== undefined && cursor !== state.player) {
          const step = parent.get(cursor);
          if (!step) return null;
          path.push(step.action);
          cursor = step.from;
        }
        path.reverse();
        return path;
      }
      seen.add(next);
      queue.push(next);
    }
  }
  return null;
}
