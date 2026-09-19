import { useEffect, useMemo, useRef, useState } from "react";
import { StateGlyph } from "@/components/search/StateGlyph";
import { layoutStory } from "@/visualization/story/layoutStory";
import { ACTION_GLYPH } from "@/utils/coordinates";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import type { Board, SokobanState } from "@/engine/sokoban/types";
import type { SolutionStep } from "@/engine/search/types";

type Props = {
  board: Board;
  frames: SokobanState[];
  steps: SolutionStep[];
  index: number;
  onSelect?: (index: number) => void;
  compact?: boolean;
};

export function StoryGraph({ board, frames, steps, index, onSelect, compact }: Props) {
  const reduced = usePrefersReducedMotion();
  const layout = useMemo(
    () => layoutStory(board, frames, steps, index),
    [board, frames, steps, index],
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
  const focusX = current ? current.x + layout.glyphW * 0.7 : 0;
  const camX = focusX - view.w / 2;
  const camY = current ? current.y - view.h / 2 : 0;
  const overflowX = Math.max(0, layout.width - view.w);
  const overflowY = Math.max(0, layout.height - view.h);
  const tx = clamp(0, overflowX, camX);
  const ty = clamp(0, overflowY, camY);

  return (
    <div className="flex h-full min-h-0 flex-col">
      {!compact && (
        <div className="mb-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-faint">State graph</p>
          <p className="mt-1 max-w-md text-sm text-mute">
            Each tiny board is a snapshot. Gold is the solving path. Grey boards are other pushes
            from here — the frontier.
          </p>
        </div>
      )}
      <div
        ref={frameRef}
        className="relative min-h-0 flex-1 overflow-hidden rounded-2xl bg-[radial-gradient(ellipse_at_center,_rgba(215,179,106,0.09),_transparent_58%)]"
      >
        {layout.nodes.length === 0 ? (
          <div className="grid h-full min-h-[220px] place-items-center text-sm text-mute">
            The graph grows once a route exists.
          </div>
        ) : (
          <div
            className="absolute left-0 top-0"
            style={{
              width: layout.width,
              height: layout.height,
              transform: `translate(${-tx}px, ${-ty}px)`,
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
                        strokeWidth={7}
                        strokeOpacity={0.16}
                        strokeLinecap="round"
                      />
                    )}
                    <line
                      x1={from.x}
                      y1={from.y}
                      x2={to.x}
                      y2={to.y}
                      stroke={edge.gold ? "#d7b36a" : "rgba(255,255,255,0.16)"}
                      strokeWidth={edge.gold ? 2.4 : 1}
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
                          ? "ring-1 ring-gold/50"
                          : node.chosen
                            ? "ring-1 ring-gold/80"
                            : node.deadlock
                              ? "ring-1 ring-rose/70 opacity-60"
                              : "ring-1 ring-white/10 opacity-45",
                    ].join(" ")}
                  >
                    <StateGlyph board={board} state={node.state} />
                  </div>
                  <p
                    className={[
                      "mt-1 text-center font-mono text-[10px] tabular",
                      node.current || node.chosen ? "text-gold" : "text-faint",
                    ].join(" ")}
                  >
                    {node.kind === "path" && node.action ? `${ACTION_GLYPH[node.action]} ` : ""}
                    {node.label}
                    {node.kind === "frontier" && !node.deadlock ? ` · f ${node.f}` : ""}
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

function clamp(min: number, max: number, value: number): number {
  if (max < min) return min;
  return Math.max(min, Math.min(max, value));
}
