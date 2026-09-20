import type { AlgorithmId } from "@/engine/search/types";

export type Narration = {
  kicker: string;
  title: string;
  body: string;
  focus: "graph" | "frontier" | "heuristic" | "algorithm";
};

const NAMES: Record<AlgorithmId, string> = {
  astar: "A*",
  bfs: "BFS",
  greedy: "Greedy",
  idastar: "A*",
  beam: "A*",
};

export function narrate(args: {
  algorithm: AlgorithmId;
  index: number;
  total: number;
  frontierCount: number;
  searching: boolean;
  solved: boolean;
  g: number;
  h: number;
  f: number;
}): Narration {
  const name = NAMES[args.algorithm] ?? "A*";

  if (args.searching) {
    return {
      kicker: name,
      title: "Finding a gold path.",
      body: "Grey boards are legal next pushes. Gold will be the ones this algorithm keeps.",
      focus: "graph",
    };
  }

  if (args.total <= 1) {
    return {
      kicker: name,
      title: "No path in this search.",
      body: "You can still play the level. Every push is still an edge to a new snapshot.",
      focus: "graph",
    };
  }

  if (args.solved) {
    return {
      kicker: "Solved",
      title: `${Math.max(0, args.total - 1)} gold pushes.`,
      body: "Follow the gold chain from start to here. That walk is the solution.",
      focus: "graph",
    };
  }

  if (args.index >= args.total - 1) {
    return {
      kicker: name,
      title: `${Math.max(0, args.total - 1)} pushes before the limit.`,
      body: "Search stopped before a full solution. Replay this walk, switch algorithm, or solve it yourself in Play.",
      focus: "graph",
    };
  }

  if (args.index === 0) {
    return {
      kicker: name,
      title: "This board is one state.",
      body:
        args.frontierCount > 1
          ? `${args.frontierCount} legal pushes from here. Gold “next” is the one this algorithm took.`
          : "Gold “next” is the first push this algorithm takes.",
      focus: "frontier",
    };
  }

  return {
    kicker: `${name} · push ${args.g}`,
    title: pickLine(args.algorithm),
    body: pickBody(args.algorithm, args),
    focus: args.algorithm === "bfs" ? "algorithm" : "heuristic",
  };
}

function pickLine(algorithm: AlgorithmId): string {
  if (algorithm === "bfs") return "BFS takes the oldest state first.";
  if (algorithm === "greedy") return "Greedy chases the smallest leftover guess.";
  return "A* picks the smallest f = g + h.";
}

function pickBody(algorithm: AlgorithmId, args: { g: number; h: number; f: number }): string {
  if (algorithm === "bfs") {
    return `This is push ${args.g}. No guessing — just a queue.`;
  }
  if (algorithm === "greedy") {
    return `h = ${args.h} leftover. It ignores that ${args.g} pushes are already spent.`;
  }
  return `g = ${args.g} done, h = ${args.h} left, f = ${args.f}. Smallest f goes next.`;
}
