import { pack } from "@/utils/coordinates";
import type { Board, SokobanState } from "@/engine/sokoban/types";
import { STORY_CELL, STORY_PAD } from "@/visualization/story/layoutStory";

type Props = {
  board: Board;
  state: SokobanState;
  cell?: number;
};

export function StateGlyph({ board, state, cell = STORY_CELL }: Props) {
  const pad = STORY_PAD / 2;
  const width = board.width * cell + STORY_PAD;
  const height = board.height * cell + STORY_PAD;
  const tiles: Array<{ key: string; x: number; y: number; kind: "wall" | "floor" | "goal" }> = [];

  for (let y = 0; y < board.height; y += 1) {
    for (let x = 0; x < board.width; x += 1) {
      const id = pack(x, y);
      if (board.walls.has(id)) tiles.push({ key: `${x}-${y}`, x, y, kind: "wall" });
      else if (board.floors.has(id)) {
        tiles.push({
          key: `${x}-${y}`,
          x,
          y,
          kind: board.goals.has(id) ? "goal" : "floor",
        });
      }
    }
  }

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden className="block">
      <rect width={width} height={height} rx={4} fill="#0c0c10" />
      {tiles.map((tile) => {
        const x = pad + tile.x * cell;
        const y = pad + tile.y * cell;
        const inset = 0.4;
        if (tile.kind === "wall") {
          return (
            <rect
              key={tile.key}
              x={x + inset}
              y={y + inset}
              width={cell - inset * 2}
              height={cell - inset * 2}
              rx={0.6}
              fill="#3a3a46"
            />
          );
        }
        return (
          <rect
            key={tile.key}
            x={x + inset}
            y={y + inset}
            width={cell - inset * 2}
            height={cell - inset * 2}
            rx={0.5}
            fill="#16161c"
            stroke={tile.kind === "goal" ? "rgba(215,179,106,0.7)" : "transparent"}
            strokeWidth={tile.kind === "goal" ? 0.7 : 0}
          />
        );
      })}
      {[...state.boxes].map((box) => {
        const x = (box & 0xff) * cell + pad;
        const y = (box >> 8) * cell + pad;
        const onGoal = board.goals.has(box);
        const m = cell * 0.18;
        return (
          <rect
            key={`b${box}`}
            x={x + m}
            y={y + m}
            width={cell - m * 2}
            height={cell - m * 2}
            rx={1}
            fill={onGoal ? "#d7b36a" : "#c4a45e"}
          />
        );
      })}
      {(() => {
        const x = (state.player & 0xff) * cell + pad;
        const y = (state.player >> 8) * cell + pad;
        return (
          <circle
            cx={x + cell / 2}
            cy={y + cell / 2}
            r={Math.max(1.2, cell * 0.22)}
            fill="#ececef"
          />
        );
      })()}
    </svg>
  );
}
