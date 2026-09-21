import { pack, unpack } from "./coords.js";
import type { Board, CellKind, GameState, ParsedLevel } from "./types.js";

const TILES: Record<string, CellKind | "skip"> = {
  "#": "wall",
  " ": "floor",
  "-": "floor",
  _: "void",
  ".": "goal",
  $: "box",
  "*": "box-on-goal",
  "@": "player",
  "+": "player-on-goal",
};

export function parseLevel(ascii: string): ParsedLevel {
  const rows = ascii.replace(/^\n/, "").replace(/\n$/, "").split("\n");
  if (rows.length === 0 || rows.every((row) => row.trim() === "")) {
    throw new Error("Level is empty.");
  }

  const height = rows.length;
  const width = Math.max(...rows.map((row) => row.length));
  const walls = new Set<number>();
  const goals = new Set<number>();
  const floors = new Set<number>();
  const boxes: number[] = [];
  let player: number | null = null;

  for (let y = 0; y < height; y += 1) {
    const row = rows[y]!.padEnd(width, " ");
    for (let x = 0; x < width; x += 1) {
      const ch = row[x]!;
      const kind = TILES[ch];
      if (!kind) throw new Error(`Unknown tile '${ch}' at ${x},${y}.`);
      if (kind === "void" || kind === "skip") continue;
      const cell = pack(x, y);
      if (kind === "wall") {
        walls.add(cell);
        continue;
      }
      floors.add(cell);
      if (kind === "goal" || kind === "player-on-goal" || kind === "box-on-goal") {
        goals.add(cell);
      }
      if (kind === "player" || kind === "player-on-goal") {
        if (player !== null) throw new Error("Level has more than one player.");
        player = cell;
      }
      if (kind === "box" || kind === "box-on-goal") boxes.push(cell);
    }
  }

  if (player === null) throw new Error("Level has no player.");
  if (boxes.length === 0) throw new Error("Level has no boxes.");
  if (boxes.length !== goals.size) {
    throw new Error(
      `Level has ${boxes.length} boxes and ${goals.size} goals.`,
    );
  }

  const board: Board = { width, height, walls, goals, floors };
  return {
    board,
    state: { player, boxes: new Set(boxes) },
    map: stringifyLevel(board, { player, boxes: new Set(boxes) }),
  };
}

export function stringifyLevel(board: Board, state: GameState): string {
  const rows: string[] = [];
  for (let y = 0; y < board.height; y += 1) {
    let row = "";
    for (let x = 0; x < board.width; x += 1) {
      row += glyphAt(board, state, pack(x, y));
    }
    rows.push(row.trimEnd());
  }
  return rows.join("\n");
}

export function glyphAt(board: Board, state: GameState, cell: number): string {
  const onGoal = board.goals.has(cell);
  if (board.walls.has(cell)) return "#";
  if (!board.floors.has(cell)) return " ";
  if (state.player === cell) return onGoal ? "+" : "@";
  if (state.boxes.has(cell)) return onGoal ? "*" : "$";
  if (onGoal) return ".";
  return " ";
}

export function cellKind(board: Board, state: GameState, cell: number): CellKind {
  const onGoal = board.goals.has(cell);
  if (board.walls.has(cell)) return "wall";
  if (!board.floors.has(cell)) return "void";
  if (state.player === cell) return onGoal ? "player-on-goal" : "player";
  if (state.boxes.has(cell)) return onGoal ? "box-on-goal" : "box";
  return onGoal ? "goal" : "floor";
}

export function isSolved(board: Board, state: GameState): boolean {
  if (state.boxes.size !== board.goals.size) return false;
  for (const box of state.boxes) {
    if (!board.goals.has(box)) return false;
  }
  return true;
}

export function boxesOnGoals(board: Board, state: GameState): number {
  let n = 0;
  for (const box of state.boxes) if (board.goals.has(box)) n += 1;
  return n;
}

export function describeCell(cell: number): string {
  const { x, y } = unpack(cell);
  return `${x},${y}`;
}
