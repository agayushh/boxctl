import { ACTIONS, pack, stepPacked } from "@/utils/coordinates";
import { createBoard } from "@/engine/sokoban/board";
import type { ParsedLevel } from "@/engine/sokoban/types";
import { createState } from "@/engine/sokoban/state";

const TILE: Record<string, string> = {
  "#": "wall",
  " ": "floor",
  "-": "floor",
  _: "void",
  ".": "goal",
  "@": "player",
  "+": "player-on-goal",
  $: "box",
  "*": "box-on-goal",
};

export function parseLevel(ascii: string): ParsedLevel {
  const rows = ascii
    .replace(/^\n/, "")
    .replace(/\n$/, "")
    .split("\n")
    .map((row) => row.replace(/\t/g, " "));

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
    const row = rows[y]!.padEnd(width, "_");
    for (let x = 0; x < width; x += 1) {
      const ch = row[x]!;
      const cell = pack(x, y);
      const kind = TILE[ch];
      if (!kind) {
        throw new Error(`Unknown tile '${ch}' at ${x},${y}.`);
      }
      if (kind === "wall" || kind === "void") {
        if (kind === "wall") walls.add(cell);
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

  const room = new Set<number>([player]);
  const queue = [player];
  for (let i = 0; i < queue.length; i += 1) {
    const current = queue[i]!;
    for (const action of ACTIONS) {
      const next = stepPacked(current, action);
      if (room.has(next) || !floors.has(next) || walls.has(next)) continue;
      room.add(next);
      queue.push(next);
    }
  }
  for (const cell of [...floors]) {
    if (!room.has(cell) && !goals.has(cell)) floors.delete(cell);
  }

  const board = createBoard({ width, height, walls, goals, floors });
  return {
    board,
    state: createState(player, boxes),
    ascii: rows.map((row) => row.padEnd(width, " ")).join("\n"),
  };
}

export function stringifyLevel(
  board: {
    width: number;
    height: number;
    walls: ReadonlySet<number>;
    goals: ReadonlySet<number>;
    floors?: ReadonlySet<number>;
  },
  state: { player: number; boxes: ReadonlySet<number> },
): string {
  const rows: string[] = [];
  for (let y = 0; y < board.height; y += 1) {
    let row = "";
    for (let x = 0; x < board.width; x += 1) {
      const cell = pack(x, y);
      const onGoal = board.goals.has(cell);
      if (board.walls.has(cell)) row += "#";
      else if (state.player === cell) row += onGoal ? "+" : "@";
      else if (state.boxes.has(cell)) row += onGoal ? "*" : "$";
      else if (onGoal) row += ".";
      else if (board.floors && !board.floors.has(cell)) row += "_";
      else row += " ";
    }
    rows.push(row);
  }
  return rows.join("\n");
}
