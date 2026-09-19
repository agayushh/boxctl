import { pieceBoxStyle, usePieceMotion } from "@/components/sokoban/slide";

type Props = {
  size: number;
  x: number;
  y: number;
  onGoal: boolean;
  reducedMotion: boolean;
  snap?: boolean;
};

export function Box({ size, x, y, onGoal, reducedMotion, snap }: Props) {
  const pad = size * 0.16;
  const ref = usePieceMotion(x, y, size, snap, reducedMotion);
  return (
    <div ref={ref} className="pointer-events-none absolute" style={pieceBoxStyle(size)} aria-hidden>
      <div
        className={[
          "absolute rounded-[4px] border",
          onGoal ? "bg-gold/90 border-gold" : "bg-[#c4a36a] border-[#a8884d]",
        ].join(" ")}
        style={{ inset: pad }}
      >
        <div className="absolute inset-[18%] border border-black/20 rounded-[2px]" />
      </div>
    </div>
  );
}
