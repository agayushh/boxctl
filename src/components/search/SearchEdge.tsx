type Props = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  solution: boolean;
  reducedMotion: boolean;
};

export function SearchEdge({ x1, y1, x2, y2, solution, reducedMotion }: Props) {
  const length = Math.hypot(x2 - x1, y2 - y1);
  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke={solution ? "#d7b36a" : "rgba(255,255,255,0.14)"}
      strokeWidth={solution ? 1.8 : 1}
      strokeDasharray={reducedMotion ? undefined : length}
      strokeDashoffset={reducedMotion ? 0 : 0}
      className={reducedMotion ? undefined : "origin-center"}
    />
  );
}
