export type Dir = "up" | "down" | "left" | "right";

export const DIRS: readonly Dir[] = ["up", "down", "left", "right"];

export const DELTA: Record<Dir, readonly [number, number]> = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
};

export type CellKind =
  | "void"
  | "wall"
  | "floor"
  | "goal"
  | "box"
  | "box-on-goal"
  | "player"
  | "player-on-goal";

export type Difficulty = "easy" | "medium" | "hard" | "expert";

export type Level = {
  id: number;
  name: string;
  difficulty: Difficulty;
  map: string;
  parMoves: number;
  parPushes: number;
};

export type Board = {
  width: number;
  height: number;
  walls: ReadonlySet<number>;
  goals: ReadonlySet<number>;
  floors: ReadonlySet<number>;
};

export type GameState = {
  player: number;
  boxes: ReadonlySet<number>;
};

export type ParsedLevel = {
  board: Board;
  state: GameState;
  map: string;
};

export type MoveResult = {
  ok: boolean;
  state?: GameState;
  pushed: boolean;
};

export type Solution = {
  path: Dir[];
  moves: number;
  pushes: number;
};
