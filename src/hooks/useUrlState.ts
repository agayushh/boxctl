import { useCallback, useEffect, useState } from "react";
import type { AlgorithmId } from "@/engine/search/types";
import { decodePuzzle, encodePuzzle } from "@/utils/encodePuzzle";

export type ViewId = "landing" | "lab" | "how" | "editor" | "compare" | "cinema";

export type PlayMode = "play" | "watch" | "compare";

export type UrlState = {
  view: ViewId;
  level: string;
  algo: AlgorithmId;
  vs: AlgorithmId;
  explain: boolean;
  puzzle: string | null;
  mode: PlayMode;
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

function parseMode(value: string | null): PlayMode {
  if (value === "watch" || value === "compare" || value === "play") return value;
  return "play";
}

export function readUrl(): UrlState {
  const params = new URLSearchParams(window.location.search);
  return {
    view: parseView(params.get("view"), params.get("mode")),
    level: params.get("level") ?? "1",
    algo: parseAlgo(params.get("algo"), "astar"),
    vs: parseAlgo(params.get("vs"), "bfs"),
    explain: params.get("explain") !== "0",
    puzzle: params.get("puzzle") ? decodePuzzle(params.get("puzzle")!) : null,
    mode: parseMode(params.get("play")),
  };
}

export function writeUrl(state: UrlState): void {
  const params = new URLSearchParams();
  if (state.view !== "landing") params.set("view", state.view);
  if (state.view === "cinema") params.set("mode", "cinema");
  if (state.level !== "1") params.set("level", state.level);
  if (state.algo !== "astar") params.set("algo", state.algo);
  if (state.view === "compare" && state.vs !== "bfs") params.set("vs", state.vs);
  if (state.mode !== "play" && state.view !== "cinema") params.set("play", state.mode);
  if (!state.explain) params.set("explain", "0");
  if (state.puzzle) params.set("puzzle", encodePuzzle(state.puzzle));
  const qs = params.toString();
  const url = `${window.location.pathname}${qs ? `?${qs}` : ""}`;
  window.history.replaceState(null, "", url);
}

const FALLBACK: UrlState = {
  view: "landing",
  level: "1",
  algo: "astar",
  vs: "bfs",
  explain: true,
  puzzle: null,
  mode: "play",
};

export function useUrlState() {
  const [state, setState] = useState<UrlState>(() =>
    typeof window === "undefined" ? FALLBACK : readUrl(),
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
