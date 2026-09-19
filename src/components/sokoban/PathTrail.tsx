import { unpack } from "@/utils/coordinates";

export type TrailSegment = {
  from: number;
  to: number;
};

type Props = {
  trail: TrailSegment[];
  index: number;
  size: number;
  width: number;
  height: number;
  keep?: number;
};

export function PathTrail({ trail, index, size, width, height, keep }: Props) {
  if (trail.length === 0 || index <= 0) return null;
  const start = keep != null ? Math.max(0, index - keep) : 0;
  const end = Math.min(index, trail.length);
  const shown = trail.slice(start, end);
  if (shown.length === 0) return null;

  return (
    <svg
      className="pointer-events-none absolute inset-0"
      width={width * size}
      height={height * size}
      aria-hidden
    >
      {shown.map((segment, offset) => {
        const i = start + offset;
        const a = unpack(segment.from);
        const b = unpack(segment.to);
        const current = i === index - 1;
        const age = index - 1 - i;
        const fade = current ? 1 : Math.max(0.2, 1 - age / Math.max(shown.length, 1));
        return (
          <line
            key={`${segment.from}-${segment.to}-${i}`}
            x1={(a.x + 0.5) * size}
            y1={(a.y + 0.5) * size}
            x2={(b.x + 0.5) * size}
            y2={(b.y + 0.5) * size}
            stroke={current ? "#e8c57a" : "#d7b36a"}
            strokeWidth={current ? Math.max(3, size * 0.12) : Math.max(2, size * 0.08)}
            strokeLinecap="round"
            opacity={fade}
          />
        );
      })}
    </svg>
  );
}
