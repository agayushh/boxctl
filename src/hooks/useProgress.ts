import { useCallback, useEffect, useState } from "react";
import type { SolutionStep } from "@/engine/search/types";

export type SolvedRun = {
  pushes: number;
  moves: number;
  at: number;
  steps?: SolutionStep[];
};

type Progress = {
  solved: Record<number, SolvedRun>;
};

const KEY = "heuristic-campaign-v1";

function load(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { solved: {} };
    const parsed = JSON.parse(raw) as Progress;
    return { solved: parsed.solved ?? {} };
  } catch {
    return { solved: {} };
  }
}

export function useProgress() {
  const [progress, setProgress] = useState<Progress>({ solved: {} });

  useEffect(() => {
    setProgress(load());
  }, []);

  const persist = useCallback((next: Progress) => {
    setProgress(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  }, []);

  const markSolved = useCallback(
    (id: number, run: Omit<SolvedRun, "at">) => {
      const current = load();
      const prev = current.solved[id];
      const better =
        !prev ||
        run.pushes < prev.pushes ||
        (run.pushes === prev.pushes && run.moves < prev.moves);
      if (!better) {
        if (prev && !prev.steps?.length && run.steps?.length) {
          const saved = { ...prev, steps: run.steps };
          persist({ solved: { ...current.solved, [id]: saved } });
          return saved;
        }
        return prev!;
      }
      const saved = { ...run, at: Date.now() };
      persist({ solved: { ...current.solved, [id]: saved } });
      return saved;
    },
    [persist],
  );

  const solvedCount = Object.keys(progress.solved).length;
  return { progress, markSolved, solvedCount };
}
