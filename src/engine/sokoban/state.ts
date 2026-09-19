import type { SokobanState } from "@/engine/sokoban/types";
import { hashState, statesEqual } from "@/utils/hashing";
import { unpack } from "@/utils/coordinates";

export function createState(
  player: number,
  boxes: Iterable<number>,
): SokobanState {
  return { player, boxes: new Set(boxes) };
}

export function cloneState(state: SokobanState): SokobanState {
  return { player: state.player, boxes: new Set(state.boxes) };
}

export function serializeState(state: SokobanState): {
  player: number;
  boxes: number[];
} {
  return { player: state.player, boxes: [...state.boxes].sort((a, b) => a - b) };
}

export function deserializeState(wire: {
  player: number;
  boxes: number[];
}): SokobanState {
  return { player: wire.player, boxes: new Set(wire.boxes) };
}

export function boxList(state: SokobanState): number[] {
  return [...state.boxes].sort((a, b) => a - b);
}

export function describeState(state: SokobanState): string {
  const player = unpack(state.player);
  const boxes = boxList(state)
    .map((cell) => {
      const p = unpack(cell);
      return `${p.x},${p.y}`;
    })
    .join(";");
  return `player:${player.x},${player.y}|boxes:${boxes}`;
}

export { hashState, statesEqual };
