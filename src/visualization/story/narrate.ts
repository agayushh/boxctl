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
      title: "Looking through possible worlds.",
      body: "The computer is building a graph of box arrangements. Each one is a state. It will keep only the path that actually solves the puzzle.",
      focus: "graph",
    };
  }

  if (args.total <= 1) {
    return {
      kicker: name,
      title: "No route inside this search.",
      body: "You can still play the level by hand. The graph idea is the same: every push is an edge to a new snapshot.",
      focus: "graph",
    };
  }

  if (args.solved || args.index >= args.total - 1) {
    return {
      kicker: "Solved",
      title: `The gold path is the plan — ${args.total - 1} pushes.`,
      body: "Start at the first tiny board, follow the gold edges, and you get this solution. That walk through the graph is the algorithm.",
      focus: "graph",
    };
  }

  if (args.index === 0) {
    return {
      kicker: "A graph",
      title: "This snapshot is one state.",
      body: "The big board and the first tiny board are the same world. Grey boards to the side are other legal pushes — the frontier, a to-do list of states.",
      focus: "frontier",
    };
  }

  if (args.index === 1) {
    return {
      kicker: name,
      title: pickLine(args.algorithm),
      body: pickBody(args.algorithm, args),
      focus: args.algorithm === "bfs" ? "algorithm" : "heuristic",
    };
  }

  if (args.frontierCount > 1 && args.index % 3 === 0) {
    return {
      kicker: "Frontier",
      title: `${args.frontierCount} pushes are possible from here.`,
      body: "Search never tries random keys. It lists the next states, then picks with a rule. Gold is the one this algorithm took.",
      focus: "frontier",
    };
  }

  return {
    kicker: `Push ${args.g}`,
    title: "The gold chain is the path through the graph.",
    body: pickRunningBody(args.algorithm, args),
    focus: "algorithm",
  };
}

function pickLine(algorithm: AlgorithmId): string {
  if (algorithm === "bfs") return "BFS tries pushes in the order it finds them.";
  if (algorithm === "greedy") return "Greedy always chases the smallest leftover guess.";
  return "A* picks the most promising next state.";
}

function pickBody(algorithm: AlgorithmId, args: { g: number; h: number; f: number }): string {
  if (algorithm === "bfs") {
    return "No guessing. That is a queue: first in, first out. Complete, and often slower.";
  }
  if (algorithm === "greedy") {
    return `h = ${args.h} is the guess of remaining pushes. Greedy ignores cost already paid, so it can miss a shorter route.`;
  }
  return `f = g + h = ${args.f}. g is pushes already made. h guesses how many remain. A priority queue always pops the smallest f.`;
}

function pickRunningBody(
  algorithm: AlgorithmId,
  args: { g: number; h: number; f: number },
): string {
  if (algorithm === "bfs") {
    return `This is push ${args.g} on the gold path. BFS got here by expanding a queue — no heuristic, just order.`;
  }
  if (algorithm === "greedy") {
    return `Greedy is following h = ${args.h}. It does not care that g = ${args.g} pushes were already spent.`;
  }
  return `Work already done g = ${args.g}. Leftover guess h = ${args.h}. Combined f = ${args.f}. A* uses that number to decide.`;
}
