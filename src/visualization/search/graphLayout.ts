import type { SearchNode } from "@/engine/search/types";

export type LayoutNode = {
  id: string;
  x: number;
  y: number;
  depth: number;
  status: SearchNode["status"];
  g: number;
  h: number;
  f: number;
  parentId?: string;
  hiddenCount?: number;
};

export type GraphLayout = {
  nodes: LayoutNode[];
  width: number;
  height: number;
};

const MAX_VISIBLE = 220;
const X_GAP = 28;
const Y_GAP = 46;

export function layoutSearchGraph(
  nodes: SearchNode[],
  currentId: string | null,
  solutionIds: Set<string>,
): GraphLayout {
  if (nodes.length === 0) {
    return { nodes: [], width: 320, height: 240 };
  }

  const selected = selectVisible(nodes, currentId, solutionIds);
  const byDepth = new Map<number, SearchNode[]>();
  for (const node of selected) {
    const depth = node.g;
    const list = byDepth.get(depth) ?? [];
    list.push(node);
    byDepth.set(depth, list);
  }

  const depths = [...byDepth.keys()].sort((a, b) => a - b);
  const laid: LayoutNode[] = [];
  let maxX = 0;

  for (const depth of depths) {
    const row = (byDepth.get(depth) ?? []).sort((a, b) => a.discoveryIndex - b.discoveryIndex);
    const y = 28 + depth * Y_GAP;
    for (let i = 0; i < row.length; i += 1) {
      const node = row[i]!;
      const x = 40 + i * X_GAP;
      maxX = Math.max(maxX, x);
      laid.push({
        id: node.id,
        x,
        y,
        depth,
        status: solutionIds.has(node.id) && node.status !== "evaluating" ? "solution" : node.status,
        g: node.g,
        h: node.h,
        f: node.f,
        parentId: node.parentId,
      });
    }
  }

  const hidden = nodes.length - selected.length;
  if (hidden > 0 && laid.length > 0) {
    const last = laid[laid.length - 1]!;
    laid.push({
      id: "__agg",
      x: last.x + 48,
      y: last.y,
      depth: last.depth,
      status: "pruned",
      g: last.g,
      h: 0,
      f: 0,
      hiddenCount: hidden,
    });
    maxX = Math.max(maxX, last.x + 48);
  }

  const maxY = laid.reduce((m, n) => Math.max(m, n.y), 0);
  return {
    nodes: laid,
    width: Math.max(320, maxX + 48),
    height: Math.max(240, maxY + 48),
  };
}

function selectVisible(
  nodes: SearchNode[],
  currentId: string | null,
  solutionIds: Set<string>,
): SearchNode[] {
  if (nodes.length <= MAX_VISIBLE) return nodes;

  const byId = new Map(nodes.map((node) => [node.id, node]));
  const keep = new Map<string, SearchNode>();
  const take = (id: string | null | undefined) => {
    if (!id) return;
    const node = byId.get(id);
    if (node) keep.set(id, node);
  };

  take(currentId);
  for (const id of solutionIds) take(id);

  let cursor = currentId ? byId.get(currentId) : undefined;
  while (cursor?.parentId) {
    take(cursor.parentId);
    cursor = byId.get(cursor.parentId);
  }

  const ranked = [...nodes].sort((a, b) => b.discoveryIndex - a.discoveryIndex);
  for (const node of ranked) {
    if (keep.size >= MAX_VISIBLE) break;
    if (node.status === "deadlock" && keep.size > MAX_VISIBLE * 0.8) continue;
    keep.set(node.id, node);
  }

  return [...keep.values()];
}
