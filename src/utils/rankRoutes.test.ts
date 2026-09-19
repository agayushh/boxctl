import { describe, expect, it } from "vitest";
import { rankRoutes } from "@/utils/rankRoutes";

describe("rankRoutes", () => {
  it("puts the fewest-push route first and ties as joint best", () => {
    const ranked = rankRoutes([
      { id: "you", pushes: 18 },
      { id: "astar", pushes: 12 },
      { id: "greedy", pushes: 12 },
      { id: "beam", pushes: null },
    ]);
    expect(ranked.map((item) => item.id)).toEqual(["astar", "greedy", "you", "beam"]);
    expect(ranked[0]?.fewestPushes).toBe(true);
    expect(ranked[1]?.fewestPushes).toBe(true);
    expect(ranked[2]?.fewestPushes).toBe(false);
    expect(ranked[3]?.fewestPushes).toBe(false);
  });

  it("can award fewest walks to a route that is not fewest pushes", () => {
    const ranked = rankRoutes([
      { id: "you", pushes: 120, moves: 330 },
      { id: "astar", pushes: 116, moves: 935 },
    ]);
    expect(ranked.find((item) => item.id === "astar")?.fewestPushes).toBe(true);
    expect(ranked.find((item) => item.id === "you")?.fewestWalks).toBe(true);
    expect(ranked.find((item) => item.id === "astar")?.fewestWalks).toBe(false);
  });
});
