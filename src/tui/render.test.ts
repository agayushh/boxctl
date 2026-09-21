import { describe, expect, it } from "vitest";
import { parseLevel } from "../engine/parse.js";
import { Session } from "../engine/game.js";
import { LEVELS } from "../levels/campaign.js";
import { emptySave, upsertPlayer } from "../scores/store.js";
import { fitScale, renderBoard, renderPlay } from "./render.js";
import { themeById } from "./themes.js";
import { stripAnsi } from "./ansi.js";

describe("board render", () => {
  it("draws a compact 2×1 warehouse tile", () => {
    const parsed = parseLevel(LEVELS[43]!.map);
    const lines = renderBoard(
      parsed.board,
      parsed.state,
      themeById("classic"),
      false,
      { w: 2, h: 1 },
    );
    expect(lines.map((line) => stripAnsi(line))).toEqual([
      "██████████",
      "██o []● ██",
      "██████████",
    ]);
  });

  it("uses 4×2 tiles when there is room, never more", () => {
    expect(fitScale(5, 3, 40, 12)).toEqual({ w: 4, h: 2 });
    expect(fitScale(5, 3, 200, 80)).toEqual({ w: 4, h: 2 });
    expect(fitScale(20, 16, 30, 18)).toEqual({ w: 2, h: 1 });
  });
});

describe("play layout", () => {
  it("paints a crate, a goal, and a stick figure", () => {
    const session = new Session(LEVELS[1]!);
    const player = upsertPlayer(emptySave(), "Ada");
    const frame = renderPlay({
      cols: 80,
      rows: 24,
      theme: themeById("classic"),
      color: false,
      session,
      player,
      win: false,
      newBest: false,
    });
    const plain = stripAnsi(frame);
    expect(frame.split("\n")).toHaveLength(24);
    expect(plain).toContain("Nested Goals");
    expect(plain).toContain("┌──┐");
    expect(plain).toContain("●");
    expect(plain).toContain("o");
    expect(plain).toContain("/|\\");
  });
});
