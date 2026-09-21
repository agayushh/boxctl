import { describe, expect, it } from "vitest";
import { LEVELS, LEVEL_COUNT } from "./campaign.js";
import { parseLevel } from "../engine/parse.js";
import { solve } from "../engine/solver.js";
import { Session } from "../engine/game.js";

describe("campaign", () => {
  it("has 50 levels", () => {
    expect(LEVEL_COUNT).toBe(50);
    expect(LEVELS).toHaveLength(50);
    expect(LEVELS.map((level) => level.id)).toEqual(
      Array.from({ length: 50 }, (_, i) => i + 1),
    );
  });

  it("parses every level", () => {
    for (const level of LEVELS) {
      const parsed = parseLevel(level.map);
      expect(parsed.state.boxes.size).toBe(parsed.board.goals.size);
    }
  });

  it(
    "is solvable for every level",
    () => {
      for (const level of LEVELS) {
        const parsed = parseLevel(level.map);
        const solution = solve(parsed, 200_000);
        expect(solution, `level ${level.id} ${level.name}`).not.toBeNull();
        const session = new Session(level, parsed);
        for (const dir of solution!.path) {
          expect(session.tryMove(dir), `level ${level.id} move ${dir}`).toBe(true);
        }
        expect(session.won, `level ${level.id} should be won`).toBe(true);
        expect(session.moves).toBe(solution!.moves);
        expect(session.pushes).toBe(solution!.pushes);
        expect(level.parMoves).toBe(solution!.moves);
        expect(level.parPushes).toBe(solution!.pushes);
      }
    },
    120_000,
  );
});
