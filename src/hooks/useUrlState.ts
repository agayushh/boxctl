import { useCallback, useEffect, useState } from "react";
import type { AlgorithmId } from "@/engine/search/types";
import { decodePuzzle, encodePuzzle } from "@/utils/encodePuzzle";

export type ViewId = "landing" | "lab" | "how" | "editor" | "compare" | "cinema";

export type UrlState = {
  view: ViewId;
  level: string;
  algo: AlgorithmId;
  vs: AlgorithmId;
  explain: boolean;
  puzzle: string | null;
};

const ALGOS: AlgorithmId[] = ["astar", "bfs", "greedy", "idastar", "beam"];

function parseAlgo(value: string | null, fallback: AlgorithmId): AlgorithmId {
  return ALGOS.includes(value as AlgorithmId) ? (value as AlgorithmId) : fallback;
}

function parseView(value: string | null, mode: string | null): ViewId {
  if (mode === "cinema") return "cinema";
  if (value === "lab" || value === "how" || value === "editor" || value === "compare" || value === "cinema" || value === "landing") {
    return value;
  }
  return "landing";
}

export function readUrl(): UrlState {
  const params = new URLSearchParams(window.location.search);
  return {
    view: parseView(params.get("view"), params.get("mode")),
    level: params.get("level") ?? "tutorial",
    algo: parseAlgo(params.get("algo"), "astar"),
    vs: parseAlgo(params.get("vs"), "bfs"),
    explain: params.get("explain") !== "0",
    puzzle: params.get("puzzle") ? decodePuzzle(params.get("puzzle")!) : null,
  };
}

export function writeUrl(state: UrlState): void {
  const params = new URLSearchParams();
  if (state.view !== "landing") params.set("view", state.view);
  if (state.view === "cinema") params.set("mode", "cinema");
  if (state.level !== "tutorial") params.set("level", state.level);
  if (state.algo !== "astar") params.set("algo", state.algo);
  if (state.view === "compare" && state.vs !== "bfs") params.set("vs", state.vs);
  if (!state.explain) params.set("explain", "0");
  if (state.puzzle) params.set("puzzle", encodePuzzle(state.puzzle));
  const qs = params.toString();
  const url = `${window.location.pathname}${qs ? `?${qs}` : ""}`;
  window.history.replaceState(null, "", url);
}

export function useUrlState() {
  const [state, setState] = useState<UrlState>(() =>
    typeof window === "undefined"
      ? {
          view: "landing",
          level: "tutorial",
          algo: "astar",
          vs: "bfs",
          explain: true,
          puzzle: null,
        }
      : readUrl(),
  );

  useEffect(() => {
    writeUrl(state);
  }, [state]);

  const patch = useCallback((partial: Partial<UrlState>) => {
    setState((current) => ({ ...current, ...partial }));
  }, []);

  const shareUrl = useCallback(() => {
    writeUrl(state);
    return window.location.href;
  }, [state]);

  return { state, patch, shareUrl };
}
