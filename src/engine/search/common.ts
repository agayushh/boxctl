import { ACTION_GLYPH } from "@/utils/coordinates";
import type { Action } from "@/utils/coordinates";
import { hashState } from "@/engine/sokoban/state";
import { generatePushes } from "@/engine/sokoban/moves";
import { detectDeadlock } from "@/engine/sokoban/deadlocks";
import { isSolved } from "@/engine/sokoban/goals";
import type { Board, SokobanState } from "@/engine/sokoban/types";
import type { Alternative, Heuristic, SearchNode, Solution } from "@/engine/search/types";
import type { SearchRecorder } from "@/engine/search/recorder";

export function makeNode(
  recorder: SearchRecorder,
  input: {
    state: SokobanState;
    board: Board;
    heuristic: Heuristic;
    g: number;
    parentId?: string;
    action?: Action;
    pushedFrom?: number;
    pushedTo?: number;
    playerWalks?: number;
  },
): SearchNode {
  const id = hashState(input.state);
  const h = input.heuristic.estimate(input.state, input.board);
  return {
    id,
    state: input.state,
    g: input.g,
    h,
    f: input.g + h,
    parentId: input.parentId,
    action: input.action,
    pushedFrom: input.pushedFrom,
    pushedTo: input.pushedTo,
    playerWalks: input.playerWalks ?? 0,
    status: "discovered",
    depth: input.g,
    discoveryIndex: recorder.nextDiscovery(),
  };
}

export function reconstruct(recorder: SearchRecorder, endId: string): Solution {
  const pushes: Action[] = [];
  const steps: Solution["steps"] = [];
  const pathIds: string[] = [];
  let playerMoves = 0;
  let current = recorder.get(endId);
  while (current) {
    pathIds.push(current.id);
    if (current.action && current.pushedFrom !== undefined && current.pushedTo !== undefined) {
      pushes.push(current.action);
      steps.push({
        action: current.action,
        pushedFrom: current.pushedFrom,
        pushedTo: current.pushedTo,
        playerWalks: current.playerWalks,
      });
      playerMoves += current.playerWalks + 1;
    }
    current = current.parentId ? recorder.get(current.parentId) : undefined;
  }
  pathIds.reverse();
  pushes.reverse();
  steps.reverse();
  return { nodeId: endId, pushes, steps, playerMoves, pathIds };
}

export function expand(
  recorder: SearchRecorder,
  board: Board,
  heuristic: Heuristic,
  node: SearchNode,
): SearchNode[] {
  const children: SearchNode[] = [];
  const successors = generatePushes(node.state, board);
  for (const successor of successors) {
    const child = makeNode(recorder, {
      state: successor.state,
      board,
      heuristic,
      g: node.g + 1,
      parentId: node.id,
      action: successor.action,
      pushedFrom: successor.pushedFrom,
      pushedTo: successor.pushedTo,
      playerWalks: successor.playerWalks,
    });
    const deadlock = detectDeadlock(child.state, board);
    if (deadlock.detected) {
      child.deadlock = deadlock;
      recorder.discovered(child);
      recorder.deadlock(child, deadlock.explanation ?? "Deadlock detected.");
      continue;
    }
    children.push(child);
  }
  return children;
}

export function solved(node: SearchNode, board: Board): boolean {
  return isSolved(node.state, board);
}

export function peekAlternatives(
  nodes: SearchNode[],
  extra: Alternative[] = [],
  limit = 4,
): Alternative[] {
  const listed = nodes.slice(0, limit).map((node) => ({
    nodeId: node.id,
    action: node.action,
    g: node.g,
    h: node.h,
    f: node.f,
    status: node.status,
    label: node.action
      ? `Push ${ACTION_GLYPH[node.action]}  f=${node.f}`
      : `f=${node.f}`,
  }));
  return [...listed, ...extra].slice(0, limit);
}

export function lowestFReason(algorithm: string): string {
  if (algorithm === "bfs") {
    return "BFS selected this state because it was discovered earliest. It does not use a heuristic.";
  }
  if (algorithm === "greedy") {
    return "Greedy best-first selected this state because it currently has the lowest heuristic h(n). Path cost is ignored.";
  }
  if (algorithm === "idastar") {
    return "IDA* is walking a depth-first path under the current f-bound. This state is within the bound.";
  }
  if (algorithm === "beam") {
    return "Beam search kept this state because it ranked among the best f(n) values in the current beam.";
  }
  return "A* selected this state because it currently has the lowest f(n) = g(n) + h(n).";
}
