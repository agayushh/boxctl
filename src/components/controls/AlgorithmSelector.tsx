import { ALGORITHMS } from "@/engine/search/solver";
import type { AlgorithmId } from "@/engine/search/types";

type Props = {
  value: AlgorithmId;
  onChange: (id: AlgorithmId) => void;
  compact?: boolean;
};

export function AlgorithmSelector({ value, onChange, compact }: Props) {
  return (
    <div className={compact ? "flex flex-wrap gap-1" : "grid gap-1"}>
      <p className="text-[11px] uppercase tracking-[0.18em] text-faint">Algorithm</p>
      <div className="flex flex-wrap gap-1">
        {ALGORITHMS.map((algo) => {
          const active = algo.id === value;
          return (
            <button
              key={algo.id}
              type="button"
              aria-pressed={active}
              title={algo.summary}
              onClick={() => onChange(algo.id)}
              className={[
                "rounded-full border px-2.5 py-1 text-xs transition-colors",
                active
                  ? "border-text/20 bg-text text-void"
                  : "border-line text-mute hover:border-line-strong hover:text-text",
              ].join(" ")}
            >
              {algo.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
