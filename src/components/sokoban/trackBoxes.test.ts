import { describe, expect, it } from "vitest";
import { pack } from "@/utils/coordinates";
import { trackBoxes, type TrackedBox } from "@/components/sokoban/trackBoxes";

describe("trackBoxes", () => {
  it("keeps the same id when one box slides to a neighbor", () => {
    const seq = { current: 1 };
    const prev: TrackedBox[] = [
      { id: 1, cell: pack(1, 1), snap: false },
      { id: 2, cell: pack(3, 1), snap: false },
    ];
    const next = trackBoxes(prev, [pack(2, 1), pack(3, 1)], seq);
    const moved = next.find((box) => box.id === 1);
    const stayed = next.find((box) => box.id === 2);
    expect(moved?.cell).toBe(pack(2, 1));
    expect(moved?.snap).toBe(false);
    expect(stayed?.cell).toBe(pack(3, 1));
  });

  it("snaps when a box jumps more than one cell", () => {
    const seq = { current: 1 };
    const prev: TrackedBox[] = [{ id: 1, cell: pack(0, 0), snap: false }];
    const next = trackBoxes(prev, [pack(4, 0)], seq);
    expect(next[0]?.id).toBe(1);
    expect(next[0]?.snap).toBe(true);
  });
});
