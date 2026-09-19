import { useMemo, useState } from "react";
import { pack, unpack } from "@/utils/coordinates";
import { createBoard } from "@/engine/sokoban/board";
import { createState } from "@/engine/sokoban/state";
import { stringifyLevel } from "@/engine/sokoban/parser";
import { validateLevel } from "@/engine/sokoban/validator";
import { randomLevel } from "@/engine/sokoban/random";
import { emptyGrid } from "@/engine/sokoban/validator";
import { Board } from "@/components/sokoban/Board";
import type { SokobanState } from "@/engine/sokoban/types";

type Tool = "wall" | "floor" | "player" | "box" | "goal" | "erase";

const TOOLS: Array<{ id: Tool; label: string }> = [
  { id: "wall", label: "Wall" },
  { id: "floor", label: "Floor" },
  { id: "player", label: "Player" },
  { id: "box", label: "Box" },
  { id: "goal", label: "Goal" },
  { id: "erase", label: "Erase" },
];

type Props = {
  onSolve: (ascii: string) => void;
};

export function LevelEditor({ onSolve }: Props) {
  const [width] = useState(9);
  const [height] = useState(7);
  const [tool, setTool] = useState<Tool>("wall");
  const [walls, setWalls] = useState(() => emptyGrid(9, 7).walls);
  const [floors, setFloors] = useState(() => emptyGrid(9, 7).floors);
  const [goals, setGoals] = useState<Set<number>>(() => new Set());
  const [boxes, setBoxes] = useState<Set<number>>(() => new Set());
  const [player, setPlayer] = useState<number>(pack(2, 2));
  const [message, setMessage] = useState<string>("Click cells to paint a puzzle.");

  const board = useMemo(
    () => createBoard({ width, height, walls, goals, floors }),
    [width, height, walls, goals, floors],
  );
  const state: SokobanState = useMemo(
    () => createState(player, boxes),
    [player, boxes],
  );

  const paint = (cell: number) => {
    const pos = unpack(cell);
    if (pos.x === 0 || pos.y === 0 || pos.x === width - 1 || pos.y === height - 1) {
      if (tool !== "wall" && tool !== "erase") {
        setMessage("The outer ring stays a wall so the puzzle remains closed.");
        return;
      }
    }
    const nextWalls = new Set(walls);
    const nextFloors = new Set(floors);
    const nextGoals = new Set(goals);
    const nextBoxes = new Set(boxes);
    let nextPlayer = player;

    const makeFloor = () => {
      nextWalls.delete(cell);
      nextFloors.add(cell);
    };

    if (tool === "wall") {
      nextWalls.add(cell);
      nextFloors.delete(cell);
      nextGoals.delete(cell);
      nextBoxes.delete(cell);
      if (nextPlayer === cell) nextPlayer = pack(1, 1);
    } else if (tool === "floor" || tool === "erase") {
      makeFloor();
      nextGoals.delete(cell);
      nextBoxes.delete(cell);
      if (tool === "erase" && nextPlayer === cell) nextPlayer = pack(1, 1);
    } else if (tool === "goal") {
      makeFloor();
      nextGoals.add(cell);
    } else if (tool === "box") {
      makeFloor();
      nextBoxes.add(cell);
      if (nextPlayer === cell) nextPlayer = pack(1, 1);
    } else if (tool === "player") {
      makeFloor();
      nextBoxes.delete(cell);
      nextPlayer = cell;
    }

    setWalls(nextWalls);
    setFloors(nextFloors);
    setGoals(nextGoals);
    setBoxes(nextBoxes);
    setPlayer(nextPlayer);
  };

  const validate = () => {
    const result = validateLevel(board, state);
    setMessage(result.ok ? "Level looks playable." : result.issues.map((issue) => issue.message).join(" "));
    return result.ok;
  };

  const clear = () => {
    const empty = emptyGrid(width, height);
    setWalls(empty.walls);
    setFloors(empty.floors);
    setGoals(new Set());
    setBoxes(new Set());
    setPlayer(pack(2, 2));
    setMessage("Board cleared.");
  };

  const randomize = () => {
    const generated = randomLevel(width, height, 2);
    setWalls(new Set(generated.board.walls));
    setFloors(new Set(generated.board.floors));
    setGoals(new Set(generated.board.goals));
    setBoxes(new Set(generated.state.boxes));
    setPlayer(generated.state.player);
    setMessage("Random level generated. Validate it before solving.");
  };

  return (
    <div className="mx-auto grid max-w-5xl gap-8 px-4 py-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
      <div>
        <p className="text-[11px] uppercase tracking-[0.18em] text-faint">Level editor</p>
        <h1 className="mt-2 font-serif text-3xl tracking-tight">Draw a puzzle.</h1>
        <div className="mt-4 flex flex-wrap gap-1">
          {TOOLS.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={tool === item.id}
              onClick={() => setTool(item.id)}
              className={[
                "rounded-full border px-3 py-1 text-xs",
                tool === item.id ? "border-text bg-text text-void" : "border-line text-mute",
              ].join(" ")}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="mt-6 overflow-auto rounded-2xl border border-line bg-canvas p-4">
          <Board board={board} state={state} maxSize={360} onCellClick={paint} />
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <p className="text-sm leading-relaxed text-mute">{message}</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="rounded-full border border-line px-3 py-1.5 text-xs" onClick={validate}>
            Validate Level
          </button>
          <button
            type="button"
            className="rounded-full bg-text px-3 py-1.5 text-xs text-void"
            onClick={() => {
              if (!validate()) return;
              onSolve(stringifyLevel(board, state));
            }}
          >
            Solve
          </button>
          <button type="button" className="rounded-full border border-line px-3 py-1.5 text-xs" onClick={clear}>
            Clear
          </button>
          <button type="button" className="rounded-full border border-line px-3 py-1.5 text-xs" onClick={randomize}>
            Random Level
          </button>
        </div>
        <p className="text-xs text-faint">
          Keyboard controls are disabled here so you can type and click freely.
        </p>
      </div>
    </div>
  );
}
