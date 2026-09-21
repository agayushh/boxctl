import { DELTA, DIRS, type Dir, type Board, type ParsedLevel, type Solution } from "./types.js";
import { step } from "./coords.js";
import { isSolved } from "./parse.js";

export function solve(
  parsed: ParsedLevel,
  maxStates = 300_000,
): Solution | null {
  if (isSolved(parsed.board, parsed.state)) {
    return { path: [], moves: 0, pushes: 0 };
  }

  type Node = {
    player: number;
    boxes: number[];
    moves: number;
    pushes: number;
    prev: number;
    added: Dir[];
  };

  const startBoxes = [...parsed.state.boxes].sort((a, b) => a - b);
  const queue: Node[] = [
    {
      player: parsed.state.player,
      boxes: startBoxes,
      moves: 0,
      pushes: 0,
      prev: -1,
      added: [],
    },
  ];
  const seen = new Set<string>([regionKey(parsed.state.player, startBoxes, parsed.board)]);

  let head = 0;
  while (head < queue.length) {
    const node = queue[head]!;
    const index = head;
    head += 1;
    if (seen.size > maxStates) return null;

    const boxSet = new Set(node.boxes);
    const { dist, prev } = flood(node.player, parsed.board, boxSet);

    for (const box of node.boxes) {
      for (const dir of DIRS) {
        const [dx, dy] = DELTA[dir];
        const stand = step(box, -dx, -dy);
        const dest = step(box, dx, dy);
        if (!dist.has(stand)) continue;
        if (
          !parsed.board.floors.has(dest) ||
          parsed.board.walls.has(dest) ||
          boxSet.has(dest)
        ) {
          continue;
        }

        const nextBoxes = node.boxes
          .map((cell) => (cell === box ? dest : cell))
          .sort((a, b) => a - b);
        const nextPlayer = box;
        const token = regionKey(nextPlayer, nextBoxes, parsed.board);
        if (seen.has(token)) continue;
        seen.add(token);

        const walk = rewind(stand, prev);
        const next: Node = {
          player: nextPlayer,
          boxes: nextBoxes,
          moves: node.moves + walk.length + 1,
          pushes: node.pushes + 1,
          prev: index,
          added: [...walk, dir],
        };
        if (nextBoxes.every((cell) => parsed.board.goals.has(cell))) {
          return {
            path: reconstruct(queue, next),
            moves: next.moves,
            pushes: next.pushes,
          };
        }
        queue.push(next);
      }
    }
  }
  return null;
}

function regionKey(player: number, boxes: number[], board: Board): string {
  const { dist } = flood(player, board, new Set(boxes));
  let min = player;
  for (const cell of dist.keys()) if (cell < min) min = cell;
  return `${min}:${boxes.join(",")}`;
}

function reconstruct(queue: { prev: number; added: Dir[] }[], last: { prev: number; added: Dir[] }): Dir[] {
  const path: Dir[] = [];
  let node: { prev: number; added: Dir[] } = last;
  while (node.prev >= 0) {
    for (let i = node.added.length - 1; i >= 0; i -= 1) path.push(node.added[i]!);
    node = queue[node.prev]!;
  }
  path.reverse();
  return path;
}

function flood(
  player: number,
  board: Board,
  boxes: ReadonlySet<number>,
): { dist: Map<number, number>; prev: Map<number, { from: number; dir: Dir }> } {
  const dist = new Map<number, number>([[player, 0]]);
  const prev = new Map<number, { from: number; dir: Dir }>();
  const queue = [player];
  for (let i = 0; i < queue.length; i += 1) {
    const cell = queue[i]!;
    const cost = dist.get(cell)!;
    for (const dir of DIRS) {
      const [dx, dy] = DELTA[dir];
      const next = step(cell, dx, dy);
      if (dist.has(next)) continue;
      if (!board.floors.has(next) || board.walls.has(next) || boxes.has(next)) continue;
      dist.set(next, cost + 1);
      prev.set(next, { from: cell, dir });
      queue.push(next);
    }
  }
  return { dist, prev };
}

function rewind(
  end: number,
  prev: Map<number, { from: number; dir: Dir }>,
): Dir[] {
  const path: Dir[] = [];
  let cell = end;
  while (prev.has(cell)) {
    const stepTo = prev.get(cell)!;
    path.push(stepTo.dir);
    cell = stepTo.from;
  }
  path.reverse();
  return path;
}
