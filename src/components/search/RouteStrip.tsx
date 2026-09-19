import { useEffect, useRef } from "react";
import { ACTION_GLYPH, unpack } from "@/utils/coordinates";
import type { SolutionStep } from "@/engine/search/types";

type Props = {
  steps: SolutionStep[];
  index: number;
  onSelect?: (index: number) => void;
};

export function RouteStrip({ steps, index, onSelect }: Props) {
  const currentRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    currentRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [index]);

  if (steps.length === 0) {
    return <p className="text-sm text-mute">Waiting for a route.</p>;
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <p className="text-[11px] uppercase tracking-[0.18em] text-faint">Route</p>
      <p className="mt-1 text-sm text-mute">
        Only the pushes that solve it — {steps.length} of them.
      </p>
      <ol className="mt-4 min-h-0 flex-1 space-y-1 overflow-auto pr-1">
        {steps.map((step, i) => {
          const from = unpack(step.pushedFrom);
          const to = unpack(step.pushedTo);
                  const current = i === index - 1;
                  const done = i < index;
          return (
            <li key={`${step.pushedFrom}-${i}`} ref={current ? currentRef : undefined}>
              <button
                type="button"
                onClick={() => onSelect?.(i + 1)}
                className={[
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left font-mono text-xs tabular",
                  current
                    ? "bg-gold/15 text-gold"
                    : done
                      ? "text-text"
                      : "text-faint",
                ].join(" ")}
              >
                <span className="w-6 text-faint">{String(i + 1).padStart(2, "0")}</span>
                <span className="w-4 text-gold">{ACTION_GLYPH[step.action]}</span>
                <span>
                  ({from.x},{from.y}) → ({to.x},{to.y})
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
