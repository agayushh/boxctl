import { pack, unpack } from "@/utils/coordinates";
import type { Board, CellKind, SokobanState } from "@/engine/sokoban/types";
import { computeSimpleDeadSquares } from "@/engine/sokoban/deadlocks";

export function createBoard(input: {
  width: number;
  height: number;
  walls: Iterable<number>;
  goals: Iterable<number>;
  floors?: Iterable<number>;
}): Board {
  const walls = new Set(input.walls);
  const goals = new Set(input.goals);
  const floors = input.floors
    ? new Set(input.floors)
    : inferFloors(input.width, input.height, walls);
  const skeleton = {
    width: input.width,
    height: input.height,
    walls,
    goals,
    floors,
    deadSquares: new Set<number>(),
  };
  const deadSquares = computeSimpleDeadSquares(skeleton);
  return { ...skeleton, deadSquares };
}

export function inferFloors(
  width: number,
  height: number,
  walls: ReadonlySet<number>,
): Set<number> {
  const floors = new Set<number>();
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const cell = pack(x, y);
      if (!walls.has(cell)) floors.add(cell);
    }
  }
  return floors;
}

export function isWall(board: Board, cell: number): boolean {
  return board.walls.has(cell);
}

export function isFloor(board: Board, cell: number): boolean {
  return board.floors.has(cell);
}

export function isGoal(board: Board, cell: number): boolean {
  return board.goals.has(cell);
}

export function isBlocked(
  board: Board,
  state: SokobanState,
  cell: number,
): boolean {
  return board.walls.has(cell) || state.boxes.has(cell);
}

export function cellKind(
  board: Board,
  state: SokobanState,
  cell: number,
): CellKind {
  if (board.walls.has(cell)) return "wall";
  if (!board.floors.has(cell) && !board.goals.has(cell)) return "void";
  const onGoal = board.goals.has(cell);
  if (state.player === cell) return onGoal ? "player-on-goal" : "player";
  if (state.boxes.has(cell)) return onGoal ? "box-on-goal" : "box";
  return onGoal ? "goal" : "floor";
}

export function cellsInRow(board: Board, y: number): number[] {
  const row: number[] = [];
  for (let x = 0; x < board.width; x += 1) row.push(pack(x, y));
  return row;
}

export function describeCell(board: Board, cell: number): string {
  const { x, y } = unpack(cell);
  if (board.walls.has(cell)) return `wall (${x},${y})`;
  if (board.goals.has(cell)) return `goal (${x},${y})`;
  return `floor (${x},${y})`;
}
