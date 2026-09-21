import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { DEFAULT_THEME, themeById } from "../tui/themes.js";
import type { Level } from "../engine/types.js";

export type LevelRecord = {
  completions: number;
  bestMoves: number;
  bestPushes: number;
  bestTimeMs: number;
  totalMoves: number;
  totalPushes: number;
  totalTimeMs: number;
  bestStars: number;
};

export type PlayerSave = {
  name: string;
  createdAt: string;
  levels: Record<string, LevelRecord>;
};

export type SaveFile = {
  version: 1;
  theme: string;
  activePlayer: string;
  players: Record<string, PlayerSave>;
};

export type Completion = {
  moves: number;
  pushes: number;
  timeMs: number;
};

export function defaultSavePath(): string {
  return process.env.SOKOBAN_SAVE ?? path.join(os.homedir(), ".sokoban-tui", "save.json");
}

export function emptySave(): SaveFile {
  return { version: 1, theme: DEFAULT_THEME, activePlayer: "", players: {} };
}

export function loadSave(file?: string): SaveFile {
  const target = file ?? defaultSavePath();
  try {
    const raw = fs.readFileSync(target, "utf8");
    const parsed = JSON.parse(raw) as SaveFile;
    if (parsed.version !== 1 || typeof parsed.players !== "object") return emptySave();
    parsed.theme = themeById(parsed.theme).id;
    return parsed;
  } catch {
    return emptySave();
  }
}

export function saveSave(save: SaveFile, file?: string): void {
  const target = file ?? defaultSavePath();
  const dir = path.dirname(target);
  fs.mkdirSync(dir, { recursive: true });
  const tmp = `${target}.tmp`;
  fs.writeFileSync(tmp, `${JSON.stringify(save, null, 2)}\n`);
  fs.renameSync(tmp, target);
}

export function upsertPlayer(save: SaveFile, name: string): PlayerSave {
  const trimmed = name.trim().slice(0, 20);
  if (!trimmed) throw new Error("Name is empty.");
  const existing = save.players[trimmed];
  if (existing) {
    save.activePlayer = trimmed;
    return existing;
  }
  const player: PlayerSave = {
    name: trimmed,
    createdAt: new Date().toISOString(),
    levels: {},
  };
  save.players[trimmed] = player;
  save.activePlayer = trimmed;
  return player;
}

export function activePlayer(save: SaveFile): PlayerSave | null {
  if (!save.activePlayer) return null;
  return save.players[save.activePlayer] ?? null;
}

export function starsFor(moves: number, parMoves: number): 1 | 2 | 3 {
  if (parMoves <= 0) return 1;
  if (moves <= parMoves) return 3;
  if (moves <= Math.ceil(parMoves * 1.5)) return 2;
  return 1;
}

export function recordCompletion(
  player: PlayerSave,
  level: Level,
  completion: Completion,
): { record: LevelRecord; newBest: boolean } {
  const key = String(level.id);
  const stars = starsFor(completion.moves, level.parMoves);
  const prev = player.levels[key];
  if (!prev) {
    const record: LevelRecord = {
      completions: 1,
      bestMoves: completion.moves,
      bestPushes: completion.pushes,
      bestTimeMs: completion.timeMs,
      totalMoves: completion.moves,
      totalPushes: completion.pushes,
      totalTimeMs: completion.timeMs,
      bestStars: stars,
    };
    player.levels[key] = record;
    return { record, newBest: true };
  }
  const newBest =
    completion.moves < prev.bestMoves ||
    (completion.moves === prev.bestMoves && completion.pushes < prev.bestPushes) ||
    (completion.moves === prev.bestMoves &&
      completion.pushes === prev.bestPushes &&
      completion.timeMs < prev.bestTimeMs);
  prev.completions += 1;
  prev.totalMoves += completion.moves;
  prev.totalPushes += completion.pushes;
  prev.totalTimeMs += completion.timeMs;
  prev.bestMoves = Math.min(prev.bestMoves, completion.moves);
  prev.bestPushes = Math.min(prev.bestPushes, completion.pushes);
  prev.bestTimeMs = Math.min(prev.bestTimeMs, completion.timeMs);
  prev.bestStars = Math.max(prev.bestStars, stars);
  return { record: prev, newBest };
}

export function isUnlocked(player: PlayerSave | null, levelId: number): boolean {
  if (levelId <= 1) return true;
  if (!player) return false;
  return (player.levels[String(levelId - 1)]?.completions ?? 0) > 0;
}

export function completedCount(player: PlayerSave | null): number {
  if (!player) return 0;
  return Object.values(player.levels).filter((record) => record.completions > 0).length;
}

export type PlayerStats = {
  completed: number;
  completions: number;
  avgBestMoves: number | null;
  avgBestPushes: number | null;
  avgBestTimeMs: number | null;
  avgAllMoves: number | null;
  totalTimeMs: number;
  stars: number;
};

export function playerStats(player: PlayerSave | null): PlayerStats {
  const empty: PlayerStats = {
    completed: 0,
    completions: 0,
    avgBestMoves: null,
    avgBestPushes: null,
    avgBestTimeMs: null,
    avgAllMoves: null,
    totalTimeMs: 0,
    stars: 0,
  };
  if (!player) return empty;
  const records = Object.values(player.levels).filter((record) => record.completions > 0);
  if (records.length === 0) return empty;
  const completions = records.reduce((sum, record) => sum + record.completions, 0);
  const totalMoves = records.reduce((sum, record) => sum + record.totalMoves, 0);
  return {
    completed: records.length,
    completions,
    avgBestMoves: mean(records.map((record) => record.bestMoves)),
    avgBestPushes: mean(records.map((record) => record.bestPushes)),
    avgBestTimeMs: mean(records.map((record) => record.bestTimeMs)),
    avgAllMoves: completions === 0 ? null : totalMoves / completions,
    totalTimeMs: records.reduce((sum, record) => sum + record.totalTimeMs, 0),
    stars: records.reduce((sum, record) => sum + record.bestStars, 0),
  };
}

function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function formatTime(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function starBar(count: number): string {
  return "★".repeat(count) + "☆".repeat(Math.max(0, 3 - count));
}
