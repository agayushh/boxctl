import type { Action } from "@/utils/coordinates";
import type { Board, DeadlockInfo, SokobanState } from "@/engine/sokoban/types";

export type AlgorithmId = "astar" | "bfs" | "greedy" | "idastar" | "beam";

export type NodeStatus =
  | "discovered"
  | "frontier"
  | "evaluating"
  | "expanded"
  | "deadlock"
  | "pruned"
  | "solution";

export type SearchNode = {
  id: string;
  state: SokobanState;
  g: number;
  h: number;
  f: number;
  parentId?: string;
  action?: Action;
  pushedFrom?: number;
  pushedTo?: number;
  playerWalks: number;
  status: NodeStatus;
  deadlock?: DeadlockInfo;
  depth: number;
  discoveryIndex: number;
};

export type SearchEvent =
  | {
      type: "STATE_DISCOVERED";
      nodeId: string;
      parentId?: string;
      action?: Action;
      g: number;
      h: number;
      f: number;
    }
  | {
      type: "STATE_EVALUATED";
      nodeId: string;
      reason: string;
      alternatives: Alternative[];
    }
  | {
      type: "STATE_EXPANDED";
      nodeId: string;
    }
  | {
      type: "DEADLOCK";
      nodeId: string;
      reason: string;
    }
  | {
      type: "PRUNED";
      nodeId: string;
      reason: string;
    }
  | {
      type: "SOLUTION";
      nodeId: string;
    }
  | {
      type: "BOUND";
      bound: number;
      iteration: number;
    }
  | {
      type: "SEARCH_COMPLETE";
    };

export type Alternative = {
  nodeId?: string;
  action?: Action;
  g?: number;
  h?: number;
  f?: number;
  status?: NodeStatus | "deadlock";
  label: string;
};

export type SearchStats = {
  algorithm: AlgorithmId;
  heuristic: string;
  statesGenerated: number;
  statesExpanded: number;
  statesPruned: number;
  deadlocksDetected: number;
  peakFrontier: number;
  solutionPushes: number | null;
  playerMoves: number | null;
  elapsedMs: number;
  boundIterations?: number;
};

export type SolutionStep = {
  action: Action;
  pushedFrom: number;
  pushedTo: number;
  playerWalks: number;
};

export type Solution = {
  nodeId: string;
  pushes: Action[];
  steps: SolutionStep[];
  playerMoves: number;
  pathIds: string[];
};

export type Heuristic = {
  name: string;
  id: string;
  estimate: (state: SokobanState, board: Board) => number;
  explain?: (state: SokobanState, board: Board) => HeuristicBreakdown;
};

export type HeuristicBreakdown = {
  value: number;
  pairs: Array<{ box: number; goal: number; dist: number }>;
};

export type SolverMode = "instant" | "visualization";

export type SolverRequest = {
  board: Board;
  state: SokobanState;
  algorithm: AlgorithmId;
  heuristicId?: string;
  mode?: SolverMode;
  maxNodes?: number;
  beamWidth?: number;
  onProgress?: (progress: SearchProgress) => void;
};

export type SearchProgress = {
  statesGenerated: number;
  statesExpanded: number;
  deadlocksDetected: number;
  peakFrontier: number;
  elapsedMs?: number;
  state?: SokobanState;
  action?: Action;
  g?: number;
  h?: number;
  f?: number;
  steps?: SolutionStep[];
};

export type SolverResult = {
  events: SearchEvent[];
  nodes: SearchNode[];
  stats: SearchStats;
  solution: Solution | null;
  failedReason?: string;
};
