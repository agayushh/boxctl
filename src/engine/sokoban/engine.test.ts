import { describe, expect, it } from "vitest";
import { pack } from "@/utils/coordinates";
import { hashState, statesEqual } from "@/utils/hashing";
import { parseLevel, stringifyLevel } from "@/engine/sokoban/parser";
import { tryMove, generatePushes, pushPathSolves, reachablePlayerCells } from "@/engine/sokoban/moves";
import { detectCornerDeadlock, detectDeadlock, detectWallDeadlock } from "@/engine/sokoban/deadlocks";
import { isSolved } from "@/engine/sokoban/goals";
import { validateLevel } from "@/engine/sokoban/validator";
import { createState } from "@/engine/sokoban/state";
import { minCostAssignment, matchingDistance } from "@/engine/search/heuristics";
import { solve } from "@/engine/search/solver";
import { LEVELS } from "@/levels";

const tiny = `#####
#@$.#
#####`;

describe("parser", () => {
  it("parses walls, player, box, and goal", () => {
    const { board, state } = parseLevel(tiny);
    expect(board.width).toBe(5);
    expect(board.height).toBe(3);
    expect(state.boxes.size).toBe(1);
    expect(board.goals.size).toBe(1);
    expect(stringifyLevel(board, state)).toBe(tiny);
  });

  it("round-trips player-on-goal and box-on-goal", () => {
    const src = `####
#+*#
####`;
    const parsed = parseLevel(src);
    expect(stringifyLevel(parsed.board, parsed.state)).toBe(src);
  });
});

describe("movement", () => {
  it("walks onto empty floor", () => {
    const { board, state } = parseLevel(`#####
#@ .#
#$  #
#####`);
    const move = tryMove(state, board, "RIGHT");
    expect(move.valid).toBe(true);
    expect(move.state?.player).toBe(pack(2, 1));
  });

  it("pushes a box onto a goal", () => {
    const { board, state } = parseLevel(tiny);
    const move = tryMove(state, board, "RIGHT");
    expect(move.valid).toBe(true);
    expect(move.pushedBox).toBe(pack(2, 1));
    expect(isSolved(move.state!, board)).toBe(true);
  });

  it("rejects pushing into a wall", () => {
    const { board, state } = parseLevel(`#####
# @$#
#####`);
    const move = tryMove(state, board, "RIGHT");
    expect(move.valid).toBe(false);
  });

  it("does not pull boxes", () => {
    const { board, state } = parseLevel(`#####
#$@.#
#####`);
    const left = tryMove(state, board, "LEFT");
    expect(left.valid).toBe(false);
    const right = tryMove(state, board, "RIGHT");
    expect(right.valid).toBe(true);
    expect(right.pushedBox).toBeUndefined();
  });
});

describe("state hashing", () => {
  it("is equal when player and boxes match", () => {
    const a = createState(pack(1, 1), [pack(2, 1), pack(3, 1)]);
    const b = createState(pack(1, 1), [pack(3, 1), pack(2, 1)]);
    expect(statesEqual(a, b)).toBe(true);
    expect(hashState(a)).toBe(hashState(b));
  });

  it("changes when a box moves", () => {
    const a = createState(pack(1, 1), [pack(2, 1)]);
    const b = createState(pack(1, 1), [pack(3, 1)]);
    expect(hashState(a)).not.toBe(hashState(b));
  });
});

describe("reachability", () => {
  it("flood-fills around boxes", () => {
    const { board, state } = parseLevel(`######
#@ $.#
######`);
    const reach = reachablePlayerCells(state, board);
    expect(reach.has(pack(1, 1))).toBe(true);
    expect(reach.has(pack(2, 1))).toBe(true);
    expect(reach.has(pack(4, 1))).toBe(false);
  });

  it("generates push successors instead of walks", () => {
    const { board, state } = parseLevel(`######
#@ $.#
######`);
    const pushes = generatePushes(state, board);
    expect(pushes).toHaveLength(1);
    expect(pushes[0]?.action).toBe("RIGHT");
  });
});

describe("deadlocks", () => {
  it("detects a box in a non-goal corner", () => {
    const { board, state } = parseLevel(`####
#$ #
#@.#
####`);
    const info = detectCornerDeadlock(state, board);
    expect(info.detected).toBe(true);
    expect(info.type).toBe("corner");
  });

  it("detects a wall trap with no goal", () => {
    const { board, state } = parseLevel(`######
#$   #
#@  .#
######`);
    const info = detectWallDeadlock(state, board);
    expect(info.detected).toBe(true);
  });

  it("does not flag a box on a goal corner", () => {
    const { board, state } = parseLevel(`####
#*@#
#  #
####`);
    expect(detectDeadlock(state, board).detected).toBe(false);
  });
});

describe("heuristic", () => {
  it("returns a deterministic matching cost", () => {
    const cost = [
      [4, 1],
      [2, 5],
    ];
    const a = minCostAssignment(cost);
    const b = minCostAssignment(cost);
    expect(a.cost).toBe(3);
    expect(b.cost).toBe(3);
    expect(a.assignment).toEqual(b.assignment);
  });

  it("does not assign two boxes to the same goal", () => {
    const { board, state } = parseLevel(`######
# $  #
# $..#
#@   #
######`);
    const breakdown = matchingDistance(state, board);
    const goals = breakdown.pairs.map((pair) => pair.goal);
    expect(new Set(goals).size).toBe(goals.length);
    expect(breakdown.value).toBeGreaterThan(0);
  });
});

describe("search", () => {
  it("BFS solves the tutorial and the path is legal", () => {
    const { board, state } = parseLevel(tiny);
    const result = solve({ board, state, algorithm: "bfs" });
    expect(result.solution).not.toBeNull();
    expect(pushPathSolves(state, board, result.solution!.steps)).toBe(true);
  });

  it("A* solves the tutorial", () => {
    const { board, state } = parseLevel(tiny);
    const result = solve({ board, state, algorithm: "astar" });
    expect(result.solution).not.toBeNull();
    expect(pushPathSolves(state, board, result.solution!.steps)).toBe(true);
    expect(result.stats.statesExpanded).toBeGreaterThan(0);
  });

  it("A* does not return an invalid solution", () => {
    const { board, state } = parseLevel(`######
# .  #
# $$ #
#@ . #
######`);
    const result = solve({ board, state, algorithm: "astar", maxNodes: 5000 });
    expect(result.solution).not.toBeNull();
    expect(pushPathSolves(state, board, result.solution!.steps)).toBe(true);
    expect(isSolved(parseLevel(`######
# .  #
# $$ #
#@ . #
######`).state, board)).toBe(false);
  });

  it("greedy solves the tiny puzzle", () => {
    const { board, state } = parseLevel(tiny);
    const result = solve({ board, state, algorithm: "greedy", maxNodes: 2000 });
    expect(result.solution).not.toBeNull();
    expect(pushPathSolves(state, board, result.solution!.steps)).toBe(true);
  });
});

describe("catalog levels", () => {
  it("includes the 60-level Maths Is Fun campaign", () => {
    expect(LEVELS).toHaveLength(60);
  });

  it("each bundled level is valid", () => {
    for (const level of LEVELS) {
      const parsed = parseLevel(level.ascii);
      const result = validateLevel(parsed.board, parsed.state);
      expect(result.ok, `${level.id}: ${result.issues.map((i) => i.message).join("; ")}`).toBe(true);
    }
  });

  it("A* solves campaign level 1", () => {
    const level = LEVELS[0]!;
    const parsed = parseLevel(level.ascii);
    const result = solve({
      board: parsed.board,
      state: parsed.state,
      algorithm: "astar",
      maxNodes: 20_000,
    });
    expect(result.solution, `${level.id}: ${result.failedReason}`).not.toBeNull();
    expect(pushPathSolves(parsed.state, parsed.board, result.solution!.steps)).toBe(true);
  });

  it("A* matches BFS on push count for a small branching puzzle", () => {
    const { board, state } = parseLevel(`#######
#     #
# $ $ #
#@ . .#
#######`);
    const star = solve({ board, state, algorithm: "astar", maxNodes: 20_000, mode: "instant" });
    const flood = solve({ board, state, algorithm: "bfs", maxNodes: 20_000, mode: "instant" });
    expect(star.solution).not.toBeNull();
    expect(flood.solution).not.toBeNull();
    expect(star.solution!.pushes.length).toBe(flood.solution!.pushes.length);
    expect(pushPathSolves(state, board, star.solution!.steps)).toBe(true);
  });

  it("A* solves campaign level 2", () => {
    const level = LEVELS[1]!;
    const parsed = parseLevel(level.ascii);
    const result = solve({
      board: parsed.board,
      state: parsed.state,
      algorithm: "astar",
      maxNodes: 150_000,
      mode: "instant",
    });
    expect(result.solution, `${level.id}: ${result.failedReason}`).not.toBeNull();
    expect(pushPathSolves(parsed.state, parsed.board, result.solution!.steps)).toBe(true);
    // Push-optimal for this Maths Is Fun map (not the 97-push XSokoban #1 variant).
    expect(result.solution!.pushes.length).toBe(116);
  }, 60_000);
});
