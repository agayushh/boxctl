import { describe, expect, it } from "vitest";
import { parseLevel } from "../engine/parse.js";
import { Session } from "../engine/game.js";
import { LEVELS } from "../levels/campaign.js";
import { emptySave, upsertPlayer } from "../scores/store.js";
import { fitScale, renderBoard, renderPlay } from "./render.js";
import { themeById } from "./themes.js";
import { stripAnsi } from "./ansi.js";

describe("board render", () => {
  it("draws level 44 as classic ASCII at 2×1", () => {
    const level = LEVELS[43]!;
    const parsed = parseLevel(level.map);
    const lines = renderBoard(parsed.board, parsed.state, themeById("classic"), false);
    expect(lines.map((line) => stripAnsi(line))).toEqual([
      "##########",
      "##@ []..##",
      "##########",
    ]);
  });

  it("scales a board to fill the stage", () => {
    const scale = fitScale(5, 3, 40, 12);
    expect(scale.h).toBeGreaterThan(1);
    expect(scale.w).toBe(scale.h * 2);
    const parsed = parseLevel(LEVELS[43]!.map);
    const lines = renderBoard(parsed.board, parsed.state, themeById("classic"), false, scale);
    expect(lines).toHaveLength(3 * scale.h);
    expect(stripAnsi(lines[0]!).length).toBe(5 * scale.w);
  });
});

describe("play layout", () => {
  it("fills the terminal", () => {
    const session = new Session(LEVELS[1]!);
    const save = emptySave();
    const player = upsertPlayer(save, "Ada");
    const frame = renderPlay({
      cols: 80,
      rows: 24,
      theme: themeById("dungeon"),
      color: false,
      session,
      player,
      win: false,
      newBest: false,
    });
    expect(frame.split("\n")).toHaveLength(24);
    expect(stripAnsi(frame)).toContain("Nested Goals");
    expect(stripAnsi(frame)).toContain("MOVES");
  });
});
