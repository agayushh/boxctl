import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  emptySave,
  formatTime,
  isUnlocked,
  loadSave,
  playerStats,
  recordCompletion,
  saveSave,
  starsFor,
  upsertPlayer,
} from "./store.js";
import type { Level } from "../engine/types.js";

const level: Level = {
  id: 1,
  name: "Tiny",
  difficulty: "easy",
  parMoves: 10,
  parPushes: 4,
  map: "#####\n#@$.#\n#####",
};

describe("scores", () => {
  it("records bests and averages", () => {
    const save = emptySave();
    const player = upsertPlayer(save, "Ayush");
    recordCompletion(player, level, { moves: 20, pushes: 8, timeMs: 12_000 });
    recordCompletion(player, level, { moves: 12, pushes: 5, timeMs: 8_000 });
    const stats = playerStats(player);
    expect(stats.completed).toBe(1);
    expect(stats.completions).toBe(2);
    expect(stats.avgBestMoves).toBe(12);
    expect(stats.avgAllMoves).toBe(16);
    expect(isUnlocked(player, 2)).toBe(true);
    expect(isUnlocked(player, 3)).toBe(true);
    expect(isUnlocked(null, 1)).toBe(true);
    expect(isUnlocked(null, 50)).toBe(true);
    expect(isUnlocked(player, 0)).toBe(false);
  });

  it("awards stars from par", () => {
    expect(starsFor(10, 10)).toBe(3);
    expect(starsFor(15, 10)).toBe(2);
    expect(starsFor(16, 10)).toBe(1);
  });

  it("round-trips a save file", () => {
    const dir = mkdtempSync(join(tmpdir(), "boxctl-"));
    const file = join(dir, "save.json");
    const save = emptySave();
    upsertPlayer(save, "Ada");
    saveSave(save, file);
    const loaded = loadSave(file);
    expect(loaded.activePlayer).toBe("Ada");
    expect(JSON.parse(readFileSync(file, "utf8")).version).toBe(1);
  });

  it("formats time", () => {
    expect(formatTime(65_000)).toBe("1:05");
  });
});
