import { useMemo } from "react";
import type { SearchNode as EngineNode } from "@/engine/search/types";
import { layoutSearchGraph } from "@/visualization/search/graphLayout";
import { SearchEdge } from "@/components/search/SearchEdge";
import { SearchNode } from "@/components/search/SearchNode";
import { SearchLegend } from "@/components/search/SearchLegend";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

type Props = {
  nodes: EngineNode[];
  currentId: string | null;
  solutionIds: string[];
  onSelect: (id: string) => void;
  compact?: boolean;
  emptyHint?: string;
};

export function SearchGraph({ nodes, currentId, solutionIds, onSelect, compact, emptyHint }: Props) {
  const reducedMotion = usePrefersReducedMotion();
  const solution = useMemo(() => new Set(solutionIds), [solutionIds]);
  const layout = useMemo(
    () => layoutSearchGraph(nodes, currentId, solution),
    [nodes, currentId, solution],
  );
  const byId = useMemo(() => new Map(layout.nodes.map((node) => [node.id, node])), [layout.nodes]);
  const focus = layout.nodes.find((node) => node.id === currentId);
  const pathSet = solution;
  const hasPath = pathSet.size > 0;

  const viewBox = useMemo(() => {
    if (!focus || (layout.width <= 760 && layout.height <= 540)) {
      return `0 0 ${layout.width} ${layout.height}`;
    }
    const vw = Math.min(layout.width, 720);
    const vh = Math.min(layout.height, 480);
    const x = clamp(-24, layout.width - vw + 24, focus.x - vw / 2);
    const y = clamp(-24, layout.height - vh + 24, focus.y - vh / 2);
    return `${x} ${y} ${vw} ${vh}`;
  }, [focus, layout.height, layout.width]);

  return (
    <div className="flex h-full min-h-[240px] flex-col">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-faint">State space</p>
          {!compact && (
            <p className="mt-1 text-sm text-mute">Each node is a push. The gold path is the route home.</p>
          )}
        </div>
        <SearchLegend />
      </div>
      <div className="relative min-h-0 flex-1 overflow-hidden rounded-2xl bg-[radial-gradient(ellipse_at_center,_rgba(215,179,106,0.07),_transparent_62%)]">
        {layout.nodes.length === 0 ? (
          <div className="grid h-full min-h-[220px] place-items-center text-center text-sm text-mute">
            {emptyHint ?? "The search tree will grow here."}
          </div>
        ) : (
          <svg
            role="img"
            aria-label="Search graph"
            viewBox={viewBox}
            className="h-full min-h-[240px] w-full"
          >
            {layout.nodes.map((node) => {
              if (!node.parentId) return null;
              const parent = byId.get(node.parentId);
              if (!parent) return null;
              const onPath = pathSet.has(node.id) && pathSet.has(parent.id);
              const active = node.id === currentId || parent.id === currentId;
              return (
                <SearchEdge
                  key={`${parent.id}-${node.id}`}
                  x1={parent.x}
                  y1={parent.y}
                  x2={node.x}
                  y2={node.y}
                  solution={onPath}
                  active={active}
                  reducedMotion={reducedMotion}
                />
              );
            })}
            {layout.nodes.map((node) => (
              <SearchNode
                key={node.id}
                node={node}
                current={node.id === currentId}
                onPath={pathSet.has(node.id)}
                dim={hasPath}
                reducedMotion={reducedMotion}
                onSelect={onSelect}
              />
            ))}
          </svg>
        )}
      </div>
    </div>
  );
}

function clamp(min: number, max: number, value: number): number {
  return Math.max(min, Math.min(max, value));
}
