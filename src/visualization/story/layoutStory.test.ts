import { describe, expect, it } from "vitest";
import { parseLevel } from "@/engine/sokoban/parser";
import { generatePushes } from "@/engine/sokoban/moves";
import { layoutStory } from "@/visualization/story/layoutStory";
import { narrate } from "@/visualization/story/narrate";
import { LEVELS } from "@/levels";

describe("layoutStory", () => {
  it("grows a gold spine and marks the next push in the frontier", () => {
    const parsed = parseLevel(LEVELS[0]!.ascii);
    const start = layoutStory(parsed.board, [parsed.state], [], 0);
    expect(start.nodes.some((node) => node.kind === "path" && node.current)).toBe(true);
    expect(start.frontierCount).toBeGreaterThan(0);

    const push = generatePushes(parsed.state, parsed.board)[0]!;
    const frames = [parsed.state, push.state];
    const steps = [
      {
        action: push.action,
        pushedFrom: push.pushedFrom,
        pushedTo: push.pushedTo,
        playerWalks: push.playerWalks,
      },
    ];
    const grown = layoutStory(parsed.board, frames, steps, 1);
    expect(grown.revealed).toBe(2);
    expect(grown.edges.some((edge) => edge.gold && edge.from === "path-0" && edge.to === "path-1")).toBe(
      true,
    );

    const choosing = layoutStory(parsed.board, frames, steps, 0);
    expect(choosing.nodes.some((node) => node.kind === "frontier" && node.chosen)).toBe(true);

    const astar = layoutStory(parsed.board, frames, steps, 0, "astar");
    const greedy = layoutStory(parsed.board, frames, steps, 0, "greedy");
    const otherAstar = astar.nodes.find((node) => node.kind === "frontier" && !node.chosen && !node.deadlock);
    const otherGreedy = greedy.nodes.find((node) => node.kind === "frontier" && !node.chosen && !node.deadlock);
    if (otherAstar) expect(otherAstar.scoreTag).toMatch(/^f /);
    if (otherGreedy) expect(otherGreedy.scoreTag).toMatch(/^h /);
  });
});

describe("narrate", () => {
  it("explains the start as a graph, then names A*", () => {
    const start = narrate({
      algorithm: "astar",
      index: 0,
      total: 12,
      frontierCount: 4,
      searching: false,
      solved: false,
      g: 0,
      h: 6,
      f: 6,
    });
    expect(start.focus).toBe("frontier");
    expect(start.body.toLowerCase()).toContain("gold");

    const second = narrate({
      algorithm: "astar",
      index: 1,
      total: 12,
      frontierCount: 3,
      searching: false,
      solved: false,
      g: 1,
      h: 5,
      f: 6,
    });
    expect(second.title).toContain("A*");

    const hunting = narrate({
      algorithm: "astar",
      index: 4,
      total: 1,
      frontierCount: 3,
      searching: true,
      solved: false,
      g: 4,
      h: 8,
      f: 12,
    });
    expect(hunting.title).toContain("4-push");
    expect(hunting.body).toContain("expanding");
  });
});
