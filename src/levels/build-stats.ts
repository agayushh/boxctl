import { writeFileSync } from "node:fs";
import { CAMPAIGN, campaignAscii, type LevelStats } from "@/levels/campaign";
import { classifyDifficulty } from "@/levels/classify";
import { parseLevel } from "@/engine/sokoban/parser";
import { solve } from "@/engine/search/solver";

const MAX_NODES = 2_000;

function dump(stats: Record<number, LevelStats>): void {
  writeFileSync(
    new URL("./campaign-stats.ts", import.meta.url),
    `import type { LevelStats } from "@/levels/campaign";\n\nexport const CAMPAIGN_STATS: Record<number, LevelStats> = ${JSON.stringify(stats, null, 2)};\n`,
  );
}

export function buildCampaignStats(): Record<number, LevelStats> {
  const stats: Record<number, LevelStats> = {};

  for (const level of CAMPAIGN) {
    const parsed = parseLevel(campaignAscii(level));
    const result = solve({
      board: parsed.board,
      state: parsed.state,
      algorithm: "astar",
      maxNodes: MAX_NODES,
    });
    const expanded = result.stats.statesExpanded;
    const generated = result.stats.statesGenerated;
    stats[level.id] = {
      solutionFound: Boolean(result.solution),
      solutionPushes: result.solution?.pushes.length,
      solutionMoves: result.solution?.playerMoves,
      statesExplored: expanded,
      deadlocks: result.stats.deadlocksDetected,
      branchingFactor:
        expanded > 0 ? Math.round((generated / expanded) * 10) / 10 : undefined,
    };
    if (level.id % 5 === 0 || level.id === CAMPAIGN.length) dump(stats);
  }

  return stats;
}
