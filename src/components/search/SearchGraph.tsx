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
};

export function SearchGraph({ nodes, currentId, solutionIds, onSelect, compact }: Props) {
  const reducedMotion = usePrefersReducedMotion();
  const solution = useMemo(() => new Set(solutionIds), [solutionIds]);
  const layout = useMemo(
    () => layoutSearchGraph(nodes, currentId, solution),
    [nodes, currentId, solution],
  );
  const byId = useMemo(() => new Map(layout.nodes.map((node) => [node.id, node])), [layout.nodes]);

  return (
    <div className="flex h-full min-h-[240px] flex-col">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-faint">Search space</p>
          {!compact && (
            <p className="mt-1 text-sm text-mute">Each node is a push — not a footstep.</p>
          )}
        </div>
        <SearchLegend />
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        <svg
          role="img"
          aria-label="Search graph"
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          className="h-full min-h-[220px] w-full"
        >
          {layout.nodes.map((node) => {
            if (!node.parentId) return null;
            const parent = byId.get(node.parentId);
            if (!parent) return null;
            const onPath = solution.has(node.id) && solution.has(parent.id);
            return (
              <SearchEdge
                key={`${parent.id}-${node.id}`}
                x1={parent.x}
                y1={parent.y}
                x2={node.x}
                y2={node.y}
                solution={onPath}
                reducedMotion={reducedMotion}
              />
            );
          })}
          {layout.nodes.map((node) => (
            <SearchNode
              key={node.id}
              node={node}
              current={node.id === currentId}
              reducedMotion={reducedMotion}
              onSelect={onSelect}
            />
          ))}
        </svg>
      </div>
    </div>
  );
}
