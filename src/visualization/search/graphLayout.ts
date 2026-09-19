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

const MAX_VISIBLE = 140;
const X_GAP = 62;
const Y_GAP = 32;

export function layoutSearchGraph(
  nodes: SearchNode[],
  currentId: string | null,
  solutionIds: Set<string>,
): GraphLayout {
  if (nodes.length === 0) {
    return { nodes: [], width: 320, height: 240 };
  }

  const selected = selectVisible(nodes, currentId, solutionIds);
  const byId = new Map(selected.map((node) => [node.id, node]));
  const children = new Map<string, SearchNode[]>();
  const roots: SearchNode[] = [];

  for (const node of selected) {
    if (node.parentId && byId.has(node.parentId)) {
      const list = children.get(node.parentId) ?? [];
      list.push(node);
      children.set(node.parentId, list);
    } else {
      roots.push(node);
    }
  }
  for (const list of children.values()) {
    list.sort((a, b) => a.discoveryIndex - b.discoveryIndex);
  }
  roots.sort((a, b) => a.discoveryIndex - b.discoveryIndex);

  const laid: LayoutNode[] = [];
  let cursorY = 40;

  const place = (node: SearchNode, depth: number): number => {
    const kids = children.get(node.id) ?? [];
    const x = 48 + depth * X_GAP;
    if (kids.length === 0) {
      const y = cursorY;
      cursorY += Y_GAP;
      laid.push(toLayout(node, x, y, depth, solutionIds));
      return y;
    }
    const ys = kids.map((child) => place(child, depth + 1));
    const y = (ys[0]! + ys[ys.length - 1]!) / 2;
    laid.push(toLayout(node, x, y, depth, solutionIds));
    return y;
  };

  for (const root of roots) place(root, 0);

  const hidden = nodes.length - selected.length;
  if (hidden > 0 && laid.length > 0) {
    const last = laid[laid.length - 1]!;
    laid.push({
      id: "__agg",
      x: last.x + 56,
      y: last.y + 28,
      depth: last.depth,
      status: "pruned",
      g: last.g,
      h: 0,
      f: 0,
      hiddenCount: hidden,
    });
  }

  const maxX = laid.reduce((m, n) => Math.max(m, n.x), 0);
  const maxY = laid.reduce((m, n) => Math.max(m, n.y), 0);
  return {
    nodes: laid,
    width: Math.max(420, maxX + 72),
    height: Math.max(280, maxY + 56),
  };
}

function toLayout(
  node: SearchNode,
  x: number,
  y: number,
  depth: number,
  solutionIds: Set<string>,
): LayoutNode {
  return {
    id: node.id,
    x,
    y,
    depth,
    status: solutionIds.has(node.id) && node.status !== "evaluating" ? "solution" : node.status,
    g: node.g,
    h: node.h,
    f: node.f,
    parentId: node.parentId,
  };
}

function selectVisible(
  nodes: SearchNode[],
  currentId: string | null,
  solutionIds: Set<string>,
): SearchNode[] {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const keep = new Map<string, SearchNode>();

  const takeChain = (id: string | null | undefined) => {
    let cursor = id ? byId.get(id) : undefined;
    while (cursor) {
      keep.set(cursor.id, cursor);
      cursor = cursor.parentId ? byId.get(cursor.parentId) : undefined;
    }
  };

  takeChain(currentId);
  for (const id of solutionIds) takeChain(id);

  const ordered = [...nodes].sort((a, b) => a.discoveryIndex - b.discoveryIndex);
  for (const node of ordered) {
    if (keep.size >= MAX_VISIBLE) break;
    if (keep.has(node.id)) continue;
    if (!node.parentId || keep.has(node.parentId) || !byId.has(node.parentId)) {
      keep.set(node.id, node);
    }
  }

  return [...keep.values()];
}
