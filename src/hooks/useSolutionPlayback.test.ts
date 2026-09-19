import { describe, expect, it } from "vitest";
import { replaySteps } from "@/hooks/useSolutionPlayback";

describe("replaySteps", () => {
  it("replays only the recorded pushes", () => {
    const start = { player: 1, boxes: new Set([10, 20]) };
    const frames = replaySteps(start, [
      { action: "LEFT", pushedFrom: 10, pushedTo: 9, playerWalks: 2 },
      { action: "UP", pushedFrom: 20, pushedTo: 12, playerWalks: 1 },
    ]);
    expect(frames).toHaveLength(3);
    expect([...frames[1]!.boxes].sort((a, b) => a - b)).toEqual([9, 20]);
    expect(frames[1]!.player).toBe(10);
    expect([...frames[2]!.boxes].sort((a, b) => a - b)).toEqual([9, 12]);
  });
});
