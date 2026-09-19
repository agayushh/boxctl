import type { Alternative, SearchEvent, SearchNode, SearchStats, Solution } from "@/engine/search/types";

export type PlaybackFrame = {
  cursor: number;
  currentId: string | null;
  nodes: Map<string, SearchNode>;
  stats: SearchStats;
  solution: Solution | null;
  reason: string;
  alternatives: Alternative[];
  deadlockReason: string | null;
  bound?: number;
  complete: boolean;
};

export function emptyFrame(stats: SearchStats): PlaybackFrame {
  return {
    cursor: -1,
    currentId: null,
    nodes: new Map(),
    stats: { ...stats, statesGenerated: 0, statesExpanded: 0, statesPruned: 0, deadlocksDetected: 0, peakFrontier: 0 },
    solution: null,
    reason: "Search has not started.",
    alternatives: [],
    deadlockReason: null,
    complete: false,
  };
}

export function applyEvents(
  events: SearchEvent[],
  sourceNodes: SearchNode[],
  stats: SearchStats,
  solution: Solution | null,
  cursor: number,
): PlaybackFrame {
  const byId = new Map(sourceNodes.map((node) => [node.id, node]));
  const nodes = new Map<string, SearchNode>();
  const frame: PlaybackFrame = emptyFrame(stats);
  const end = Math.min(cursor, events.length - 1);

  for (let i = 0; i <= end; i += 1) {
    const event = events[i];
    if (!event) continue;
    frame.cursor = i;
    switch (event.type) {
      case "STATE_DISCOVERED": {
        const src = byId.get(event.nodeId);
        if (!src) break;
        nodes.set(event.nodeId, { ...src, status: src.status === "solution" ? "discovered" : "discovered" });
        frame.stats.statesGenerated += 1;
        break;
      }
      case "STATE_EVALUATED": {
        const node = nodes.get(event.nodeId) ?? byId.get(event.nodeId);
        if (node) nodes.set(event.nodeId, { ...node, status: "evaluating" });
        frame.currentId = event.nodeId;
        frame.reason = event.reason;
        frame.alternatives = event.alternatives;
        frame.deadlockReason = null;
        break;
      }
      case "STATE_EXPANDED": {
        const node = nodes.get(event.nodeId);
        if (node) nodes.set(event.nodeId, { ...node, status: "expanded" });
        frame.stats.statesExpanded += 1;
        break;
      }
      case "DEADLOCK": {
        const node = nodes.get(event.nodeId) ?? byId.get(event.nodeId);
        if (node) nodes.set(event.nodeId, { ...node, status: "deadlock" });
        frame.stats.deadlocksDetected += 1;
        frame.deadlockReason = event.reason;
        frame.currentId = event.nodeId;
        break;
      }
      case "PRUNED": {
        const existing = nodes.get(event.nodeId);
        if (existing && existing.status !== "expanded" && existing.status !== "evaluating" && existing.status !== "solution") {
          nodes.set(event.nodeId, { ...existing, status: "pruned" });
        }
        frame.stats.statesPruned += 1;
        break;
      }
      case "SOLUTION": {
        frame.solution = solution;
        if (solution) {
          for (const id of solution.pathIds) {
            const node = nodes.get(id) ?? byId.get(id);
            if (node) nodes.set(id, { ...node, status: "solution" });
          }
          frame.currentId = solution.nodeId;
        }
        break;
      }
      case "BOUND":
        frame.bound = event.bound;
        break;
      case "SEARCH_COMPLETE":
        frame.complete = true;
        if (solution) frame.solution = solution;
        break;
    }
  }

  if (solution && (frame.complete || (end >= 0 && events[end]?.type === "SOLUTION"))) {
    frame.stats.solutionPushes = stats.solutionPushes;
    frame.stats.playerMoves = stats.playerMoves;
  }
  frame.stats.elapsedMs = stats.elapsedMs;
  frame.stats.peakFrontier = stats.peakFrontier;
  frame.stats.algorithm = stats.algorithm;
  frame.stats.heuristic = stats.heuristic;
  frame.nodes = nodes;
  return frame;
}
