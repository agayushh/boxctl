import { DELTA, type Dir } from "./types.js";
import { step } from "./coords.js";
import { boxesOnGoals, isSolved, parseLevel } from "./parse.js";
import type { Board, GameState, Level, MoveResult, ParsedLevel } from "./types.js";

const MAX_HISTORY = 400;

export class Session {
  readonly level: Level;
  readonly parsed: ParsedLevel;
  readonly startedAt: number;
  private current: GameState;
  private past: GameState[] = [];
  private future: GameState[] = [];
  moves = 0;
  pushes = 0;
  private moveLog: Dir[] = [];
  private pushFlags: boolean[] = [];

  constructor(level: Level, parsed = parseLevel(level.map)) {
    this.level = level;
    this.parsed = parsed;
    this.current = cloneState(parsed.state);
    this.startedAt = Date.now();
  }

  get board(): Board {
    return this.parsed.board;
  }

  get state(): GameState {
    return this.current;
  }

  get won(): boolean {
    return isSolved(this.board, this.current);
  }

  get elapsedMs(): number {
    return Date.now() - this.startedAt;
  }

  get canUndo(): boolean {
    return this.past.length > 0;
  }

  get canRedo(): boolean {
    return this.future.length > 0;
  }

  get placed(): number {
    return boxesOnGoals(this.board, this.current);
  }

  get totalBoxes(): number {
    return this.board.goals.size;
  }

  tryMove(dir: Dir): boolean {
    if (this.won) return false;
    const result = applyMove(this.current, this.board, dir);
    if (!result.ok || !result.state) return false;
    this.past.push(this.current);
    if (this.past.length > MAX_HISTORY) this.past.shift();
    this.future = [];
    this.current = result.state;
    this.moves += 1;
    this.moveLog.push(dir);
    this.pushFlags.push(result.pushed);
    if (result.pushed) this.pushes += 1;
    return true;
  }

  undo(): boolean {
    const prev = this.past.pop();
    if (!prev) return false;
    this.future.push(this.current);
    this.current = prev;
    this.moves = Math.max(0, this.moves - 1);
    this.moveLog.pop();
    const pushed = this.pushFlags.pop();
    if (pushed) this.pushes = Math.max(0, this.pushes - 1);
    return true;
  }

  redo(): boolean {
    const next = this.future.pop();
    if (!next) return false;
    this.past.push(this.current);
    this.current = next;
    this.moves += 1;
    return true;
  }

  reset(): Session {
    return new Session(this.level, this.parsed);
  }
}

export function applyMove(
  state: GameState,
  board: Board,
  dir: Dir,
): MoveResult {
  const [dx, dy] = DELTA[dir];
  const dest = step(state.player, dx, dy);
  if (!board.floors.has(dest) || board.walls.has(dest)) {
    return { ok: false, pushed: false };
  }
  if (!state.boxes.has(dest)) {
    return { ok: true, pushed: false, state: { player: dest, boxes: state.boxes } };
  }
  const beyond = step(dest, dx, dy);
  if (
    !board.floors.has(beyond) ||
    board.walls.has(beyond) ||
    state.boxes.has(beyond)
  ) {
    return { ok: false, pushed: false };
  }
  const boxes = new Set(state.boxes);
  boxes.delete(dest);
  boxes.add(beyond);
  return { ok: true, pushed: true, state: { player: dest, boxes } };
}

export function cloneState(state: GameState): GameState {
  return { player: state.player, boxes: new Set(state.boxes) };
}

export function sortedBoxes(state: GameState): number[] {
  return [...state.boxes].sort((a, b) => a - b);
}

export function stateKey(state: GameState): string {
  return `${state.player}:${sortedBoxes(state).join(",")}`;
}
