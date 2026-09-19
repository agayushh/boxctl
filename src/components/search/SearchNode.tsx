import type { LayoutNode } from "@/visualization/search/graphLayout";

type Props = {
  node: LayoutNode;
  current: boolean;
  reducedMotion: boolean;
  onSelect: (id: string) => void;
};

export function SearchNode({ node, current, reducedMotion, onSelect }: Props) {
  if (node.id === "__agg") {
    return (
      <g transform={`translate(${node.x}, ${node.y})`}>
        <text
          textAnchor="middle"
          fill="#8b8b98"
          fontSize="10"
          fontFamily="IBM Plex Mono, monospace"
        >
          +{node.hiddenCount}
        </text>
      </g>
    );
  }

  const r = current ? 7 : node.status === "solution" ? 5.5 : node.status === "deadlock" ? 5 : 4;
  const fill =
    node.status === "evaluating" || current
      ? "#ececef"
      : node.status === "solution"
        ? "#d7b36a"
        : node.status === "deadlock"
          ? "#d07a7a"
          : node.status === "frontier"
            ? "transparent"
            : node.status === "pruned"
              ? "transparent"
              : "#6d6d78";
  const stroke =
    node.status === "frontier"
      ? "#8aa4e8"
      : node.status === "pruned"
        ? "#5c5c68"
        : current
          ? "#ececef"
          : "transparent";

  return (
    <g
      transform={`translate(${node.x}, ${node.y})`}
      className={reducedMotion || !current ? undefined : "origin-center"}
    >
      <title>
        {`g=${node.g} h=${node.h} f=${node.f}`}
      </title>
      <circle
        r={current ? r + 5 : 0}
        fill="none"
        stroke="#ececef"
        strokeOpacity={current ? 0.25 : 0}
        className={current && !reducedMotion ? "animate-pulse" : undefined}
      />
      {node.status === "deadlock" ? (
        <rect
          x={-4.5}
          y={-4.5}
          width={9}
          height={9}
          transform="rotate(45)"
          fill={fill}
          role="img"
        />
      ) : (
        <circle r={r} fill={fill} stroke={stroke} strokeWidth={1.4} />
      )}
      {node.status === "pruned" && (
        <path d="M-3 -3 L3 3 M3 -3 L-3 3" stroke="#5c5c68" strokeWidth="1" />
      )}
      <circle
        r={10}
        fill="transparent"
        className="cursor-pointer"
        onClick={() => onSelect(node.id)}
      >
        <title>Inspect this state</title>
      </circle>
    </g>
  );
}
