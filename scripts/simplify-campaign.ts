import { unpack } from "@/utils/coordinates";
import { parseLevel, stringifyLevel } from "@/engine/sokoban/parser";
import { validateLevel } from "@/engine/sokoban/validator";
import { solve } from "@/engine/search/solver";
import { CAMPAIGN, type SokobanLevel } from "@/levels/campaign";
import type { Board, SokobanState } from "@/engine/sokoban/types";

const BUDGET = 8_000;
const FINAL_BUDGET = 20_000;
const TARGET_BOXES = 4;

function manhattan(a: number, b: number): number {
  const A = unpack(a);
  const B = unpack(b);
  return Math.abs(A.x - B.x) + Math.abs(A.y - B.y);
}

function trySolve(board: Board, state: SokobanState, maxNodes?: number) {
  const budget =
    maxNodes ??
    (state.boxes.size > 5 || board.width * board.height > 100 ? 3_000 : BUDGET);
  const greedy = solve({ board, state, algorithm: "greedy", maxNodes: budget, mode: "instant" });
  if (greedy.solution) return { ok: true, algo: "greedy" as const, result: greedy };
  return { ok: false, algo: null, result: greedy };
}

function trySolveFinal(board: Board, state: SokobanState) {
  const greedy = trySolve(board, state, FINAL_BUDGET);
  if (greedy.ok) return greedy;
  const astar = solve({ board, state, algorithm: "astar", maxNodes: FINAL_BUDGET, mode: "instant" });
  if (astar.solution) return { ok: true, algo: "astar" as const, result: astar };
  return { ok: false, algo: null, result: astar };
}

function pairKey(box: number, goal: number): string {
  return `${box}:${goal}`;
}

function pickRemoval(
  board: Board,
  state: SokobanState,
  tried: Set<string>,
): { box: number; goal: number } | null {
  const boxes = [...state.boxes];
  const goals = [...board.goals];
  const freeBoxes = boxes.filter((box) => !board.goals.has(box));
  const freeGoals = goals.filter((goal) => !state.boxes.has(goal));
  const parked = boxes.filter((box) => board.goals.has(box));
  const candidates: Array<{ box: number; goal: number; score: number }> = [];

  for (const box of freeBoxes) {
    for (const goal of freeGoals) {
      if (tried.has(pairKey(box, goal))) continue;
      const boxFar = Math.min(...freeGoals.map((item) => manhattan(box, item)));
      candidates.push({ box, goal, score: boxFar });
    }
  }
  for (const cell of parked) {
    if (tried.has(pairKey(cell, cell))) continue;
    candidates.push({ box: cell, goal: cell, score: -1 });
  }
  candidates.sort((a, b) => b.score - a.score);
  return candidates[0] ?? null;
}

function removePair(rows: string[], box: number, goal: number): string[] {
  const next = rows.map((row) => [...row]);
  const clear = (cell: number) => {
    const { x, y } = unpack(cell);
    const row = next[y];
    if (!row || x >= row.length) return;
    const tile = row[x];
    if (tile === "@" || tile === "+") return;
    if (tile === "*") row[x] = " ";
    else if (tile === "$" || tile === ".") row[x] = " ";
  };
  clear(box);
  if (goal !== box) clear(goal);
  return next.map((row) => row.join(""));
}

export function dropToBoxCount(rows: string[], target: number): { board: string[]; changed: boolean } {
  let board = rows;
  let changed = false;
  const tried = new Set<string>();
  for (let guard = 0; guard < 24; guard += 1) {
    const parsed = parseLevel(board.join("\n"));
    if (parsed.state.boxes.size <= target) return { board, changed };
    const pair = pickRemoval(parsed.board, parsed.state, tried);
    if (!pair) return { board, changed };
    tried.add(pairKey(pair.box, pair.goal));
    const candidate = removePair(board, pair.box, pair.goal);
    const nextParsed = parseLevel(candidate.join("\n"));
    if (!validateLevel(nextParsed.board, nextParsed.state).ok) continue;
    board = stringifyLevel(nextParsed.board, nextParsed.state).split("\n");
    tried.clear();
    changed = true;
  }
  return { board, changed };
}

export function simplifyBoard(level: SokobanLevel): {
  board: string[];
  changed: boolean;
  boxes: number;
  solvedBy: "greedy" | "astar" | null;
} {
  let board = [...level.board];
  let changed = false;
  const first = parseLevel(board.join("\n"));
  let attempt = trySolve(first.board, first.state);
  if (attempt.ok) {
    return { board, changed, boxes: first.state.boxes.size, solvedBy: attempt.algo };
  }

  if (first.state.boxes.size > TARGET_BOXES) {
    const dropped = dropToBoxCount(board, TARGET_BOXES);
    board = dropped.board;
    changed = dropped.changed;
  }

  const tried = new Set<string>();
  for (let guard = 0; guard < 16; guard += 1) {
    const parsed = parseLevel(board.join("\n"));
    if (!validateLevel(parsed.board, parsed.state).ok) break;
    attempt = trySolve(parsed.board, parsed.state);
    if (attempt.ok) {
      return { board, changed, boxes: parsed.state.boxes.size, solvedBy: attempt.algo };
    }
    if (parsed.state.boxes.size <= 1) break;
    const pair = pickRemoval(parsed.board, parsed.state, tried);
    if (!pair) break;
    tried.add(pairKey(pair.box, pair.goal));
    const candidate = removePair(board, pair.box, pair.goal);
    const nextParsed = parseLevel(candidate.join("\n"));
    if (!validateLevel(nextParsed.board, nextParsed.state).ok) continue;
    board = stringifyLevel(nextParsed.board, nextParsed.state).split("\n");
    tried.clear();
    changed = true;
  }

  const parsed = parseLevel(board.join("\n"));
  attempt = trySolveFinal(parsed.board, parsed.state);
  return {
    board,
    changed,
    boxes: parsed.state.boxes.size,
    solvedBy: attempt.ok ? attempt.algo : null,
  };
}

export function emitCampaign(levels: SokobanLevel[]): string {
  const body = levels
    .map((level) => {
      const rows = level.board.map((row) => `      ${JSON.stringify(row)}`).join(",\n");
      return `  {\n    "id": ${level.id},\n    "name": ${JSON.stringify(level.name)},\n    "difficulty": ${JSON.stringify(level.difficulty)},\n    "board": [\n${rows}\n    ]\n  }`;
    })
    .join(",\n");
  return `/**
 * Maths Is Fun Sokoban campaign (60 levels).
 *
 * Layouts transcribed from https://www.mathsisfun.com/games/a/sokoban/js/maps.js
 * then simplified where the original map is too large for the in-browser solver.
 * Extra boxes/goals are dropped until Greedy or A* finds a path within ${BUDGET} expansions.
 *
 * Difficulty labels come from this project's A* runs (see classifyDifficulty).
 */
export type CampaignDifficulty = "easy" | "medium" | "hard" | "expert";

export type SokobanLevel = {
  id: number;
  name: string;
  difficulty: CampaignDifficulty;
  board: string[];
};

export type LevelStats = {
  solutionFound: boolean;
  solutionPushes?: number;
  solutionMoves?: number;
  statesExplored?: number;
  deadlocks?: number;
  branchingFactor?: number;
};

export const CAMPAIGN: SokobanLevel[] = [
${body}
];

export function campaignAscii(level: SokobanLevel): string {
  return level.board.join("\\n");
}

export function campaignById(id: number): SokobanLevel | undefined {
  return CAMPAIGN.find((level) => level.id === id);
}
`;
}

export function simplifyCampaign(): SokobanLevel[] {
  const next: SokobanLevel[] = [];
  for (const level of CAMPAIGN) {
    const result = simplifyBoard(level);
    process.stdout.write(
      `${JSON.stringify({
        id: level.id,
        changed: result.changed,
        boxes: result.boxes,
        solvedBy: result.solvedBy,
      })}\n`,
    );
    next.push({ ...level, board: result.board });
  }
  return next;
}

export function tightenAstar(level: SokobanLevel): {
  board: string[];
  changed: boolean;
  boxes: number;
  solvedBy: "astar" | "greedy" | null;
} {
  let board = [...level.board];
  let changed = false;
  const tried = new Set<string>();
  for (let guard = 0; guard < 12; guard += 1) {
    const parsed = parseLevel(board.join("\n"));
    const astar = solve({
      board: parsed.board,
      state: parsed.state,
      algorithm: "astar",
      maxNodes: 8_000,
      mode: "instant",
    });
    if (astar.solution) {
      return { board, changed, boxes: parsed.state.boxes.size, solvedBy: "astar" };
    }
    if (parsed.state.boxes.size <= 1) {
      const greedy = trySolve(parsed.board, parsed.state, FINAL_BUDGET);
      return { board, changed, boxes: parsed.state.boxes.size, solvedBy: greedy.ok ? "greedy" : null };
    }
    const pair = pickRemoval(parsed.board, parsed.state, tried);
    if (!pair) break;
    tried.add(pairKey(pair.box, pair.goal));
    const candidate = removePair(board, pair.box, pair.goal);
    const nextParsed = parseLevel(candidate.join("\n"));
    if (!validateLevel(nextParsed.board, nextParsed.state).ok) continue;
    board = stringifyLevel(nextParsed.board, nextParsed.state).split("\n");
    tried.clear();
    changed = true;
  }
  const parsed = parseLevel(board.join("\n"));
  const astar = solve({
    board: parsed.board,
    state: parsed.state,
    algorithm: "astar",
    maxNodes: FINAL_BUDGET,
    mode: "instant",
  });
  return {
    board,
    changed,
    boxes: parsed.state.boxes.size,
    solvedBy: astar.solution ? "astar" : trySolve(parsed.board, parsed.state, FINAL_BUDGET).ok ? "greedy" : null,
  };
}

export function tightenCampaign(): SokobanLevel[] {
  const next: SokobanLevel[] = [];
  for (const level of CAMPAIGN) {
    const result = tightenAstar(level);
    process.stdout.write(
      `${JSON.stringify({
        id: level.id,
        changed: result.changed,
        boxes: result.boxes,
        solvedBy: result.solvedBy,
      })}\n`,
    );
    next.push({ ...level, board: result.board });
  }
  return next;
}
