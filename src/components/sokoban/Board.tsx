import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { manhattanPacked, pack, unpack } from "@/utils/coordinates";
import type { Board, SokobanState } from "@/engine/sokoban/types";
import { Cell } from "@/components/sokoban/Cell";
import { Box } from "@/components/sokoban/Box";
import { Player } from "@/components/sokoban/Player";
import { useTrackedBoxes } from "@/components/sokoban/trackBoxes";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

type Props = {
  board: Board;
  state: SokobanState;
  maxSize?: number;
  highlight?: number[];
  compact?: boolean;
  onCellClick?: (cell: number) => void;
};

export function Board({ board, state, maxSize = 520, highlight = [], compact, onCellClick }: Props) {
  const reducedMotion = usePrefersReducedMotion();
  const frameRef = useRef<HTMLDivElement>(null);
  const [avail, setAvail] = useState(maxSize);

  useEffect(() => {
    const element = frameRef.current;
    if (!element) return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? maxSize;
      setAvail(width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [maxSize]);

  const size = useMemo(() => {
    const cap = compact ? Math.min(maxSize, 320) : maxSize;
    const fromCap = Math.floor(cap / Math.max(board.width, board.height));
    const fromWidth = Math.floor(avail / board.width);
    return Math.max(16, Math.min(fromCap, fromWidth || fromCap));
  }, [board.width, board.height, maxSize, avail, compact]);

  const resetKey = `${board.width}x${board.height}:${[...board.goals].sort((a, b) => a - b).join(",")}`;
  const boxes = useTrackedBoxes(state.boxes, resetKey);
  const highlightSet = useMemo(() => new Set(highlight), [highlight]);
  const player = unpack(state.player);

  const committedPlayer = useRef(state.player);
  const lastReset = useRef(resetKey);
  const lastSize = useRef(size);
  if (lastReset.current !== resetKey) {
    lastReset.current = resetKey;
    committedPlayer.current = state.player;
  }
  const sizeSnap = lastSize.current !== size;
  const playerSnap = sizeSnap || manhattanPacked(committedPlayer.current, state.player) > 1;
  useLayoutEffect(() => {
    committedPlayer.current = state.player;
    lastSize.current = size;
  }, [state.player, size]);

  return (
    <div ref={frameRef} className="flex w-full justify-center overflow-hidden">
    <div
      className="relative"
      role="img"
      aria-label="Sokoban board"
      style={{ width: board.width * size, height: board.height * size }}
    >
      <div
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${board.width}, ${size}px)`,
          gridTemplateRows: `repeat(${board.height}, ${size}px)`,
          width: board.width * size,
          height: board.height * size,
        }}
      >
        {Array.from({ length: board.height }, (_, y) =>
          Array.from({ length: board.width }, (_, x) => {
            const cell = pack(x, y);
            const kind = board.walls.has(cell)
              ? "wall"
              : board.goals.has(cell)
                ? "goal"
                : board.floors.has(cell)
                  ? "floor"
                  : "void";
            return onCellClick ? (
              <button
                key={cell}
                type="button"
                aria-label={`Cell ${x},${y}`}
                onClick={() => onCellClick(cell)}
                className="p-0"
              >
                <Cell
                  kind={kind}
                  size={size}
                  x={x}
                  y={y}
                  highlight={highlightSet.has(cell)}
                />
              </button>
            ) : (
              <Cell
                key={cell}
                size={size}
                x={x}
                y={y}
                kind={kind}
                highlight={highlightSet.has(cell)}
              />
            );
          }),
        )}
      </div>
      {boxes.map((box) => {
        const pos = unpack(box.cell);
        return (
          <Box
            key={box.id}
            size={size}
            x={pos.x}
            y={pos.y}
            onGoal={board.goals.has(box.cell)}
            reducedMotion={reducedMotion}
            snap={sizeSnap || box.snap}
          />
        );
      })}
      <Player
        size={size}
        x={player.x}
        y={player.y}
        reducedMotion={reducedMotion}
        snap={playerSnap}
      />
    </div>
    </div>
  );
}
