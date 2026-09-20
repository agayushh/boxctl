import { it } from "vitest";
import { CAMPAIGN, campaignAscii } from "@/levels/campaign";
import { parseLevel } from "@/engine/sokoban/parser";
import { solve } from "@/engine/search/solver";

const run = process.env.STATS_LEVEL || process.env.STATS_MODE === "probe-all";
const maxNodes = Number(process.env.STATS_NODES ?? 25_000);

it.skipIf(!run)(
  "probe campaign solvability",
  () => {
    const only = process.env.STATS_LEVEL ? Number(process.env.STATS_LEVEL) : null;
    const levels = only ? CAMPAIGN.filter((level) => level.id === only) : CAMPAIGN;
    const algo = (process.env.STATS_ALGO as "astar" | "greedy") ?? "greedy";
    for (const level of levels) {
      const parsed = parseLevel(campaignAscii(level));
      const t0 = Date.now();
      const result = solve({
        board: parsed.board,
        state: parsed.state,
        algorithm: algo,
        maxNodes,
        mode: "instant",
      });
      console.log(
        JSON.stringify({
          id: level.id,
          boxes: parsed.state.boxes.size,
          w: parsed.board.width,
          h: parsed.board.height,
          algo,
          found: Boolean(result.solution),
          pushes: result.solution?.pushes.length ?? null,
          expanded: result.stats.statesExpanded,
          ms: Date.now() - t0,
        }),
      );
    }
  },
  60 * 60_000,
);
