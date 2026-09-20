import { generatePushes } from "@/engine/sokoban/moves";
import { detectSearchDeadlock } from "@/engine/sokoban/deadlocks";
import { isSolved } from "@/engine/sokoban/goals";
import { getHeuristic } from "@/engine/search/heuristics";
import { ACTION_GLYPH } from "@/utils/coordinates";
import type { Action } from "@/utils/coordinates";
import type { AlgorithmId, SolutionStep } from "@/engine/search/types";
import type { Board, SokobanState } from "@/engine/sokoban/types";

export const STORY_CELL = 8;
export const STORY_PAD = 8;
export const STORY_SPINE_WINDOW = 6;

export type StoryKind = "path" | "frontier";

export type StoryNode = {
  id: string;
  kind: StoryKind;
  state: SokobanState;
  g: number;
  h: number;
  f: number;
  x: number;
  y: number;
  action?: Action;
  label: string;
  current?: boolean;
  chosen?: boolean;
  deadlock?: boolean;
  solved?: boolean;
  scoreTag?: string;
};

export type StoryEdge = {
  from: string;
  to: string;
  gold: boolean;
  active: boolean;
};

export type StoryLayout = {
  nodes: StoryNode[];
  edges: StoryEdge[];
  width: number;
  height: number;
  currentId: string;
  glyphW: number;
  glyphH: number;
  revealed: number;
  frontierCount: number;
};

export function glyphSize(board: Board) {
  return {
    w: board.width * STORY_CELL + STORY_PAD,
    h: board.height * STORY_CELL + STORY_PAD,
  };
}

function boxesEqual(a: SokobanState, b: SokobanState): boolean {
  if (a.boxes.size !== b.boxes.size) return false;
  for (const box of a.boxes) {
    if (!b.boxes.has(box)) return false;
  }
  return true;
}

export function layoutStory(
  board: Board,
  frames: SokobanState[],
  steps: SolutionStep[],
  index: number,
  algorithm: AlgorithmId = "astar",
): StoryLayout {
  const { w: gw, h: gh } = glyphSize(board);
  const heuristic = getHeuristic();
  const revealed = Math.max(1, Math.min(index + 1, Math.max(1, frames.length)));
  const path = frames.slice(0, revealed);
  const currentIndex = path.length - 1;
  const current = path[currentIndex] ?? frames[0];
  if (!current) {
    return {
      nodes: [],
      edges: [],
      width: 420,
      height: 280,
      currentId: "path-0",
      glyphW: gw,
      glyphH: gh,
      revealed: 0,
      frontierCount: 0,
    };
  }

  const windowStart = Math.max(0, path.length - STORY_SPINE_WINDOW);
  const visible = path.map((state, i) => ({ state, i })).slice(windowStart);
  const next = frames[currentIndex + 1];
  const pushes = !isSolved(current, board) ? generatePushes(current, board) : [];
  const scored = pushes
    .map((push, k) => {
      const hVal = heuristic.estimate(push.state, board);
      const g = currentIndex + 1;
      const deadlock = detectSearchDeadlock(push.state, board).detected;
      return {
        id: `alt-${currentIndex}-${k}`,
        state: push.state,
        action: push.action,
        g,
        h: hVal,
        f: g + hVal,
        chosen: next ? boxesEqual(push.state, next) : false,
        deadlock,
      };
    })
    .sort((a, b) => {
      if (a.chosen !== b.chosen) return a.chosen ? -1 : 1;
      if (a.deadlock !== b.deadlock) return a.deadlock ? 1 : -1;
      return optionScore(algorithm, a) - optionScore(algorithm, b);
    })
    .slice(0, 4);

  const xGap = gw + 44;
  const yGap = gh + 28;
  const fan = Math.max(0, scored.length - 1);
  const pathY = 40 + gh / 2 + (fan * yGap) / 2;
  const nodes: StoryNode[] = [];

  visible.forEach((item, slot) => {
    const hVal = heuristic.estimate(item.state, board);
    const g = item.i;
    nodes.push({
      id: `path-${item.i}`,
      kind: "path",
      state: item.state,
      g,
      h: hVal,
      f: g + hVal,
      x: 36 + gw / 2 + slot * xGap,
      y: pathY,
      action: item.i > 0 ? steps[item.i - 1]?.action : undefined,
      label: item.i === 0 ? "start" : `${item.i}`,
      current: item.i === currentIndex,
      solved: isSolved(item.state, board),
    });
  });

  const currentNode = nodes.find((node) => node.current) ?? nodes[nodes.length - 1];
  const cx = currentNode?.x ?? 36 + gw / 2;
  const cy = currentNode?.y ?? pathY;
  const altX = cx + gw / 2 + 40 + gw / 2;
  const altStartY = cy - (fan * yGap) / 2;

  scored.forEach((alt, k) => {
    nodes.push({
      id: alt.id,
      kind: "frontier",
      state: alt.state,
      g: alt.g,
      h: alt.h,
      f: alt.f,
      x: altX,
      y: altStartY + k * yGap,
      action: alt.action,
      label: alt.deadlock ? "stuck" : alt.chosen ? "next" : ACTION_GLYPH[alt.action],
      chosen: alt.chosen,
      deadlock: alt.deadlock,
      scoreTag: alt.deadlock || alt.chosen ? undefined : optionTag(algorithm, alt),
    });
  });

  const edges: StoryEdge[] = [];
  for (let i = 1; i < visible.length; i += 1) {
    const from = visible[i - 1]!.i;
    const to = visible[i]!.i;
    edges.push({
      from: `path-${from}`,
      to: `path-${to}`,
      gold: true,
      active: to === currentIndex,
    });
  }
  if (currentNode) {
    for (const alt of scored) {
      edges.push({
        from: currentNode.id,
        to: alt.id,
        gold: alt.chosen,
        active: alt.chosen,
      });
    }
  }

  const maxX = nodes.reduce((m, n) => Math.max(m, n.x + gw / 2), gw);
  const maxY = nodes.reduce((m, n) => Math.max(m, n.y + gh / 2), gh);
  return {
    nodes,
    edges,
    width: Math.max(360, maxX + 40),
    height: Math.max(220, maxY + 40),
    currentId: currentNode?.id ?? "path-0",
    glyphW: gw,
    glyphH: gh,
    revealed,
    frontierCount: scored.length,
  };
}

function optionScore(
  algorithm: AlgorithmId,
  alt: { g: number; h: number; f: number },
): number {
  if (algorithm === "bfs") return alt.g;
  if (algorithm === "greedy") return alt.h;
  return alt.f;
}

function optionTag(
  algorithm: AlgorithmId,
  alt: { g: number; h: number; f: number },
): string {
  if (algorithm === "bfs") return "";
  if (algorithm === "greedy") return `h ${alt.h}`;
  return `f ${alt.f}`;
}
