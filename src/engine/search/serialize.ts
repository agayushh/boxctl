import type { Board, SokobanState } from "@/engine/sokoban/types";
import type { AlgorithmId, SearchProgress, SolverRequest } from "@/engine/search/types";

export type WireBoard = {
  width: number;
  height: number;
  walls: number[];
  goals: number[];
  floors: number[];
  deadSquares: number[];
};

export type WireState = {
  player: number;
  boxes: number[];
};

export type WireRequest = Omit<SolverRequest, "board" | "state"> & {
  board: WireBoard;
  state: WireState;
};

export function serializeBoard(board: Board): WireBoard {
  return {
    width: board.width,
    height: board.height,
    walls: [...board.walls],
    goals: [...board.goals],
    floors: [...board.floors],
    deadSquares: [...board.deadSquares],
  };
}

export function deserializeBoard(wire: WireBoard): Board {
  return {
    width: wire.width,
    height: wire.height,
    walls: new Set(wire.walls),
    goals: new Set(wire.goals),
    floors: new Set(wire.floors),
    deadSquares: new Set(wire.deadSquares),
  };
}

export function serializeState(state: SokobanState): WireState {
  return { player: state.player, boxes: [...state.boxes] };
}

export function deserializeState(wire: WireState): SokobanState {
  return { player: wire.player, boxes: new Set(wire.boxes) };
}

export type WorkerIn = {
  requestId: number;
  algorithm: AlgorithmId;
  heuristicId?: string;
  maxNodes?: number;
  beamWidth?: number;
  board: WireBoard;
  state: WireState;
};

export type WorkerOut = {
  requestId: number;
  result?: import("@/engine/search/types").SolverResult;
  progress?: SearchProgress;
};
