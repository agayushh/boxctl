import type { CampaignDifficulty, LevelStats } from "@/levels/campaign";

/**
 * Local labels from this app's A* runs (see src/levels/build-stats.ts, 2_000 node budget).
 * Not a universal Sokoban difficulty scale.
 *
 * - easy: short solved path and a small expanded set
 * - medium: solved without a large search
 * - hard: solved, but the search had to grow
 * - expert: no solution inside the node budget used to label the campaign
 */
export function classifyDifficulty(stats: LevelStats | undefined): CampaignDifficulty {
  if (!stats?.solutionFound) return "expert";
  const expanded = stats.statesExplored ?? 0;
  const pushes = stats.solutionPushes ?? 0;
  if (pushes <= 12 && expanded < 80) return "easy";
  if (expanded < 400) return "medium";
  if (expanded < 2500) return "hard";
  return "expert";
}
