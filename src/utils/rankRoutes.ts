export type RankedRoute<T extends { pushes: number | null; moves?: number | null }> = T & {
  rank: number;
  fewestPushes: boolean;
  fewestWalks: boolean;
  /** @deprecated alias of fewestPushes */
  best: boolean;
};

function minPresent(values: Array<number | null | undefined>): number | null {
  const nums = values.filter((value): value is number => value != null);
  if (nums.length === 0) return null;
  return Math.min(...nums);
}

export function rankRoutes<T extends { pushes: number | null; moves?: number | null }>(
  entries: T[],
): RankedRoute<T>[] {
  const sorted = [...entries].sort((a, b) => {
    if (a.pushes == null && b.pushes == null) return 0;
    if (a.pushes == null) return 1;
    if (b.pushes == null) return -1;
    if (a.pushes !== b.pushes) return a.pushes - b.pushes;
    const am = a.moves ?? Number.POSITIVE_INFINITY;
    const bm = b.moves ?? Number.POSITIVE_INFINITY;
    return am - bm;
  });
  const bestPushes = minPresent(sorted.map((entry) => entry.pushes));
  const bestWalks = minPresent(sorted.map((entry) => entry.moves));
  return sorted.map((entry, index) => {
    const fewestPushes = bestPushes !== null && entry.pushes === bestPushes;
    const fewestWalks = bestWalks !== null && entry.moves === bestWalks;
    return {
      ...entry,
      rank: index + 1,
      fewestPushes,
      fewestWalks,
      best: fewestPushes,
    };
  });
}
