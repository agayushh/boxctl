import type { SearchStats } from "@/engine/search/types";
import { ALGORITHMS } from "@/engine/search/solver";
import { formatInt, formatMs } from "@/utils/statistics";

export function SearchMetrics({ stats, live }: { stats: SearchStats; live?: boolean }) {
  const name = ALGORITHMS.find((item) => item.id === stats.algorithm)?.name ?? stats.algorithm;
  const rows = [
    ["Algorithm", name],
    ["Solution pushes", formatInt(stats.solutionPushes)],
    ["Player moves", formatInt(stats.playerMoves)],
    ["States generated", formatInt(stats.statesGenerated)],
    ["States expanded", formatInt(stats.statesExpanded)],
    ["States pruned", formatInt(stats.statesPruned)],
    ["Deadlocks detected", formatInt(stats.deadlocksDetected)],
    ["Peak frontier", formatInt(stats.peakFrontier)],
    ["Search time", live ? "—" : formatMs(stats.elapsedMs)],
  ];
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs sm:grid-cols-3">
      {rows.map(([label, value]) => (
        <div key={label}>
          <dt className="text-faint">{label}</dt>
          <dd className="mt-0.5 font-mono text-[13px] tabular text-text">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
