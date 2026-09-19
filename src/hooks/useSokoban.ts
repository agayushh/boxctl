import { useMemo, useState } from "react";
import type { Action } from "@/utils/coordinates";
import type { Board, SokobanState } from "@/engine/sokoban/types";
import { tryMove } from "@/engine/sokoban/moves";
import { isSolved } from "@/engine/sokoban/goals";
import { cloneState } from "@/engine/sokoban/state";

export function useSokoban(board: Board, initial: SokobanState) {
  const [state, setState] = useState<SokobanState>(initial);
  const [moves, setMoves] = useState<Action[]>([]);

  const reset = (next = initial) => {
    setState(cloneState(next));
    setMoves([]);
  };

  const move = (action: Action): boolean => {
    const result = tryMove(state, board, action);
    if (!result.valid || !result.state) return false;
    setState(result.state);
    setMoves((current) => [...current, action]);
    return true;
  };

  const solved = useMemo(() => isSolved(state, board), [state, board]);

  return { state, setState, moves, move, reset, solved };
}
