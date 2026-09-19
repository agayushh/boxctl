export type Position = {
  readonly x: number;
  readonly y: number;
};

export type Action = "UP" | "DOWN" | "LEFT" | "RIGHT";

export const ACTIONS: readonly Action[] = ["UP", "DOWN", "LEFT", "RIGHT"];

export const DELTA: Record<Action, Position> = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
};

export const ACTION_GLYPH: Record<Action, string> = {
  UP: "↑",
  DOWN: "↓",
  LEFT: "←",
  RIGHT: "→",
};

export const ACTION_WORD: Record<Action, string> = {
  UP: "up",
  DOWN: "down",
  LEFT: "left",
  RIGHT: "right",
};

const SHIFT = 8;
const MASK = 0xff;

export function pack(x: number, y: number): number {
  return (y << SHIFT) | x;
}

export function unpack(packed: number): Position {
  return { x: packed & MASK, y: packed >> SHIFT };
}

export function packPos(position: Position): number {
  return pack(position.x, position.y);
}

export function samePos(a: Position, b: Position): boolean {
  return a.x === b.x && a.y === b.y;
}

export function manhattanPacked(a: number, b: number): number {
  const ax = a & MASK;
  const ay = a >> SHIFT;
  const bx = b & MASK;
  const by = b >> SHIFT;
  return Math.abs(ax - bx) + Math.abs(ay - by);
}

export function stepPacked(packed: number, action: Action): number {
  const x = packed & MASK;
  const y = packed >> SHIFT;
  const delta = DELTA[action];
  return pack(x + delta.x, y + delta.y);
}

export function oppositeAction(action: Action): Action {
  if (action === "UP") return "DOWN";
  if (action === "DOWN") return "UP";
  if (action === "LEFT") return "RIGHT";
  return "LEFT";
}

export function inBoundsPacked(
  packed: number,
  width: number,
  height: number,
): boolean {
  const x = packed & MASK;
  const y = packed >> SHIFT;
  return x >= 0 && y >= 0 && x < width && y < height;
}

export function positionsFromPacked(cells: Iterable<number>): Position[] {
  return [...cells].map(unpack);
}
