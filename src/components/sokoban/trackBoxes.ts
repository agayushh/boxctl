import { useLayoutEffect, useRef } from "react";
import { manhattanPacked } from "@/utils/coordinates";

export type TrackedBox = {
  id: number;
  cell: number;
  snap: boolean;
};

export function trackBoxes(
  prev: TrackedBox[],
  nextCells: number[],
  seq: { current: number },
): TrackedBox[] {
  const nextSet = new Set(nextCells);
  const stayed: TrackedBox[] = [];
  const movers: TrackedBox[] = [];
  for (const box of prev) {
    if (nextSet.has(box.cell)) stayed.push({ id: box.id, cell: box.cell, snap: false });
    else movers.push(box);
  }

  const occupied = new Set(stayed.map((box) => box.cell));
  const appeared = nextCells.filter((cell) => !occupied.has(cell));
  const takenMover = new Array<boolean>(movers.length).fill(false);
  const takenSpot = new Array<boolean>(appeared.length).fill(false);
  const moved: TrackedBox[] = [];

  const pairs: Array<{ mover: number; spot: number; dist: number }> = [];
  for (let mover = 0; mover < movers.length; mover += 1) {
    for (let spot = 0; spot < appeared.length; spot += 1) {
      pairs.push({
        mover,
        spot,
        dist: manhattanPacked(movers[mover]!.cell, appeared[spot]!),
      });
    }
  }
  pairs.sort((a, b) => a.dist - b.dist || a.mover - b.mover);

  for (const pair of pairs) {
    if (takenMover[pair.mover] || takenSpot[pair.spot]) continue;
    takenMover[pair.mover] = true;
    takenSpot[pair.spot] = true;
    moved.push({
      id: movers[pair.mover]!.id,
      cell: appeared[pair.spot]!,
      snap: pair.dist !== 1,
    });
  }

  for (let spot = 0; spot < appeared.length; spot += 1) {
    if (takenSpot[spot]) continue;
    seq.current += 1;
    moved.push({ id: seq.current, cell: appeared[spot]!, snap: true });
  }

  return [...stayed, ...moved];
}

export function useTrackedBoxes(cells: Iterable<number>, resetKey: string): TrackedBox[] {
  const list = [...cells];
  const seq = useRef(0);
  const committed = useRef<{ key: string; boxes: TrackedBox[] } | null>(null);

  let boxes: TrackedBox[];
  if (!committed.current || committed.current.key !== resetKey) {
    seq.current = 0;
    boxes = list.map((cell) => {
      seq.current += 1;
      return { id: seq.current, cell, snap: true };
    });
  } else {
    boxes = trackBoxes(committed.current.boxes, list, seq);
  }

  useLayoutEffect(() => {
    committed.current = { key: resetKey, boxes };
  });

  return boxes;
}
