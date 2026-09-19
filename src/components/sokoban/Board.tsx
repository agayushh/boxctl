import { useEffect, useMemo, useRef, useState } from "react";
import { pack, unpack } from "@/utils/coordinates";
import type { Board, SokobanState } from "@/engine/sokoban/types";
import { Cell } from "@/components/sokoban/Cell";
import { Box } from "@/components/sokoban/Box";
import { Player } from "@/components/sokoban/Player";
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

  const boxes = useMemo(() => [...state.boxes], [state.boxes]);
  const highlightSet = useMemo(() => new Set(highlight), [highlight]);

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
                : "floor";
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
                kind={kind}
                size={size}
                x={x}
                y={y}
                highlight={highlightSet.has(cell)}
              />
            );
          }),
        )}
      </div>
      {boxes.map((cell) => {
        const pos = unpack(cell);
        return (
          <Box
            key={`box-${cell}`}
            size={size}
            x={pos.x}
            y={pos.y}
            onGoal={board.goals.has(cell)}
            reducedMotion={reducedMotion}
          />
        );
      })}
      <Player
        size={size}
        x={unpack(state.player).x}
        y={unpack(state.player).y}
        reducedMotion={reducedMotion}
      />
    </div>
    </div>
  );
}
