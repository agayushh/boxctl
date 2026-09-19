import { CAMPAIGN, campaignAscii, campaignById, type SokobanLevel } from "@/levels/campaign";
import { CAMPAIGN_STATS } from "@/levels/campaign-stats";
import { classifyDifficulty } from "@/levels/classify";
import type { LevelDefinition } from "@/engine/sokoban/types";

export const levels: SokobanLevel[] = CAMPAIGN.map((level) => ({
  ...level,
  difficulty: classifyDifficulty(CAMPAIGN_STATS[level.id]),
}));

export function levelByNumber(id: number): SokobanLevel {
  return levels.find((level) => level.id === id) ?? levels[0]!;
}

export function asDefinition(level: SokobanLevel): LevelDefinition {
  return {
    id: String(level.id),
    number: level.id,
    name: level.name,
    title: `LEVEL ${String(level.id).padStart(2, "0")}`,
    description: `Maths Is Fun campaign · ${level.difficulty}`,
    ascii: campaignAscii(level),
    difficulty:
      level.difficulty === "easy"
        ? "basic"
        : level.difficulty === "medium"
          ? "intermediate"
          : level.difficulty,
  };
}

export const LEVELS = levels.map(asDefinition);

export function levelById(id: string): LevelDefinition | undefined {
  if (id === "custom") return undefined;
  const numeric = Number(id);
  if (Number.isFinite(numeric)) return asDefinition(levelByNumber(numeric));
  return LEVELS.find((level) => level.id === id);
}

export { campaignAscii, campaignById, CAMPAIGN };
export type { SokobanLevel } from "@/levels/campaign";
export { CAMPAIGN_STATS } from "@/levels/campaign-stats";
