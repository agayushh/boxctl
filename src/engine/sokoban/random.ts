import { pack } from "@/utils/coordinates";
import { createBoard } from "@/engine/sokoban/board";
import { createState } from "@/engine/sokoban/state";
import { validateLevel } from "@/engine/sokoban/validator";
import { stringifyLevel } from "@/engine/sokoban/parser";
import type { ParsedLevel } from "@/engine/sokoban/types";
import { emptyGrid } from "@/engine/sokoban/validator";

function randInt(max: number): number {
  return Math.floor(Math.random() * max);
}

export function randomLevel(width = 8, height = 8, boxCount = 2): ParsedLevel {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const { walls, floors } = emptyGrid(width, height);
    const interior: number[] = [];
    for (const cell of floors) {
      const x = cell & 0xff;
      const y = cell >> 8;
      const corner =
        (x === 1 || x === width - 2) && (y === 1 || y === height - 2);
      if (!corner) interior.push(cell);
    }
    if (interior.length < boxCount * 2 + 1) continue;

    const shuffled = shuffle(interior);
    const goals = shuffled.slice(0, boxCount);
    const rest = shuffled.slice(boxCount);
    const boxes = rest.slice(0, boxCount);
    const player = rest[boxCount];
    if (player === undefined) continue;

    const extraWalls = rest.slice(boxCount + 1, boxCount + 1 + Math.min(3, rest.length));
    for (const wall of extraWalls) {
      if (Math.random() < 0.35) {
        walls.add(wall);
        floors.delete(wall);
      }
    }

    const board = createBoard({
      width,
      height,
      walls,
      goals,
      floors,
    });
    const state = createState(player, boxes);
    const check = validateLevel(board, state);
    if (!check.ok) continue;
    return { board, state, ascii: stringifyLevel(board, state) };
  }

  const fallbackWalls = new Set<number>();
  const fallbackFloors = new Set<number>();
  const { walls, floors } = emptyGrid(7, 5);
  for (const w of walls) fallbackWalls.add(w);
  for (const f of floors) fallbackFloors.add(f);
  const board = createBoard({
    width: 7,
    height: 5,
    walls: fallbackWalls,
    goals: [pack(4, 2), pack(5, 2)],
    floors: fallbackFloors,
  });
  return {
    board,
    state: createState(pack(1, 2), [pack(2, 2), pack(3, 2)]),
    ascii: stringifyLevel(board, createState(pack(1, 2), [pack(2, 2), pack(3, 2)])),
  };
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = randInt(i + 1);
    const tmp = copy[i]!;
    copy[i] = copy[j]!;
    copy[j] = tmp;
  }
  return copy;
}
