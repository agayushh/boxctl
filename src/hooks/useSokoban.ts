import { useEffect, useMemo, useState } from "react";
import type { Action } from "@/utils/coordinates";
import type { Board, SokobanState } from "@/engine/sokoban/types";
import type { SolutionStep } from "@/engine/search/types";
import { tryMove } from "@/engine/sokoban/moves";
import { isSolved } from "@/engine/sokoban/goals";
import { cloneState } from "@/engine/sokoban/state";

export function useSokoban(board: Board, initial: SokobanState) {
  const [state, setState] = useState<SokobanState>(() => cloneState(initial));
  const [moves, setMoves] = useState(0);
  const [pushes, setPushes] = useState(0);
  const [steps, setSteps] = useState<SolutionStep[]>([]);
  const [walksSincePush, setWalksSincePush] = useState(0);

  useEffect(() => {
    setState(cloneState(initial));
    setMoves(0);
    setPushes(0);
    setSteps([]);
    setWalksSincePush(0);
  }, [initial]);

  const reset = () => {
    setState(cloneState(initial));
    setMoves(0);
    setPushes(0);
    setSteps([]);
    setWalksSincePush(0);
  };

  const move = (action: Action): boolean => {
    const result = tryMove(state, board, action);
    if (!result.valid || !result.state) return false;
    setState(result.state);
    setMoves((count) => count + 1);
    if (result.pushedBox !== undefined && result.pushedTo !== undefined) {
      setPushes((count) => count + 1);
      setSteps((current) => [
        ...current,
        {
          action,
          pushedFrom: result.pushedBox!,
          pushedTo: result.pushedTo!,
          playerWalks: walksSincePush,
        },
      ]);
      setWalksSincePush(0);
    } else {
      setWalksSincePush((count) => count + 1);
    }
    return true;
  };

  const solved = useMemo(() => isSolved(state, board), [state, board]);

  return { state, moves, pushes, steps, move, reset, solved };
}
