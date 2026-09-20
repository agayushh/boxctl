import { useEffect, useMemo, useRef, useState } from "react";
import { StateGlyph } from "@/components/search/StateGlyph";
import { layoutStory } from "@/visualization/story/layoutStory";
import { ACTION_GLYPH } from "@/utils/coordinates";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import type { AlgorithmId, SolutionStep } from "@/engine/search/types";
import type { Board, SokobanState } from "@/engine/sokoban/types";

type Props = {
  board: Board;
  frames: SokobanState[];
  steps: SolutionStep[];
  index: number;
  algorithm?: AlgorithmId;
  onSelect?: (index: number) => void;
  compact?: boolean;
};

export function StoryGraph({
  board,
  frames,
  steps,
  index,
  algorithm = "astar",
  onSelect,
  compact,
}: Props) {
  const reduced = usePrefersReducedMotion();
  const layout = useMemo(
    () => layoutStory(board, frames, steps, index, algorithm),
    [board, frames, steps, index, algorithm],
  );
  const frameRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState({ w: 640, h: 360 });

  useEffect(() => {
    const element = frameRef.current;
    if (!element) return;
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (!rect) return;
      setView({ w: rect.width, h: rect.height });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const current = layout.nodes.find((node) => node.id === layout.currentId);
  const fit = Math.min(
    view.w / Math.max(1, layout.width),
    view.h / Math.max(1, layout.height),
  );
  const scale = Math.min(1.7, Math.max(1, fit * 0.9));
  const focusX = current ? current.x + layout.glyphW * 0.45 : layout.width / 2;
  const focusY = current ? current.y : layout.height / 2;
  const camX = focusX * scale - view.w / 2;
  const camY = focusY * scale - view.h / 2;
  const overflowX = layout.width * scale - view.w;
  const overflowY = layout.height * scale - view.h;
  const tx = overflowX <= 0 ? overflowX / 2 : clamp(0, overflowX, camX);
  const ty = overflowY <= 0 ? overflowY / 2 : clamp(0, overflowY, camY);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className={compact ? "mb-2" : "mb-3"}>
        {!compact && (
          <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-faint">Gold path</p>
        )}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-mute">
          <LegendChip color="#d7b36a" label="the plan" />
          <LegendChip color="#d7b36a" glow label="now" />
          <LegendChip color="rgba(255,255,255,0.28)" label="other pushes" />
        </div>
      </div>
      <div
        ref={frameRef}
        className="relative min-h-0 flex-1 overflow-hidden rounded-2xl bg-[radial-gradient(ellipse_at_center,_rgba(215,179,106,0.08),_transparent_58%)]"
      >
        {layout.nodes.length === 0 ? (
          <div className="grid h-full min-h-[220px] place-items-center text-sm text-mute">
            Waiting for the first snapshot.
          </div>
        ) : (
          <div
            className="absolute left-0 top-0"
            style={{
              width: layout.width,
              height: layout.height,
              transform: `translate(${-tx}px, ${-ty}px) scale(${scale})`,
              transformOrigin: "0 0",
              transition: reduced ? undefined : "transform 500ms ease",
            }}
          >
            <svg
              width={layout.width}
              height={layout.height}
              className="absolute inset-0 overflow-visible"
              aria-hidden
            >
              {layout.edges.map((edge) => {
                const from = layout.nodes.find((node) => node.id === edge.from);
                const to = layout.nodes.find((node) => node.id === edge.to);
                if (!from || !to) return null;
                return (
                  <g key={`${edge.from}-${edge.to}`}>
                    {edge.gold && (
                      <line
                        x1={from.x}
                        y1={from.y}
                        x2={to.x}
                        y2={to.y}
                        stroke="#d7b36a"
                        strokeWidth={8}
                        strokeOpacity={0.18}
                        strokeLinecap="round"
                      />
                    )}
                    <line
                      x1={from.x}
                      y1={from.y}
                      x2={to.x}
                      y2={to.y}
                      stroke={edge.gold ? "#d7b36a" : "rgba(255,255,255,0.14)"}
                      strokeWidth={edge.gold ? 2.6 : 1}
                      strokeLinecap="round"
                    />
                  </g>
                );
              })}
            </svg>
            {layout.nodes.map((node) => {
              const pathIndex = node.kind === "path" ? Number(node.id.slice(5)) : null;
              return (
                <button
                  key={node.id}
                  type="button"
                  disabled={pathIndex == null || !onSelect}
                  onClick={() => pathIndex != null && onSelect?.(pathIndex)}
                  className="absolute -translate-x-1/2 -translate-y-1/2 text-left"
                  style={{
                    left: node.x,
                    top: node.y,
                    width: layout.glyphW,
                    transition: reduced ? undefined : "left 420ms ease, top 420ms ease",
                  }}
                >
                  <div
                    className={[
                      "overflow-hidden rounded-md",
                      node.current
                        ? "ring-2 ring-gold shadow-[0_0_28px_rgba(215,179,106,0.45)]"
                        : node.kind === "path"
                          ? "ring-1 ring-gold/55"
                          : node.chosen
                            ? "ring-1 ring-gold/80"
                            : node.deadlock
                              ? "ring-1 ring-rose/70 opacity-55"
                              : "ring-1 ring-white/10 opacity-40",
                    ].join(" ")}
                  >
                    <StateGlyph board={board} state={node.state} />
                  </div>
                  <p
                    className={[
                      "mt-1 whitespace-nowrap text-center font-mono text-[10px] tabular",
                      node.current || node.chosen ? "text-gold" : "text-faint",
                    ].join(" ")}
                  >
                    {node.kind === "path" && node.action ? `${ACTION_GLYPH[node.action]} ` : ""}
                    {node.label}
                    {node.scoreTag ? ` · ${node.scoreTag}` : ""}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function LegendChip({
  color,
  label,
  glow,
}: {
  color: string;
  label: string;
  glow?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="inline-block h-2 w-2 rounded-full"
        style={{
          background: color,
          boxShadow: glow ? "0 0 8px rgba(215,179,106,0.9)" : undefined,
        }}
      />
      {label}
    </span>
  );
}

function clamp(min: number, max: number, value: number): number {
  if (max < min) return min;
  return Math.max(min, Math.min(max, value));
}
