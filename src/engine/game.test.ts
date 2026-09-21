import { describe, expect, it } from "vitest";
import { pack } from "./coords.js";
import { parseLevel, stringifyLevel, isSolved } from "./parse.js";
import { Session, applyMove } from "./game.js";
import { solve } from "./solver.js";
import type { Level } from "./types.js";

const tiny: Level = {
  id: 1,
  name: "Tiny",
  difficulty: "easy",
  parMoves: 1,
  parPushes: 1,
  map: `#####
#@$.#
#####`,
};

describe("parser", () => {
  it("parses walls, player, box, and goal", () => {
    const parsed = parseLevel(tiny.map);
    expect(parsed.board.width).toBe(5);
    expect(parsed.board.height).toBe(3);
    expect(parsed.state.boxes.size).toBe(1);
    expect(parsed.board.goals.size).toBe(1);
    expect(stringifyLevel(parsed.board, parsed.state)).toBe(tiny.map);
  });

  it("round-trips player-on-goal and box-on-goal", () => {
    const src = `#####
#+$*#
#####`;
    const parsed = parseLevel(src);
    expect(stringifyLevel(parsed.board, parsed.state)).toBe(src);
  });

  it("rejects mismatched boxes and goals", () => {
    expect(() => parseLevel(`####\n#@$ #\n####`)).toThrow(/boxes and .* goals/);
  });
});

describe("movement", () => {
  it("pushes a box onto a goal and wins", () => {
    const session = new Session(tiny);
    expect(session.tryMove("right")).toBe(true);
    expect(session.won).toBe(true);
    expect(session.moves).toBe(1);
    expect(session.pushes).toBe(1);
  });

  it("rejects pushing into a wall", () => {
    const parsed = parseLevel(`#####
# @$#
# . #
#####`);
    const move = applyMove(parsed.state, parsed.board, "right");
    expect(move.ok).toBe(false);
  });

  it("walks onto empty floor", () => {
    const parsed = parseLevel(`#####\n#@ .#\n# $ #\n#####`);
    const move = applyMove(parsed.state, parsed.board, "right");
    expect(move.ok).toBe(true);
    expect(move.state?.player).toBe(pack(2, 1));
  });

  it("undoes a push", () => {
    const session = new Session(tiny);
    session.tryMove("right");
    expect(session.undo()).toBe(true);
    expect(session.won).toBe(false);
    expect(session.moves).toBe(0);
    expect(session.pushes).toBe(0);
  });
});

describe("solver", () => {
  it("solves the one-push puzzle", () => {
    const parsed = parseLevel(tiny.map);
    const solution = solve(parsed);
    expect(solution).not.toBeNull();
    expect(solution?.path).toEqual(["right"]);
    expect(isSolved(parsed.board, parsed.state)).toBe(false);
  });
});
