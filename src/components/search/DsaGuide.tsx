import type { AlgorithmId } from "@/engine/search/types";

type Focus = "graph" | "frontier" | "heuristic" | "algorithm";

export function DsaGuide({ focus, algorithm }: { focus: Focus; algorithm: AlgorithmId }) {
  const items: Array<{ id: Focus; name: string; blurb: string }> = [
    {
      id: "graph",
      name: "Graph",
      blurb: "A snapshot of the puzzle is a node. A box push is an edge.",
    },
    {
      id: "frontier",
      name: "Frontier",
      blurb:
        algorithm === "bfs"
          ? "A queue: the oldest leftover state is tried next."
          : "A priority queue: the most promising leftover state is tried next.",
    },
    {
      id: "heuristic",
      name: "Heuristic h",
      blurb:
        algorithm === "bfs"
          ? "BFS ignores h. It only cares about discovery order."
          : "A guess of remaining pushes, by matching boxes to goals around walls.",
    },
    {
      id: "algorithm",
      name: algorithm === "bfs" ? "Queue" : algorithm === "greedy" ? "h only" : "f = g + h",
      blurb:
        algorithm === "bfs"
          ? "First in, first out. Optimal for unweighted push cost, often slower."
          : algorithm === "greedy"
            ? "Always follow the smallest h. Fast, and it can miss a shorter route."
            : "g is cost paid. h is the guess. A* always expands the smallest f.",
    },
  ];

  return (
    <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => {
        const active = item.id === focus;
        return (
          <li
            key={item.id}
            className={[
              "rounded-xl border px-3 py-2",
              active ? "border-gold/40 bg-gold/10" : "border-line",
            ].join(" ")}
          >
            <p
              className={
                active
                  ? "text-[11px] uppercase tracking-[0.16em] text-gold"
                  : "text-[11px] uppercase tracking-[0.16em] text-faint"
              }
            >
              {item.name}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-mute">{item.blurb}</p>
          </li>
        );
      })}
    </ul>
  );
}
