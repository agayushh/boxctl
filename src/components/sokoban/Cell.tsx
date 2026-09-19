import { memo } from "react";
import type { CellKind } from "@/engine/sokoban/types";

type Props = {
  kind: CellKind;
  size: number;
  x: number;
  y: number;
  highlight?: boolean;
};

function CellInner({ kind, size, x, y, highlight }: Props) {
  const isWall = kind === "wall";
  const isGoal = kind === "goal" || kind === "box-on-goal" || kind === "player-on-goal";
  return (
    <div
      className="relative"
      style={{ width: size, height: size }}
      aria-hidden
      data-cell={`${x},${y}`}
      data-kind={kind}
    >
      <div
        className={[
          "absolute inset-[1px]",
          isWall ? "bg-[#1a1a20] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]" : "bg-[#121216]",
          highlight ? "ring-1 ring-gold/50" : "",
        ].join(" ")}
        style={{ borderRadius: isWall ? 3 : 2 }}
      />
      {isGoal && (
        <div className="absolute inset-0 grid place-items-center pointer-events-none">
          <div className="h-[38%] w-[38%] rotate-45 border border-gold/70" />
        </div>
      )}
    </div>
  );
}

export const Cell = memo(CellInner);
