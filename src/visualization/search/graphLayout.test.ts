import { describe, expect, it } from "vitest";
import { layoutSearchGraph } from "@/visualization/search/graphLayout";
import type { SearchNode } from "@/engine/search/types";

function node(id: string, parentId: string | undefined, discoveryIndex: number, g: number): SearchNode {
  return {
    id,
    parentId,
    discoveryIndex,
    g,
    h: 0,
    f: g,
    playerWalks: 0,
    depth: g,
    status: "expanded",
    state: { player: 0, boxes: new Set() },
  };
}

describe("layoutSearchGraph", () => {
  it("places children to the right of their parent", () => {
    const nodes = [node("a", undefined, 0, 0), node("b", "a", 1, 1), node("c", "a", 2, 1)];
    const layout = layoutSearchGraph(nodes, "b", new Set(["a", "b"]));
    const a = layout.nodes.find((item) => item.id === "a")!;
    const b = layout.nodes.find((item) => item.id === "b")!;
    const c = layout.nodes.find((item) => item.id === "c")!;
    expect(b.x).toBeGreaterThan(a.x);
    expect(c.x).toBe(b.x);
    expect(b.y).not.toBe(c.y);
  });
});
