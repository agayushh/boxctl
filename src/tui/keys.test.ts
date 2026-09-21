import { describe, expect, it } from "vitest";
import { parseInput, asDir } from "./keys.js";

describe("keys", () => {
  it("parses arrows, enter, and letters", () => {
    const keys = parseInput("\x1b[A\x1b[B\rwasd");
    expect(keys.map((key) => key.type)).toEqual([
      "up",
      "down",
      "enter",
      "char",
      "char",
      "char",
      "char",
    ]);
    expect(asDir(keys[3]!)).toBe("up");
    expect(asDir(keys[6]!)).toBe("right");
  });

  it("parses ctrl-c and backspace", () => {
    const keys = parseInput("\x03\x7f");
    expect(keys).toEqual([
      { type: "ctrl", value: "c" },
      { type: "backspace" },
    ]);
  });
});
