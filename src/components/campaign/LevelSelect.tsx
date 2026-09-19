import { CAMPAIGN_STATS } from "@/levels/campaign-stats";
import type { SokobanLevel } from "@/levels/campaign";
import type { SolvedRun } from "@/hooks/useProgress";

type Props = {
  levels: SokobanLevel[];
  currentId: number;
  solved: Record<number, SolvedRun>;
  solvedCount: number;
  onSelect: (id: number) => void;
  onClose: () => void;
};

export function LevelSelect({ levels, currentId, solved, solvedCount, onSelect, onClose }: Props) {
  return (
    <div
      className="absolute inset-0 z-20 grid place-items-center bg-void/80 p-4"
      role="dialog"
      aria-label="Select level"
    >
      <div className="w-full max-w-3xl rounded-2xl border border-line bg-canvas p-5">
        <div className="flex items-baseline justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-faint">60-level campaign</p>
            <h2 className="mt-1 font-serif text-2xl">Select a level</h2>
          </div>
          <p className="font-mono text-sm tabular text-mute">{solvedCount} / 60 solved</p>
        </div>
        <div className="mt-5 grid grid-cols-5 gap-2 sm:grid-cols-10">
          {levels.map((level) => {
            const done = Boolean(solved[level.id]);
            const stats = CAMPAIGN_STATS[level.id];
            const active = level.id === currentId;
            return (
              <button
                key={level.id}
                type="button"
                onClick={() => onSelect(level.id)}
                className={[
                  "rounded-lg border px-1 py-2 text-center",
                  active ? "border-text bg-text text-void" : "border-line hover:border-line-strong",
                ].join(" ")}
              >
                <div className="font-mono text-sm tabular">{String(level.id).padStart(2, "0")}</div>
                <div className={active ? "text-[10px] opacity-70" : "text-[10px] text-faint"}>
                  {level.difficulty}
                </div>
                <div className={active ? "text-[10px]" : "text-[10px] text-mute"}>
                  {done ? "solved" : "open"}
                </div>
                {done && (
                  <div className={active ? "text-[10px] opacity-70" : "text-[10px] text-faint"}>
                    you {solved[level.id]!.pushes}
                  </div>
                )}
                {stats?.solutionPushes !== undefined && (
                  <div className={active ? "text-[10px] opacity-70" : "text-[10px] text-faint"}>
                    ai {stats.solutionPushes}
                  </div>
                )}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-5 rounded-full border border-line px-4 py-1.5 text-xs text-mute"
        >
          Close
        </button>
      </div>
    </div>
  );
}
