import { pieceBoxStyle, usePieceMotion } from "@/components/sokoban/slide";

type Props = {
  size: number;
  x: number;
  y: number;
  reducedMotion: boolean;
  snap?: boolean;
};

export function Player({ size, x, y, reducedMotion, snap }: Props) {
  const dim = size * 0.34;
  const ref = usePieceMotion(x, y, size, snap, reducedMotion);
  return (
    <div
      ref={ref}
      className="pointer-events-none absolute grid place-items-center"
      style={pieceBoxStyle(size)}
      aria-label="Player"
    >
      <span
        className="block rounded-full bg-[#f3f1ea] shadow-[0_0_0_1px_rgba(0,0,0,0.35)]"
        style={{ width: dim, height: dim }}
      />
    </div>
  );
}
