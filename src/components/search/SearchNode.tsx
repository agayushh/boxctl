import type { LayoutNode } from "@/visualization/search/graphLayout";

type Props = {
  node: LayoutNode;
  current: boolean;
  onPath: boolean;
  dim?: boolean;
  reducedMotion: boolean;
  onSelect: (id: string) => void;
};

export function SearchNode({ node, current, onPath, dim, reducedMotion, onSelect }: Props) {
  if (node.id === "__agg") {
    return (
      <g transform={`translate(${node.x}, ${node.y})`} opacity={0.7}>
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

  const r = current ? 7 : onPath ? 5.5 : node.status === "deadlock" ? 4.5 : 3.6;
  const fill = current
    ? "#ececef"
    : onPath
      ? "#d7b36a"
      : node.status === "deadlock"
        ? "#d07a7a"
        : node.status === "frontier"
          ? "#1c2438"
          : "#6d6d78";
  const stroke = current
    ? "#ececef"
    : node.status === "frontier" && !onPath
      ? "#8aa4e8"
      : onPath
        ? "#d7b36a"
        : "transparent";

  return (
    <g
      transform={`translate(${node.x}, ${node.y})`}
      opacity={dim && !current && !onPath ? 0.28 : 1}
    >
      <title>{`g=${node.g}  h=${node.h}  f=${node.f}`}</title>
      {current && (
        <circle
          r={r + 10}
          fill="none"
          stroke="#ececef"
          strokeOpacity={0.28}
          className={reducedMotion ? undefined : "animate-pulse"}
        />
      )}
      {current && <circle r={r + 5} fill="#ececef" fillOpacity={0.08} />}
      {onPath && !current && <circle r={r + 4} fill="#d7b36a" fillOpacity={0.14} />}
      {node.status === "deadlock" && !onPath ? (
        <rect
          x={-4.2}
          y={-4.2}
          width={8.4}
          height={8.4}
          transform="rotate(45)"
          fill={fill}
        />
      ) : (
        <circle r={r} fill={fill} stroke={stroke} strokeWidth={1.5} />
      )}
      {current && (
        <text
          y={-14}
          textAnchor="middle"
          fill="#ececef"
          fontSize="10"
          fontFamily="IBM Plex Mono, monospace"
        >
          f={node.f}
        </text>
      )}
      <circle
        r={12}
        fill="transparent"
        className="cursor-pointer"
        onClick={() => onSelect(node.id)}
      >
        <title>Inspect this state</title>
      </circle>
    </g>
  );
}
