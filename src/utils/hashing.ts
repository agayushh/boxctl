import type { SokobanState } from "@/engine/sokoban/types";

export function hashState(state: SokobanState): string {
  const boxes = [...state.boxes].sort((a, b) => a - b);
  return `${state.player}|${boxes.join(",")}`;
}

export function statesEqual(a: SokobanState, b: SokobanState): boolean {
  if (a.player !== b.player || a.boxes.size !== b.boxes.size) return false;
  for (const box of a.boxes) {
    if (!b.boxes.has(box)) return false;
  }
  return true;
}
