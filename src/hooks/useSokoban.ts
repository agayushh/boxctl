import { useEffect, useMemo, useState } from "react";
import { ACTIONS, oppositeAction, stepPacked, type Action } from "@/utils/coordinates";
import type { Board, SokobanState } from "@/engine/sokoban/types";
import type { SolutionStep } from "@/engine/search/types";
import { tryMove, walkActions } from "@/engine/sokoban/moves";
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

  const applyMoves = (actions: Action[]): boolean => {
    if (actions.length === 0) return false;
    let current = state;
    let nextMoves = moves;
    let nextPushes = pushes;
    let nextSteps = steps;
    let walks = walksSincePush;
    for (const action of actions) {
      const result = tryMove(current, board, action);
      if (!result.valid || !result.state) return false;
      current = result.state;
      nextMoves += 1;
      if (result.pushedBox !== undefined && result.pushedTo !== undefined) {
        nextPushes += 1;
        nextSteps = [
          ...nextSteps,
          {
            action,
            pushedFrom: result.pushedBox,
            pushedTo: result.pushedTo,
            playerWalks: walks,
          },
        ];
        walks = 0;
      } else {
        walks += 1;
      }
    }
    setState(current);
    setMoves(nextMoves);
    setPushes(nextPushes);
    setSteps(nextSteps);
    setWalksSincePush(walks);
    return true;
  };

  const move = (action: Action): boolean => applyMoves([action]);

  const click = (cell: number): boolean => {
    if (cell === state.player) return false;
    if (state.boxes.has(cell)) {
      for (const action of ACTIONS) {
        if (stepPacked(state.player, action) === cell) return move(action);
      }
      let best: Action[] | null = null;
      for (const action of ACTIONS) {
        const stand = stepPacked(cell, oppositeAction(action));
        const walk = walkActions(state, board, stand);
        if (walk && (best == null || walk.length < best.length)) best = walk;
      }
      return best ? applyMoves(best) : false;
    }
    const walk = walkActions(state, board, cell);
    return walk ? applyMoves(walk) : false;
  };

  const solved = useMemo(() => isSolved(state, board), [state, board]);

  return { state, moves, pushes, steps, move, click, reset, solved };
}
