import type { Board } from "@/engine/sokoban/types";
import type { SokobanState } from "@/engine/sokoban/types";

export function boxesOnGoals(state: SokobanState, board: Board): number {
  let count = 0;
  for (const box of state.boxes) {
    if (board.goals.has(box)) count += 1;
  }
  return count;
}

export function isSolved(state: SokobanState, board: Board): boolean {
  if (state.boxes.size !== board.goals.size) return false;
  for (const box of state.boxes) {
    if (!board.goals.has(box)) return false;
  }
  return true;
}

export function misplacedBoxes(state: SokobanState, board: Board): number[] {
  const misplaced: number[] = [];
  for (const box of state.boxes) {
    if (!board.goals.has(box)) misplaced.push(box);
  }
  return misplaced;
}

export function emptyGoals(state: SokobanState, board: Board): number[] {
  const empty: number[] = [];
  for (const goal of board.goals) {
    if (!state.boxes.has(goal)) empty.push(goal);
  }
  return empty;
}
