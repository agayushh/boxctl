export type { Action, Position } from "@/engine/sokoban/types";
export type {
  Board,
  CellKind,
  DeadlockInfo,
  LevelDefinition,
  MoveResult,
  ParsedLevel,
  PushSuccessor,
  SokobanState,
  ValidationIssue,
  ValidationResult,
} from "@/engine/sokoban/types";

export { createBoard, cellKind, isBlocked, isGoal, isWall } from "@/engine/sokoban/board";
export {
  cloneState,
  createState,
  describeState,
  deserializeState,
  hashState,
  serializeState,
  statesEqual,
} from "@/engine/sokoban/state";
export {
  applyActions,
  applyPushSteps,
  expandPushesToWalks,
  generatePushes,
  pathSolves,
  pushPathSolves,
  playerWalkLength,
  reachablePlayerCells,
  tryMove,
} from "@/engine/sokoban/moves";
export { parseLevel, stringifyLevel } from "@/engine/sokoban/parser";
export { validateLevel } from "@/engine/sokoban/validator";
export {
  computeSimpleDeadSquares,
  detectCornerDeadlock,
  detectDeadlock,
  detectFreezeDeadlock,
  detectUnsolvableAssignment,
  detectWallDeadlock,
  isCorner,
} from "@/engine/sokoban/deadlocks";
export { boxesOnGoals, emptyGoals, isSolved, misplacedBoxes } from "@/engine/sokoban/goals";
