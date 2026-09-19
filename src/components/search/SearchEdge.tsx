type Props = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  solution: boolean;
  active?: boolean;
  reducedMotion?: boolean;
};

export function SearchEdge({ x1, y1, x2, y2, solution, active }: Props) {
  const color = solution ? "#d7b36a" : active ? "rgba(236,236,239,0.55)" : "rgba(255,255,255,0.12)";
  return (
    <g>
      {solution && (
        <line
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="#d7b36a"
          strokeWidth={6}
          strokeOpacity={0.18}
          strokeLinecap="round"
        />
      )}
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={color}
        strokeWidth={solution ? 2.2 : active ? 1.6 : 1}
        strokeLinecap="round"
      />
    </g>
  );
}
