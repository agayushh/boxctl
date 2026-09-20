import { it } from "vitest";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { emitCampaign, simplifyCampaign, tightenCampaign } from "./simplify-campaign";

const out = fileURLToPath(new URL("../src/levels/campaign.ts", import.meta.url));

it.skipIf(process.env.SIMPLIFY !== "1")(
  "writes solvable campaign maps",
  () => {
    writeFileSync(out, emitCampaign(simplifyCampaign()));
  },
  60 * 60_000,
);

it.skipIf(process.env.SIMPLIFY !== "astar")(
  "tightens leftover maps until A* also finishes",
  () => {
    writeFileSync(out, emitCampaign(tightenCampaign()));
  },
  60 * 60_000,
);
