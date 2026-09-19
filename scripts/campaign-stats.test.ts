import { it } from "vitest";
import { CAMPAIGN, campaignAscii } from "@/levels/campaign";
import { parseLevel } from "@/engine/sokoban/parser";
import { solve } from "@/engine/search/solver";
import { buildCampaignStats } from "@/levels/build-stats";

const mode = process.env.STATS_MODE ?? "probe";

const run = process.env.STATS_MODE === "all" || Boolean(process.env.STATS_LEVEL);

it.skipIf(!run)(
  "campaign solver helper",
  () => {
    if (mode === "all") {
      buildCampaignStats();
      return;
    }
    const id = Number(process.env.STATS_LEVEL ?? 2);
    const maxNodes = Number(process.env.STATS_NODES ?? 20_000);
    const level = CAMPAIGN[id - 1]!;
    const parsed = parseLevel(campaignAscii(level));
    const t0 = Date.now();
    const result = solve({
      board: parsed.board,
      state: parsed.state,
      algorithm: "astar",
      maxNodes,
    });
    console.log({
      id,
      found: Boolean(result.solution),
      pushes: result.solution?.pushes.length,
      expanded: result.stats.statesExpanded,
      generated: result.stats.statesGenerated,
      ms: Date.now() - t0,
      reason: result.failedReason,
    });
  },
  60 * 60_000,
);
