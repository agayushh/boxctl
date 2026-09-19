import type { Action, Position } from "@/utils/coordinates";

export type { Action, Position };

export type CellKind =
  | "wall"
  | "floor"
  | "goal"
  | "player"
  | "box"
  | "box-on-goal"
  | "player-on-goal";

export type Board = {
  readonly width: number;
  readonly height: number;
  readonly walls: ReadonlySet<number>;
  readonly goals: ReadonlySet<number>;
  readonly floors: ReadonlySet<number>;
  readonly deadSquares: ReadonlySet<number>;
};

export type SokobanState = {
  readonly player: number;
  readonly boxes: ReadonlySet<number>;
};

export type MoveResult = {
  valid: boolean;
  state?: SokobanState;
  action: Action;
  pushedBox?: number;
  pushedTo?: number;
  reason?: string;
};

export type PushSuccessor = {
  state: SokobanState;
  action: Action;
  pushedFrom: number;
  pushedTo: number;
  playerWalks: number;
};

export type DeadlockInfo = {
  detected: boolean;
  type?: string;
  affectedBoxes?: number[];
  explanation?: string;
};

export type LevelDefinition = {
  id: string;
  number: number;
  name: string;
  title: string;
  description: string;
  ascii: string;
  difficulty: "tutorial" | "basic" | "intermediate" | "hard" | "expert" | "custom";
};

export type ParsedLevel = {
  board: Board;
  state: SokobanState;
  ascii: string;
};

export type ValidationIssue = {
  code: string;
  message: string;
};

export type ValidationResult = {
  ok: boolean;
  issues: ValidationIssue[];
};
